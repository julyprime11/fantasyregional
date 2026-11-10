-- Seguridad de Match Admin, perfiles y votaciones (fase 1).
-- Migración ADDITIVA de políticas: no modifica ni elimina datos.
-- Requiere que 20261110110000_fantasy_v3_extra_match_stats.sql esté aplicada.
-- Autorización basada en profiles.voter_role, jamás en user_metadata.
BEGIN;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated;

CREATE OR REPLACE FUNCTION app_private.is_directiva()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.voter_role = 'directiva'
  );
$$;
REVOKE ALL ON FUNCTION app_private.is_directiva() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_directiva() TO authenticated;

-- Perfiles: el trigger de alta (SECURITY DEFINER) sigue creando 'jugador'.
-- Solo directiva puede modificar roles o nombres vía Data API.
-- Se mantiene SELECT entre usuarios autenticados para los miembros Fantasy.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, voter_role) ON public.profiles TO authenticated;
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_directiva ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT app_private.is_directiva()))
  WITH CHECK ((SELECT app_private.is_directiva()));

-- Partidos, convocatoria, eventos y catálogos deportivos:
-- lectura igual que antes; solo directiva tiene mutación directa.
DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'matches', 'match_events', 'clubs', 'competitions',
    'players', 'teams', 'staff', 'seasons'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', v_table);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', v_table);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', v_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      v_table || '_select_public', v_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT app_private.is_directiva()))',
      v_table || '_insert_directiva', v_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((SELECT app_private.is_directiva())) WITH CHECK ((SELECT app_private.is_directiva()))',
      v_table || '_update_directiva', v_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((SELECT app_private.is_directiva()))',
      v_table || '_delete_directiva', v_table
    );
  END LOOP;
END $$;

-- match_players: proteger los 8 nuevos contadores de INSERT/UPDATE
-- directos, incluidos administradores. Se modifican exclusivamente con
-- la RPC privilegiada y con su validación de permiso en el servidor.
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.match_players FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.match_players TO anon, authenticated;
GRANT DELETE ON public.match_players TO authenticated;
GRANT INSERT (
  id, match_id, player_id, team_id, starter, minutes_played,
  goals, assists, yellow_cards, red_cards, clean_sheet,
  created_at, stats_completed, on_field, entered_minute,
  card_dismissed, dismissal_minute, red_card_reason
) ON public.match_players TO authenticated;
GRANT UPDATE (
  id, match_id, player_id, team_id, starter, minutes_played,
  goals, assists, yellow_cards, red_cards, clean_sheet,
  created_at, stats_completed, on_field, entered_minute,
  card_dismissed, dismissal_minute, red_card_reason
) ON public.match_players TO authenticated;
CREATE POLICY match_players_select_public ON public.match_players
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY match_players_insert_directiva ON public.match_players
  FOR INSERT TO authenticated WITH CHECK ((SELECT app_private.is_directiva()));
CREATE POLICY match_players_update_directiva ON public.match_players
  FOR UPDATE TO authenticated
  USING ((SELECT app_private.is_directiva()))
  WITH CHECK ((SELECT app_private.is_directiva()));
CREATE POLICY match_players_delete_directiva ON public.match_players
  FOR DELETE TO authenticated USING ((SELECT app_private.is_directiva()));

-- Votaciones: una cuenta autenticada solo puede escribir sus propias notas
-- durante el periodo de votación, con su rol real y jugadores convocados.
-- Se conserva SELECT histórico para no romper las pantallas de resultados.
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ratings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
CREATE POLICY ratings_select_public ON public.ratings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY ratings_insert_voter ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = (SELECT auth.uid())
    AND voter_role IN ('player','entrenador','cuerpo_tecnico','directiva')
    AND voter_role = (SELECT p.voter_role FROM public.profiles p WHERE p.id=(SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.match_players mp ON mp.match_id=m.id AND mp.player_id=ratings.player_id
      WHERE m.id=ratings.match_id
        AND m.status='voting'
        AND (m.voting_opens_at IS NULL OR m.voting_opens_at <= now())
        AND (m.voting_closes_at IS NULL OR m.voting_closes_at >= now())
    )
  );
CREATE POLICY ratings_update_voter ON public.ratings
  FOR UPDATE TO authenticated
  USING (
    voter_id=(SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id=ratings.match_id AND m.status='voting'
        AND (m.voting_opens_at IS NULL OR m.voting_opens_at <= now())
        AND (m.voting_closes_at IS NULL OR m.voting_closes_at >= now())
    )
  )
  WITH CHECK (
    voter_id=(SELECT auth.uid())
    AND voter_role IN ('player','entrenador','cuerpo_tecnico','directiva')
    AND voter_role=(SELECT p.voter_role FROM public.profiles p WHERE p.id=(SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.match_players mp ON mp.match_id=m.id AND mp.player_id=ratings.player_id
      WHERE m.id=ratings.match_id AND m.status='voting'
        AND (m.voting_opens_at IS NULL OR m.voting_opens_at <= now())
        AND (m.voting_closes_at IS NULL OR m.voting_closes_at >= now())
    )
  );
CREATE POLICY ratings_delete_voter ON public.ratings
  FOR DELETE TO authenticated
  USING (
    voter_id=(SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id=ratings.match_id AND m.status='voting'
        AND (m.voting_opens_at IS NULL OR m.voting_opens_at <= now())
        AND (m.voting_closes_at IS NULL OR m.voting_closes_at >= now())
    )
  );

-- La creación de perfiles se ejecuta automáticamente mediante el trigger
-- de auth.users, no como RPC pública.
REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

-- Reducir superficie RPC: estas funciones solo deben ser utilizadas por
-- cuentas autenticadas, además de las comprobaciones RLS sobre sus tablas.
REVOKE ALL ON FUNCTION public.increment_match_player_stat(uuid,uuid,text,integer)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.increment_match_player_stat(uuid,uuid,text,integer)
  TO authenticated;
REVOKE ALL ON FUNCTION public.perform_match_substitution(uuid,uuid,uuid)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.perform_match_substitution(uuid,uuid,uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.finalize_match_player_minutes(uuid)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalize_match_player_minutes(uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.register_live_goal_without_player(uuid,uuid,boolean)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_live_goal_without_player(uuid,uuid,boolean)
  TO authenticated;
REVOKE ALL ON FUNCTION public.register_match_goal_without_player(uuid,uuid,integer,boolean)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_match_goal_without_player(uuid,uuid,integer,boolean)
  TO authenticated;

COMMIT;
