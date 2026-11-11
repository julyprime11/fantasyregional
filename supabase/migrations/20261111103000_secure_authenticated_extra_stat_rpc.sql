-- Las estadísticas Fantasy V3 pueden guardarse con la sesión Directiva.
-- La RPC sigue siendo transaccional y valida permisos también en PostgreSQL.
-- Se conserva íntegra la lógica de puntos, bloqueo de filas y eventos.
BEGIN;

CREATE OR REPLACE FUNCTION public.increment_match_player_extra_stat(p_match_id uuid, p_entry_id uuid, p_field text, p_delta integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_player_id uuid;
  v_version text;
  v_status text;
  v_position text;
  v_value integer;
  v_team_id uuid;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_scoring_team_id uuid;
  v_phase text;
  v_clock_seconds integer;
  v_clock_started_at timestamptz;
  v_goal_minute integer;
  v_event_id uuid;
BEGIN
  -- Una función SECURITY DEFINER evita RLS: comprobamos el rol real
  -- de la sesión antes de acceder a cualquier jugador o partido.
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT app_private.is_directiva()) THEN
    RAISE EXCEPTION 'No tienes permisos para modificar las estadísticas del partido'
      USING ERRCODE = '42501';
  END IF;

  IF p_field NOT IN ('penalties_won', 'penalties_conceded', 'penalties_missed', 'penalties_saved', 'errors_leading_to_goal', 'errors_leading_to_chance', 'big_chances_missed', 'own_goals') OR p_field IS NULL THEN
    RAISE EXCEPTION 'Estadística no permitida' USING ERRCODE = '22023';
  END IF;
  IF p_delta NOT IN (-1, 1) OR p_delta IS NULL THEN
    RAISE EXCEPTION 'Incremento inválido' USING ERRCODE = '22023';
  END IF;

  SELECT player_id, team_id INTO v_player_id, v_team_id
  FROM public.match_players
  WHERE id = p_entry_id AND match_id = p_match_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no encontrado en el partido'
      USING ERRCODE = '22023';
  END IF;

  SELECT fantasy_scoring_version, status, live_phase,
         home_team_id, away_team_id, live_clock_seconds, live_clock_started_at
    INTO v_version, v_status, v_phase,
         v_home_team_id, v_away_team_id, v_clock_seconds, v_clock_started_at
  FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND OR v_version <> 'v3' THEN
    RAISE EXCEPTION 'Estadísticas nuevas disponibles solo en partidos V3'
      USING ERRCODE = '22023';
  END IF;
  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'No puedes modificar estadísticas de un partido cerrado'
      USING ERRCODE = '42501';
  END IF;

  IF p_field = 'penalties_saved' THEN
    SELECT position INTO v_position FROM public.players WHERE id = v_player_id;
    IF v_position IS DISTINCT FROM 'GK' THEN
      RAISE EXCEPTION 'Solo un portero puede registrar penaltis parados'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_field = 'own_goals' AND p_delta = 1 THEN
    -- El evento y el contador se escriben en la misma transacción.
    IF v_phase NOT IN ('first_half', 'second_half') THEN
      RAISE EXCEPTION 'Los goles en propia puerta se registran durante el partido en directo'
        USING ERRCODE = '22023';
    END IF;
    v_scoring_team_id := CASE
      WHEN v_team_id = v_home_team_id THEN v_away_team_id
      WHEN v_team_id = v_away_team_id THEN v_home_team_id
      ELSE NULL
    END;
    IF v_scoring_team_id IS NULL THEN
      RAISE EXCEPTION 'El jugador no pertenece a un equipo del partido'
        USING ERRCODE = '22023';
    END IF;
    v_goal_minute := greatest(1, least(150, ceil((
      coalesce(v_clock_seconds, 0) +
      CASE WHEN v_clock_started_at IS NULL THEN 0
           ELSE greatest(0, extract(epoch FROM clock_timestamp() - v_clock_started_at))
      END
    ) / 60.0)::integer));
  END IF;

  EXECUTE format('SELECT %I FROM public.match_players WHERE id = $1', p_field)
    INTO v_value USING p_entry_id;

  IF v_value + p_delta < 0 OR v_value + p_delta > 99 THEN
    RAISE EXCEPTION 'El contador debe estar entre 0 y 99'
      USING ERRCODE = '22023';
  END IF;

  EXECUTE format(
    'UPDATE public.match_players SET %I = %I + $1 WHERE id = $2 RETURNING %I',
    p_field, p_field, p_field
  ) INTO v_value USING p_delta, p_entry_id;

  IF p_field = 'own_goals' THEN
    IF p_delta = 1 THEN
      INSERT INTO public.match_events (
        match_id, event_type, player_id, minute,
        scoring_team_id, is_own_goal, source_match_player_id
      ) VALUES (
        p_match_id, 'goal', v_player_id, v_goal_minute,
        v_scoring_team_id, true, p_entry_id
      );
    ELSE
      -- Solo se retira el último evento creado desde ESTE contador.
      -- Los eventos manuales y los históricos anteriores se conservan.
      SELECT id INTO v_event_id
      FROM public.match_events
      WHERE match_id = p_match_id
        AND source_match_player_id = p_entry_id
        AND event_type = 'goal'
        AND is_own_goal
      ORDER BY created_at DESC, id DESC
      LIMIT 1 FOR UPDATE;
      IF v_event_id IS NOT NULL THEN
        DELETE FROM public.match_events WHERE id = v_event_id;
      END IF;
    END IF;
  END IF;

  RETURN v_value;
END;
$function$;

-- SECURITY DEFINER no implica permiso de acceso. Solo permitimos
-- invocarla a usuarios autenticados (con comprobación de Directiva dentro).
REVOKE ALL ON FUNCTION public.increment_match_player_extra_stat(uuid, uuid, text, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_match_player_extra_stat(uuid, uuid, text, integer)
  TO authenticated;

COMMIT;
