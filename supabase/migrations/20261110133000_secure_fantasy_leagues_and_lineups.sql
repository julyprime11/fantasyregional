-- Fase 2: proteger los cuatro conjuntos Fantasy actualmente sin RLS.
-- Preserva la lectura de las alineaciones de los miembros para resultados.
-- No introduce cuotas, servicios externos ni modificaciones de datos existentes.
BEGIN;

-- Predicados reutilizables; fuera del esquema expuesto a PostgREST.
CREATE OR REPLACE FUNCTION app_private.can_play_fantasy()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.voter_role IN ('jugador', 'player', 'directiva')
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_league_member(p_league_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_league_members lm
    WHERE lm.league_id = p_league_id
      AND lm.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION app_private.owns_league(p_league_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_leagues l
    WHERE l.id = p_league_id
      AND l.created_by = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION app_private.can_play_fantasy() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_league_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.owns_league(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.can_play_fantasy() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_league_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.owns_league(uuid) TO authenticated;

-- 1. Ligas: los jugadores Fantasy pueden crear ligas a su nombre.
-- Conservar búsqueda por código para usuarios conectados.
ALTER TABLE public.fantasy_leagues ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fantasy_leagues FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.fantasy_leagues TO authenticated;

CREATE POLICY fantasy_leagues_select_authenticated ON public.fantasy_leagues
  FOR SELECT TO authenticated USING (
    created_by = (SELECT auth.uid())
    OR app_private.is_league_member(id)
    OR (SELECT app_private.is_directiva())
  );
CREATE POLICY fantasy_leagues_insert_creator ON public.fantasy_leagues
  FOR INSERT TO authenticated WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT app_private.can_play_fantasy())
  );
CREATE POLICY fantasy_leagues_delete_owner ON public.fantasy_leagues
  FOR DELETE TO authenticated USING (
    created_by = (SELECT auth.uid())
    OR (SELECT app_private.is_directiva())
  );

-- 2. Miembros: un usuario puede apuntarse a sí mismo; el creador
-- puede consultar o eliminar participantes para administrar su liga.
ALTER TABLE public.fantasy_league_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fantasy_league_members FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.fantasy_league_members TO authenticated;

CREATE POLICY fantasy_members_select_allowed ON public.fantasy_league_members
  FOR SELECT TO authenticated USING (
    user_id = (SELECT auth.uid())
    OR app_private.is_league_member(league_id)
    OR app_private.owns_league(league_id)
    OR (SELECT app_private.is_directiva())
  );
CREATE POLICY fantasy_members_insert_self ON public.fantasy_league_members
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT app_private.can_play_fantasy())
    AND app_private.owns_league(league_id)
  );
CREATE POLICY fantasy_members_delete_allowed ON public.fantasy_league_members
  FOR DELETE TO authenticated USING (
    user_id = (SELECT auth.uid())
    OR app_private.owns_league(league_id)
    OR (SELECT app_private.is_directiva())
  );

-- Una invitación no se puede saltar insertando directamente en la tabla
-- de miembros. Esta RPC valida el código y los permisos en la BD.
-- La función está en public por ser un endpoint RPC, pero ejecutable
-- únicamente por sesiones autenticadas.
CREATE OR REPLACE FUNCTION public.join_fantasy_league_by_code(p_code text)
RETURNS TABLE(joined_league_id uuid, already_member boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_league_id uuid;
  v_inserted integer;
BEGIN
  IF v_user IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_user AND p.voter_role IN ('jugador','player','directiva')
  ) THEN
    RAISE EXCEPTION 'No autorizado para participar en Fantasy'
      USING ERRCODE = '42501';
  END IF;

  IF p_code IS NULL OR char_length(btrim(p_code)) < 4
    OR char_length(btrim(p_code)) > 12 THEN
    RAISE EXCEPTION 'Código de liga no válido' USING ERRCODE = '22023';
  END IF;

  SELECT l.id INTO v_league_id
  FROM public.fantasy_leagues l
  WHERE l.code = upper(btrim(p_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe una liga con ese código'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.fantasy_league_members(league_id,user_id)
  VALUES (v_league_id,v_user)
  ON CONFLICT (league_id,user_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN QUERY SELECT v_league_id, (v_inserted = 0);
END;
$;
REVOKE ALL ON FUNCTION public.join_fantasy_league_by_code(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_fantasy_league_by_code(text)
  TO authenticated;

-- 3. Alineaciones: los participantes pueden consultar sus clasificaciones;
-- nadie puede modificar las de otro usuario ni después del cierre.
ALTER TABLE public.fantasy_lineups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fantasy_lineups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fantasy_lineups TO authenticated;

CREATE POLICY fantasy_lineups_select_member ON public.fantasy_lineups
  FOR SELECT TO authenticated USING (
    user_id = (SELECT auth.uid())
    OR app_private.is_league_member(league_id)
    OR app_private.owns_league(league_id)
    OR (SELECT app_private.is_directiva())
  );
CREATE POLICY fantasy_lineups_insert_owner ON public.fantasy_lineups
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT app_private.can_play_fantasy())
    AND app_private.is_league_member(league_id)
    AND locked_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.fantasy_leagues fl ON fl.id = league_id
      WHERE m.id = match_id
        AND fl.team_id IN (m.home_team_id, m.away_team_id)
        AND m.match_date > now() + interval '2 hours'
        AND m.match_date >= fl.created_at
    )
  );
CREATE POLICY fantasy_lineups_update_owner ON public.fantasy_lineups
  FOR UPDATE TO authenticated
  USING (
    (SELECT app_private.is_directiva())
    OR (
      user_id = (SELECT auth.uid())
      AND locked_at IS NULL
      AND app_private.is_league_member(league_id)
    )
  )
  WITH CHECK (
    (SELECT app_private.is_directiva())
    OR (
      user_id = (SELECT auth.uid())
      AND app_private.is_league_member(league_id)
      AND (
        locked_at IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id=match_id AND m.match_date > now() + interval '2 hours'
        )
      )
    )
  );
CREATE POLICY fantasy_lineups_delete_allowed ON public.fantasy_lineups
  FOR DELETE TO authenticated USING (
    app_private.owns_league(league_id)
    OR (SELECT app_private.is_directiva())
    OR (
      user_id = (SELECT auth.uid())
      AND locked_at IS NULL
      AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id=match_id AND m.match_date > now() + interval '2 hours'
      )
    )
  );

-- El cierre automático sigue permitido, pero nunca permite cambiar
-- el capitán o desbloquear una alineación tras el plazo límite.
CREATE OR REPLACE FUNCTION app_private.guard_lineup_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_match_date timestamptz;
BEGIN
  IF NEW.league_id IS DISTINCT FROM OLD.league_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.match_id IS DISTINCT FROM OLD.match_id
  THEN
    RAISE EXCEPTION 'No se puede cambiar la identidad de la alineación.';
  END IF;

  SELECT m.match_date INTO v_match_date
  FROM public.matches m WHERE m.id=OLD.match_id;

  IF OLD.locked_at IS NOT NULL AND NEW.locked_at IS NULL THEN
    RAISE EXCEPTION 'La alineación no puede desbloquearse.';
  END IF;

  IF (OLD.locked_at IS NOT NULL
      OR v_match_date <= now() + interval '2 hours')
     AND NEW.captain_player_id IS DISTINCT FROM OLD.captain_player_id
  THEN
    RAISE EXCEPTION 'La alineación ya está bloqueada.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER fantasy_guard_lineup_updates_trigger
  BEFORE UPDATE ON public.fantasy_lineups
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_lineup_updates();

-- 4. Jugadores del XI: visibilidad para miembros, escritura propia
-- antes de bloquearse. El creador/directiva puede eliminar la liga
-- con sus alineaciones asociadas, sin permitir modificar las ajenas.
ALTER TABLE public.fantasy_lineup_players ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fantasy_lineup_players FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.fantasy_lineup_players TO authenticated;

CREATE POLICY fantasy_lineup_players_select_member
  ON public.fantasy_lineup_players
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.fantasy_lineups l
      WHERE l.id = lineup_id
        AND (
          l.user_id = (SELECT auth.uid())
          OR app_private.is_league_member(l.league_id)
          OR app_private.owns_league(l.league_id)
          OR (SELECT app_private.is_directiva())
        )
    )
  );
CREATE POLICY fantasy_lineup_players_insert_owner
  ON public.fantasy_lineup_players
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT app_private.can_play_fantasy())
    AND EXISTS (
      SELECT 1 FROM public.fantasy_lineups l
      JOIN public.matches m ON m.id=l.match_id
      JOIN public.fantasy_leagues fl ON fl.id=l.league_id
      JOIN public.players p ON p.id=player_id
      WHERE l.id=lineup_id
        AND l.user_id = (SELECT auth.uid())
        AND app_private.is_league_member(l.league_id)
        AND l.locked_at IS NULL
        AND m.match_date > now() + interval '2 hours'
        AND fl.team_id = p.team_id
        AND p.active
    )
  );
CREATE POLICY fantasy_lineup_players_delete_allowed
  ON public.fantasy_lineup_players
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.fantasy_lineups l
      WHERE l.id=lineup_id
        AND (
          app_private.owns_league(l.league_id)
          OR (SELECT app_private.is_directiva())
          OR (
            l.user_id=(SELECT auth.uid())
            AND l.locked_at IS NULL
            AND EXISTS (
              SELECT 1 FROM public.matches m
              WHERE m.id=l.match_id
                AND m.match_date > now() + interval '2 hours'
            )
          )
        )
    )
  );

COMMIT;
