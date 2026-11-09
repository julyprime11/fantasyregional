-- B1: impedir que la Data API pueda escribir un XI parcial o invalido.
-- Ejecutar DESPUES de las migraciones 081500 y 083000.
-- Las comprobaciones del cliente/Next.js siguen dando mensajes amigables;
-- PostgreSQL es la fuente de verdad para la escritura.
BEGIN;

-- Las inserciones/borrados directos del XI ya no estan permitidos.
-- La RPC que sigue valida y sustituye todos los jugadores atomica y
-- exclusivamente para el usuario autenticado dueno de la alineacion.
REVOKE INSERT, UPDATE, DELETE ON public.fantasy_lineup_players FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_own_fantasy_lineup(
  p_league_id uuid,
  p_match_id uuid,
  p_player_ids uuid[],
  p_captain_player_id uuid
)
RETURNS public.fantasy_lineups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_league public.fantasy_leagues%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_lineup public.fantasy_lineups%ROWTYPE;
  v_total integer;
  v_distinct integer;
  v_gk integer;
  v_def integer;
  v_mid integer;
  v_fwd integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesion.'
      USING ERRCODE = '42501';
  END IF;

  IF p_player_ids IS NULL OR cardinality(p_player_ids) <> 11
     OR p_captain_player_id IS NULL
  THEN
    RAISE EXCEPTION 'El XI debe contener exactamente 11 jugadores y un capitan.'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_league FROM public.fantasy_leagues
  WHERE id = p_league_id FOR SHARE;
  IF NOT FOUND OR v_league.moderation_status <> 'active' THEN
    RAISE EXCEPTION 'Liga no disponible.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.fantasy_league_members
    WHERE league_id = p_league_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No perteneces a esta liga.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND
     OR v_match.match_date < v_league.created_at
     OR (
       v_match.home_team_id <> v_league.team_id
       AND v_match.away_team_id <> v_league.team_id
     )
  THEN
    RAISE EXCEPTION 'Partido no valido para esta liga.'
      USING ERRCODE = '22023';
  END IF;

  IF v_match.match_date <= now() + interval '2 hours' THEN
    RAISE EXCEPTION 'El plazo para modificar el XI ha terminado.'
      USING ERRCODE = '42501';
  END IF;

  SELECT count(*),
         count(DISTINCT p.id),
         count(*) FILTER (WHERE p.position = 'GK'),
         count(*) FILTER (WHERE p.position IN ('RB','CB','LB','RWB','LWB')),
         count(*) FILTER (WHERE p.position IN ('DM','CM','AM')),
         count(*) FILTER (WHERE p.position IN ('RW','LW','ST'))
  INTO v_total, v_distinct, v_gk, v_def, v_mid, v_fwd
  FROM unnest(p_player_ids) AS selected(id)
  JOIN public.players p ON p.id = selected.id
  WHERE p.active = true AND p.team_id = v_league.team_id;

  IF v_total <> 11 OR v_distinct <> 11 OR v_gk <> 1
     OR v_def NOT BETWEEN 3 AND 5
     OR v_mid NOT BETWEEN 3 AND 5
     OR v_fwd NOT BETWEEN 1 AND 3
     OR NOT (p_captain_player_id = ANY(p_player_ids))
  THEN
    RAISE EXCEPTION 'La alineacion o el capitan no cumplen las reglas Fantasy.'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_lineup FROM public.fantasy_lineups
  WHERE league_id = p_league_id AND user_id = v_user_id
    AND match_id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.fantasy_lineups (
      league_id, user_id, match_id, captain_player_id
    ) VALUES (
      p_league_id, v_user_id, p_match_id, p_captain_player_id
    )
    RETURNING * INTO v_lineup;
  ELSIF v_lineup.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Esta alineacion esta bloqueada.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.fantasy_lineup_players
  WHERE lineup_id = v_lineup.id
    AND NOT (player_id = ANY(p_player_ids));

  INSERT INTO public.fantasy_lineup_players (lineup_id, player_id)
  SELECT v_lineup.id, input.id
  FROM unnest(p_player_ids) AS input(id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.fantasy_lineup_players existing
    WHERE existing.lineup_id = v_lineup.id AND existing.player_id = input.id
  );

  UPDATE public.fantasy_lineups
  SET captain_player_id = p_captain_player_id,
      updated_at = now()
  WHERE id = v_lineup.id
  RETURNING * INTO v_lineup;

  RETURN v_lineup;
END;
$$;

REVOKE ALL ON FUNCTION public.save_own_fantasy_lineup(uuid, uuid, uuid[], uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_own_fantasy_lineup(uuid, uuid, uuid[], uuid)
TO authenticated;

COMMIT;
