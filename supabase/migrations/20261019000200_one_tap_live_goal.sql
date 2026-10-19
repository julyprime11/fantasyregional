-- Registro rápido de gol sin ficha del jugador, minuto calculado en PostgreSQL.
-- Requiere 20261019000100_unattributed_match_goals.sql aplicada previamente.
create or replace function public.register_live_goal_without_player(
  p_match_id uuid, p_scoring_team_id uuid, p_is_own_goal boolean default false
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_match public.matches%rowtype;
  v_minute integer;
begin
  if (select p.voter_role from public.profiles p where p.id = (select auth.uid())) is distinct from 'directiva'
  then raise exception 'No autorizado para registrar goles.'; end if;
  select * into v_match from public.matches m where m.id = p_match_id for update;
  if not found or v_match.live_phase not in ('first_half', 'second_half')
  then raise exception 'El partido debe estar en directo.'; end if;
  if p_scoring_team_id is distinct from v_match.home_team_id and p_scoring_team_id is distinct from v_match.away_team_id
  then raise exception 'Equipo goleador no válido.'; end if;
  v_minute := greatest(1, least(150, ceil((
    v_match.live_clock_seconds + case when v_match.live_clock_started_at is null then 0
    else greatest(0, extract(epoch from clock_timestamp() - v_match.live_clock_started_at)) end
  ) / 60.0)::integer));
  insert into public.match_events (match_id, event_type, player_id, secondary_player_id, minute, scoring_team_id, is_own_goal)
  values (p_match_id, 'goal', null, null, v_minute, p_scoring_team_id, coalesce(p_is_own_goal, false));
  return v_minute;
end;
$$;
revoke all on function public.register_live_goal_without_player(uuid, uuid, boolean) from public;
grant execute on function public.register_live_goal_without_player(uuid, uuid, boolean) to authenticated;
