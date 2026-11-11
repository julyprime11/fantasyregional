-- Reinicio completo de Match Admin en una sola transacción.
-- Mantiene las columnas Fantasy V3 protegidas frente a UPDATE directo
-- y permite que Directiva restablezca eventos, estadísticas y partido juntos.
BEGIN;

CREATE OR REPLACE FUNCTION public.reset_live_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $reset$
DECLARE
  v_match_id uuid;
BEGIN
  IF NOT (SELECT app_private.is_directiva()) THEN
    RAISE EXCEPTION 'No tienes permisos para reiniciar partidos.'
      USING ERRCODE = '42501';
  END IF;

  IF p_match_id IS NULL THEN
    RAISE EXCEPTION 'Partido no válido.'
      USING ERRCODE = '22023';
  END IF;

  -- Serializa el reinicio con el resto de operaciones de Match Admin.
  SELECT m.id INTO v_match_id
  FROM public.matches m
  WHERE m.id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encuentra el partido.'
      USING ERRCODE = '22023';
  END IF;

  -- Una sola RPC = una transacción: ningún cambio parcial si falla algo.
  DELETE FROM public.match_events
  WHERE match_id = v_match_id;

  -- Se conservan convocatoria, equipo, dorsal y condición de titular.
  UPDATE public.match_players
  SET on_field = false,
      entered_minute = NULL,
      card_dismissed = false,
      dismissal_minute = NULL,
      minutes_played = 0,
      goals = 0,
      assists = 0,
      yellow_cards = 0,
      red_cards = 0,
      red_card_reason = NULL,
      penalties_won = 0,
      penalties_conceded = 0,
      penalties_missed = 0,
      penalties_saved = 0,
      errors_leading_to_goal = 0,
      errors_leading_to_chance = 0,
      big_chances_missed = 0,
      own_goals = 0,
      clean_sheet = false,
      stats_completed = false
  WHERE match_id = v_match_id;

  UPDATE public.matches
  SET home_score = NULL,
      away_score = NULL,
      live_phase = 'not_started',
      live_clock_seconds = 0,
      live_clock_started_at = NULL,
      live_started_at = NULL,
      live_finished_at = NULL,
      status = 'scheduled'
  WHERE id = v_match_id;
END;
$reset$;

REVOKE ALL ON FUNCTION public.reset_live_match(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_live_match(uuid) TO authenticated;

COMMENT ON FUNCTION public.reset_live_match(uuid) IS
  'Reinicio atómico autorizado para Directiva; restaura partido, jugadores y eventos sin escrituras parciales.';

COMMIT;
