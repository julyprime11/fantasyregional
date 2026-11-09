-- B1: aislamiento de ligas Fantasy en la Data API de Supabase.
-- BORRADOR. Revisar con cuentas de prueba antes de aplicar en produccion.
-- Requiere la migracion previa de moderation_status.
BEGIN;

CREATE SCHEMA IF NOT EXISTS fantasy_private;
REVOKE ALL ON SCHEMA fantasy_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA fantasy_private TO authenticated;

-- Funciones de apoyo fuera de los esquemas expuestos por PostgREST.
-- SECURITY DEFINER evita recursividad al leer tablas que tambien tienen RLS.
CREATE OR REPLACE FUNCTION fantasy_private.is_directiva()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND voter_role = 'directiva'
  );
$$;

CREATE OR REPLACE FUNCTION fantasy_private.is_league_member(p_league_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_league_members
    WHERE league_id = p_league_id AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION fantasy_private.is_active_league_member(p_league_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_league_members m
    JOIN public.fantasy_leagues l ON l.id = m.league_id
    WHERE m.league_id = p_league_id
      AND m.user_id = (SELECT auth.uid())
      AND l.moderation_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION fantasy_private.can_read_lineup(p_lineup_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_lineups f
    JOIN public.fantasy_leagues l ON l.id = f.league_id
    WHERE f.id = p_lineup_id AND (
      (SELECT fantasy_private.is_directiva())
      OR (
        l.moderation_status = 'active'
        AND (SELECT fantasy_private.is_league_member(f.league_id))
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION fantasy_private.can_edit_lineup(p_lineup_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_lineups f
    JOIN public.fantasy_leagues l ON l.id = f.league_id
    JOIN public.matches mt ON mt.id = f.match_id
    WHERE f.id = p_lineup_id
      AND f.user_id = (SELECT auth.uid())
      AND l.moderation_status = 'active'
      AND f.locked_at IS NULL
      AND mt.match_date > now() + interval '2 hours'
  );
$$;

REVOKE ALL ON FUNCTION fantasy_private.is_directiva() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION fantasy_private.is_league_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION fantasy_private.is_active_league_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION fantasy_private.can_read_lineup(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION fantasy_private.can_edit_lineup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION fantasy_private.is_directiva() TO authenticated;
GRANT EXECUTE ON FUNCTION fantasy_private.is_league_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fantasy_private.is_active_league_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fantasy_private.can_read_lineup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fantasy_private.can_edit_lineup(uuid) TO authenticated;

ALTER TABLE public.fantasy_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_lineup_players ENABLE ROW LEVEL SECURITY;

-- Evitar combinar estas reglas con politicas permisivas antiguas no revisadas.
CREATE POLICY fantasy_leagues_read_b1 ON public.fantasy_leagues
FOR SELECT TO authenticated
USING (
  moderation_status = 'active'
  OR created_by = (SELECT auth.uid())
  OR (SELECT fantasy_private.is_directiva())
);
CREATE POLICY fantasy_leagues_create_b1 ON public.fantasy_leagues
FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid()) AND moderation_status = 'active'
);
-- UPDATE del estado exclusivamente mediante RPC auditada.
-- DELETE solo admite el rollback de una creacion sin datos vinculados.
CREATE POLICY fantasy_leagues_delete_empty_b1 ON public.fantasy_leagues
FOR DELETE TO authenticated
USING (created_by = (SELECT auth.uid()) AND moderation_status = 'active');

CREATE POLICY fantasy_league_members_read_b1 ON public.fantasy_league_members
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT fantasy_private.is_directiva())
  OR (SELECT fantasy_private.is_league_member(league_id))
);
CREATE POLICY fantasy_league_members_join_b1 ON public.fantasy_league_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.fantasy_leagues l
    WHERE l.id = league_id AND l.moderation_status = 'active'
  )
);
CREATE POLICY fantasy_league_members_leave_b1 ON public.fantasy_league_members
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY fantasy_lineups_read_b1 ON public.fantasy_lineups
FOR SELECT TO authenticated
USING (
  (SELECT fantasy_private.is_directiva())
  OR (SELECT fantasy_private.is_active_league_member(league_id))
);
CREATE POLICY fantasy_lineups_create_b1 ON public.fantasy_lineups
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (SELECT fantasy_private.is_active_league_member(league_id))
);
CREATE POLICY fantasy_lineups_edit_b1 ON public.fantasy_lineups
FOR UPDATE TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND (SELECT fantasy_private.is_active_league_member(league_id))
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (SELECT fantasy_private.is_active_league_member(league_id))
);

CREATE POLICY fantasy_lineup_players_read_b1 ON public.fantasy_lineup_players
FOR SELECT TO authenticated
USING ((SELECT fantasy_private.can_read_lineup(lineup_id)));
CREATE POLICY fantasy_lineup_players_add_b1 ON public.fantasy_lineup_players
FOR INSERT TO authenticated
WITH CHECK ((SELECT fantasy_private.can_edit_lineup(lineup_id)));
CREATE POLICY fantasy_lineup_players_remove_b1 ON public.fantasy_lineup_players
FOR DELETE TO authenticated
USING ((SELECT fantasy_private.can_edit_lineup(lineup_id)));

-- El usuario no puede reescribir la identidad de una alineacion,
-- ni su XI fuera de plazo, ni liberar una alineacion bloqueada.
-- Se permite bloquear la alineacion existente sin modificar otros campos.
CREATE OR REPLACE FUNCTION public.guard_fantasy_lineup_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_is_active boolean;
  v_match_at timestamptz;
BEGIN
  SELECT l.moderation_status = 'active', mt.match_date
    INTO v_is_active, v_match_at
  FROM public.fantasy_leagues l
  JOIN public.matches mt ON mt.id = NEW.match_id
  WHERE l.id = NEW.league_id
  FOR SHARE OF l;

  IF NOT FOUND OR NOT v_is_active THEN
    RAISE EXCEPTION 'Liga no disponible.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.league_id IS DISTINCT FROM OLD.league_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.match_id IS DISTINCT FROM OLD.match_id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'No se puede cambiar la identidad de la alineacion.'
        USING ERRCODE = '42501';
    END IF;

    IF OLD.locked_at IS NOT NULL THEN
      RAISE EXCEPTION 'La alineacion ya esta bloqueada.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.captain_player_id IS DISTINCT FROM OLD.captain_player_id
      AND v_match_at <= now() + interval '2 hours'
    THEN
      RAISE EXCEPTION 'El plazo para editar la alineacion ha terminado.'
        USING ERRCODE = '42501';
    END IF;
  ELSIF v_match_at <= now() + interval '2 hours' THEN
    RAISE EXCEPTION 'El plazo para crear la alineacion ha terminado.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fantasy_lineup_guard_write ON public.fantasy_lineups;
CREATE TRIGGER fantasy_lineup_guard_write
BEFORE INSERT OR UPDATE ON public.fantasy_lineups
FOR EACH ROW EXECUTE FUNCTION public.guard_fantasy_lineup_write();

-- Fijar cambios de miembros frente a carreras con suspension.
-- El bloqueo SHARE de la liga coordina con el UPDATE de moderacion.
CREATE OR REPLACE FUNCTION public.guard_fantasy_membership_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT moderation_status INTO v_status
  FROM public.fantasy_leagues
  WHERE id = NEW.league_id
  FOR SHARE;

  IF NOT FOUND OR v_status <> 'active' THEN
    RAISE EXCEPTION 'La liga no admite inscripciones.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid()
     AND current_user NOT IN ('postgres', 'service_role') THEN
    RAISE EXCEPTION 'No autorizado para inscribir a otro usuario.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fantasy_membership_guard_insert ON public.fantasy_league_members;
CREATE TRIGGER fantasy_membership_guard_insert
BEFORE INSERT ON public.fantasy_league_members
FOR EACH ROW EXECUTE FUNCTION public.guard_fantasy_membership_insert();

-- La eliminacion de una inscripcion NO debe borrar alineaciones en cascada.
CREATE OR REPLACE FUNCTION public.guard_fantasy_membership_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.fantasy_lineups
    WHERE league_id = OLD.league_id AND user_id = OLD.user_id
  ) THEN
    RAISE EXCEPTION 'La inscripcion contiene alineaciones; no se puede borrar.'
      USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS fantasy_membership_guard_delete
ON public.fantasy_league_members;
CREATE TRIGGER fantasy_membership_guard_delete
BEFORE DELETE ON public.fantasy_league_members
FOR EACH ROW EXECUTE FUNCTION public.guard_fantasy_membership_delete();

COMMIT;
