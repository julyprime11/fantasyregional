-- V3: ocho acciones adicionales por jugador/partido.
-- Compatible con jornadas anteriores: cada contador nace a cero.
-- No cambia las versiones de partidos ni reescribe sus estadísticas.
BEGIN;

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS penalties_won integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_penalties_won_range_check
  CHECK (penalties_won BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS penalties_conceded integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_penalties_conceded_range_check
  CHECK (penalties_conceded BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS penalties_missed integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_penalties_missed_range_check
  CHECK (penalties_missed BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS penalties_saved integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_penalties_saved_range_check
  CHECK (penalties_saved BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS errors_leading_to_goal integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_errors_leading_to_goal_range_check
  CHECK (errors_leading_to_goal BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS errors_leading_to_chance integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_errors_leading_to_chance_range_check
  CHECK (errors_leading_to_chance BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS big_chances_missed integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_big_chances_missed_range_check
  CHECK (big_chances_missed BETWEEN 0 AND 99);

ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS own_goals integer NOT NULL DEFAULT 0;
ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_own_goals_range_check
  CHECK (own_goals BETWEEN 0 AND 99);

-- Restricción por columna: ninguna llamada directa desde anon/authenticated
-- puede alterar los ocho contadores. Se mantienen las escrituras de campos
-- antiguos para no romper el funcionamiento actual de Match Admin.
REVOKE UPDATE ON TABLE public.match_players FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
  id, match_id, player_id, team_id, starter, minutes_played,
  goals, assists, yellow_cards, red_cards, clean_sheet,
  created_at, stats_completed, on_field, entered_minute,
  card_dismissed, dismissal_minute, red_card_reason
) ON public.match_players TO anon, authenticated;

-- RPC invocable SOLAMENTE con service_role desde un Server Action
-- que verifica antes los permisos de administración. La transacción
-- bloquea la fila para que dos directivos no pierdan incrementos.
CREATE OR REPLACE FUNCTION public.increment_match_player_extra_stat(
  p_match_id uuid,
  p_entry_id uuid,
  p_field text,
  p_delta integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_player_id uuid;
  v_version text;
  v_status text;
  v_position text;
  v_value integer;
BEGIN
  IF p_field NOT IN ('penalties_won', 'penalties_conceded', 'penalties_missed', 'penalties_saved', 'errors_leading_to_goal', 'errors_leading_to_chance', 'big_chances_missed', 'own_goals') OR p_field IS NULL THEN
    RAISE EXCEPTION 'Estadística no permitida' USING ERRCODE = '22023';
  END IF;
  IF p_delta NOT IN (-1, 1) OR p_delta IS NULL THEN
    RAISE EXCEPTION 'Incremento inválido' USING ERRCODE = '22023';
  END IF;

  SELECT player_id INTO v_player_id
  FROM public.match_players
  WHERE id = p_entry_id AND match_id = p_match_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no encontrado en el partido'
      USING ERRCODE = '22023';
  END IF;

  SELECT fantasy_scoring_version, status
    INTO v_version, v_status
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

  RETURN v_value;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_match_player_extra_stat(uuid, uuid, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_match_player_extra_stat(uuid, uuid, text, integer)
  TO service_role;

COMMIT;
