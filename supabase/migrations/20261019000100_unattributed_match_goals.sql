-- La puntuación usa scoring_team_id (equipo beneficiado por el gol).
-- En los goles existentes con goleador registrado el equipo se infiere por player_id.
alter table public.match_events
  add column if not exists scoring_team_id uuid references public.teams(id) on delete restrict,
  add column if not exists is_own_goal boolean not null default false;

-- Registro acotado: no se concede permiso general de INSERT sobre match_events.
create or replace function public.register_match_goal_without_player(
  p_match_id uuid,
  p_scoring_team_id uuid,
  p_minute integer,
  p_is_own_goal boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_live_phase text;
  v_event_id uuid;
begin
  if (
    select p.voter_role
    from public.profiles as p
    where p.id = (select auth.uid())
  ) is distinct from 'directiva' then
    raise exception 'No tienes permisos para registrar goles.';
  end if;
  if p_minute is null or p_minute not between 1 and 150 then
    raise exception 'El minuto debe estar entre 1 y 150.';
  end if;

  select m.home_team_id, m.away_team_id, m.live_phase
  into v_home_team_id, v_away_team_id, v_live_phase
  from public.matches as m
  where m.id = p_match_id;

  if not found or v_live_phase not in ('first_half', 'second_half') then
    raise exception 'El partido debe estar en directo.';
  end if;
  if p_scoring_team_id is distinct from v_home_team_id
     and p_scoring_team_id is distinct from v_away_team_id then
    raise exception 'El equipo anotador no pertenece al partido.';
  end if;
  if p_is_own_goal is null then
    raise exception 'El tipo de gol no es válido.';
  end if;

  insert into public.match_events (
    match_id, event_type, player_id, secondary_player_id,
    minute, scoring_team_id, is_own_goal
  )
  values (
    p_match_id, 'goal', null, null,
    p_minute, p_scoring_team_id, p_is_own_goal
  )
  returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function public.register_match_goal_without_player(uuid, uuid, integer, boolean) from public;
grant execute on function public.register_match_goal_without_player(uuid, uuid, integer, boolean) to authenticated;
