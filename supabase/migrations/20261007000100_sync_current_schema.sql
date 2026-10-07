begin;

-- =========================================================
-- SCHEMA RECONCILIATION
--
-- Captures database objects already used by the application
-- but missing from the versioned migrations.
--
-- This migration is intentionally idempotent for objects that
-- already exist in the linked Supabase project.
-- =========================================================

-- =========================================================
-- PLAYERS / FFCV
-- =========================================================

alter table public.players
  add column if not exists ffcv_player_code text;

alter table public.players
  add column if not exists ffcv_last_sync_at timestamptz;

create unique index if not exists players_ffcv_player_code_unique
  on public.players(ffcv_player_code)
  where ffcv_player_code is not null;

-- =========================================================
-- MATCH LIVE STATE
-- =========================================================

alter table public.matches
  add column if not exists live_phase text not null default 'not_started';

alter table public.matches
  add column if not exists live_clock_seconds integer not null default 0;

alter table public.matches
  add column if not exists live_clock_started_at timestamptz;

alter table public.matches
  add column if not exists live_started_at timestamptz;

alter table public.matches
  add column if not exists live_finished_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_live_clock_seconds_check'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_live_clock_seconds_check
      check (live_clock_seconds >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_live_phase_check'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_live_phase_check
      check (
        live_phase in (
          'not_started',
          'first_half',
          'halftime',
          'second_half',
          'finished'
        )
      );
  end if;
end;
$$;

-- =========================================================
-- MATCH PLAYER LIVE STATE
-- =========================================================

alter table public.match_players
  add column if not exists on_field boolean not null default false;

alter table public.match_players
  add column if not exists entered_minute integer;

alter table public.match_players
  add column if not exists card_dismissed boolean not null default false;

alter table public.match_players
  add column if not exists dismissal_minute integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'match_players_entered_minute_check'
      and conrelid = 'public.match_players'::regclass
  ) then
    alter table public.match_players
      add constraint match_players_entered_minute_check
      check (entered_minute is null or entered_minute >= 0);
  end if;
end;
$$;

-- =========================================================
-- MATCH EVENTS
-- =========================================================

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),

  match_id uuid not null
    references public.matches(id)
    on delete cascade,

  event_type text not null,

  player_id uuid
    references public.players(id)
    on delete set null,

  secondary_player_id uuid
    references public.players(id)
    on delete set null,

  minute integer not null default 0,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint match_events_event_type_check
    check (
      event_type in (
        'goal',
        'assist',
        'yellow_card',
        'red_card',
        'substitution'
      )
    ),

  constraint match_events_minute_check
    check (minute >= 0)
);

create index if not exists match_events_match_id_idx
  on public.match_events(match_id);

create index if not exists match_events_player_id_idx
  on public.match_events(player_id);

create index if not exists match_events_created_at_idx
  on public.match_events(created_at);

-- =========================================================
-- AUTH PROFILE DEFAULT ROLE
-- Keep the existing auth trigger but update its function
-- to match the linked database.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    voter_role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    ),
    'jugador'
  );

  return new;
end;
$$;

-- =========================================================
-- FINALIZE PLAYER MINUTES
-- =========================================================

create or replace function public.finalize_match_player_minutes(
  p_match_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_phase text;
  v_clock_seconds integer;
  v_clock_started_at timestamptz;
  v_seconds integer;
  v_minute integer;
begin
  select
    live_phase,
    live_clock_seconds,
    live_clock_started_at
  into
    v_phase,
    v_clock_seconds,
    v_clock_started_at
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'El partido no existe.';
  end if;

  v_seconds :=
    coalesce(
      v_clock_seconds,
      0
    );

  if
    v_phase in (
      'first_half',
      'second_half'
    )
    and v_clock_started_at is not null
  then
    v_seconds :=
      v_seconds +
      greatest(
        0,
        floor(
          extract(
            epoch from (
              now() -
              v_clock_started_at
            )
          )
        )::integer
      );
  end if;

  v_minute :=
    floor(
      v_seconds / 60.0
    )::integer;

  if
    v_phase = 'second_half'
  then
    v_minute :=
      greatest(
        90,
        v_minute
      );
  end if;

  update public.match_players
  set
    minutes_played =
      coalesce(
        minutes_played,
        0
      )
      +
      greatest(
        0,
        v_minute -
        coalesce(
          entered_minute,
          v_minute
        )
      ),

    entered_minute = null,

    on_field = false
  where
    match_id = p_match_id
    and on_field = true;
end;
$$;

-- =========================================================
-- LIVE STAT INCREMENT / CORRECTION
-- =========================================================

create or replace function public.increment_match_player_stat(
  p_match_id uuid,
  p_entry_id uuid,
  p_field text,
  p_delta integer
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_entry public.match_players%rowtype;

  v_phase text;
  v_clock_seconds integer;
  v_clock_started_at timestamptz;

  v_seconds integer;
  v_minute integer;

  v_value integer;

  v_event_type text;
  v_event_id uuid;

  v_yellow_cards integer;
  v_red_cards integer;

  v_was_dismissed boolean;
  v_should_be_dismissed boolean;

  v_removed_event_minute integer;
begin
  if p_field not in (
    'goals',
    'assists',
    'yellow_cards',
    'red_cards'
  ) then
    raise exception 'Invalid stat field';
  end if;

  if p_delta not in (-1, 1) then
    raise exception 'Invalid delta';
  end if;

  select *
  into v_entry
  from public.match_players
  where
    match_id = p_match_id
    and id = p_entry_id
  for update;

  if not found then
    raise exception 'Match player not found';
  end if;

  select
    live_phase,
    live_clock_seconds,
    live_clock_started_at
  into
    v_phase,
    v_clock_seconds,
    v_clock_started_at
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  v_seconds :=
    coalesce(
      v_clock_seconds,
      0
    );

  if
    v_phase in (
      'first_half',
      'second_half'
    )
    and v_clock_started_at is not null
  then
    v_seconds :=
      v_seconds +
      greatest(
        0,
        floor(
          extract(
            epoch from (
              now() -
              v_clock_started_at
            )
          )
        )::integer
      );
  end if;

  v_minute :=
    floor(
      v_seconds / 60.0
    )::integer;

  v_event_type :=
    case p_field
      when 'goals'
        then 'goal'

      when 'assists'
        then 'assist'

      when 'yellow_cards'
        then 'yellow_card'

      when 'red_cards'
        then 'red_card'
    end;

  if p_delta = 1 then
    update public.match_players
    set
      goals = case
        when p_field = 'goals'
          then goals + 1
        else goals
      end,

      assists = case
        when p_field = 'assists'
          then assists + 1
        else assists
      end,

      yellow_cards = case
        when p_field = 'yellow_cards'
          then yellow_cards + 1
        else yellow_cards
      end,

      red_cards = case
        when p_field = 'red_cards'
          then red_cards + 1
        else red_cards
      end
    where
      id = p_entry_id
    returning
      yellow_cards,
      red_cards,
      case p_field
        when 'goals'
          then goals

        when 'assists'
          then assists

        when 'yellow_cards'
          then yellow_cards

        when 'red_cards'
          then red_cards
      end
    into
      v_yellow_cards,
      v_red_cards,
      v_value;

    insert into public.match_events (
      match_id,
      event_type,
      player_id,
      minute,
      created_by
    )
    values (
      p_match_id,
      v_event_type,
      v_entry.player_id,
      v_minute,
      auth.uid()
    );

    v_should_be_dismissed :=
      v_yellow_cards >= 2
      or
      v_red_cards >= 1;

    if
      v_should_be_dismissed
      and v_entry.on_field
      and v_phase in (
        'first_half',
        'second_half'
      )
    then
      update public.match_players
      set
        minutes_played =
          coalesce(
            minutes_played,
            0
          )
          +
          greatest(
            0,
            v_minute -
            coalesce(
              entered_minute,
              v_minute
            )
          ),

        on_field = false,

        entered_minute = null,

        card_dismissed = true,

        dismissal_minute = v_minute
      where
        match_id = p_match_id
        and id = p_entry_id;
    end if;

    return v_value;
  end if;

  v_value :=
    case p_field
      when 'goals'
        then v_entry.goals

      when 'assists'
        then v_entry.assists

      when 'yellow_cards'
        then v_entry.yellow_cards

      when 'red_cards'
        then v_entry.red_cards
    end;

  if v_value <= 0 then
    return 0;
  end if;

  select
    id,
    minute
  into
    v_event_id,
    v_removed_event_minute
  from public.match_events
  where
    match_id = p_match_id
    and player_id = v_entry.player_id
    and event_type = v_event_type
  order by
    created_at desc,
    id desc
  limit 1;

  update public.match_players
  set
    goals = case
      when p_field = 'goals'
        then greatest(
          0,
          goals - 1
        )
      else goals
    end,

    assists = case
      when p_field = 'assists'
        then greatest(
          0,
          assists - 1
        )
      else assists
    end,

    yellow_cards = case
      when p_field = 'yellow_cards'
        then greatest(
          0,
          yellow_cards - 1
        )
      else yellow_cards
    end,

    red_cards = case
      when p_field = 'red_cards'
        then greatest(
          0,
          red_cards - 1
        )
      else red_cards
    end
  where
    id = p_entry_id
  returning
    yellow_cards,
    red_cards,
    card_dismissed,

    case p_field
      when 'goals'
        then goals

      when 'assists'
        then assists

      when 'yellow_cards'
        then yellow_cards

      when 'red_cards'
        then red_cards
    end
  into
    v_yellow_cards,
    v_red_cards,
    v_was_dismissed,
    v_value;

  if v_event_id is not null then
    delete from public.match_events
    where id = v_event_id;
  end if;

  v_should_be_dismissed :=
    v_yellow_cards >= 2
    or
    v_red_cards >= 1;

  if
    v_was_dismissed
    and not v_should_be_dismissed
    and v_phase in (
      'first_half',
      'second_half'
    )
  then
    update public.match_players
    set
      on_field = true,

      entered_minute =
        coalesce(
          dismissal_minute,
          v_removed_event_minute,
          v_minute
        ),

      card_dismissed = false,

      dismissal_minute = null
    where
      match_id = p_match_id
      and id = p_entry_id;
  end if;

  return v_value;
end;
$$;

-- =========================================================
-- MATCH SUBSTITUTION
-- =========================================================

create or replace function public.perform_match_substitution(
  p_match_id uuid,
  p_player_out_entry_id uuid,
  p_player_in_entry_id uuid
)
returns table(
  event_id uuid,
  event_minute integer
)
language plpgsql
set search_path = public
as $$
declare
  v_phase text;
  v_clock_seconds integer;
  v_clock_started_at timestamptz;
  v_seconds integer;
  v_minute integer;

  v_out public.match_players%rowtype;
  v_in public.match_players%rowtype;

  v_event_id uuid;
begin
  if p_player_out_entry_id = p_player_in_entry_id then
    raise exception 'No puedes sustituir un jugador por sí mismo.';
  end if;

  select
    live_phase,
    live_clock_seconds,
    live_clock_started_at
  into
    v_phase,
    v_clock_seconds,
    v_clock_started_at
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'El partido no existe.';
  end if;

  if v_phase not in (
    'first_half',
    'second_half'
  ) then
    raise exception 'Solo puedes realizar sustituciones durante el partido.';
  end if;

  v_seconds := coalesce(
    v_clock_seconds,
    0
  );

  if v_clock_started_at is not null then
    v_seconds :=
      v_seconds +
      greatest(
        0,
        floor(
          extract(
            epoch from (
              now() -
              v_clock_started_at
            )
          )
        )::integer
      );
  end if;

  v_minute :=
    floor(
      v_seconds / 60.0
    )::integer;

  select *
  into v_out
  from public.match_players
  where
    match_id = p_match_id
    and id = p_player_out_entry_id
  for update;

  if not found then
    raise exception 'El jugador que sale ya no está disponible.';
  end if;

  select *
  into v_in
  from public.match_players
  where
    match_id = p_match_id
    and id = p_player_in_entry_id
  for update;

  if not found then
    raise exception 'El jugador que entra ya no está disponible.';
  end if;

  if v_out.team_id <> v_in.team_id then
    raise exception 'Los jugadores deben pertenecer al mismo equipo.';
  end if;

  if not v_out.on_field then
    raise exception 'El jugador seleccionado ya no está en el campo.';
  end if;

  if v_in.on_field then
    raise exception 'El jugador seleccionado ya está en el campo.';
  end if;

  update public.match_players
  set
    on_field = false,
    minutes_played =
      coalesce(
        minutes_played,
        0
      )
      +
      greatest(
        0,
        v_minute -
        coalesce(
          entered_minute,
          v_minute
        )
      ),
    entered_minute = null
  where
    match_id = p_match_id
    and id = p_player_out_entry_id;

  update public.match_players
  set
    on_field = true,
    entered_minute = v_minute
  where
    match_id = p_match_id
    and id = p_player_in_entry_id;

  insert into public.match_events (
    match_id,
    event_type,
    player_id,
    secondary_player_id,
    minute,
    created_by
  )
  values (
    p_match_id,
    'substitution',
    v_out.player_id,
    v_in.player_id,
    v_minute,
    auth.uid()
  )
  returning id
  into v_event_id;

  return query
  select
    v_event_id,
    v_minute;
end;
$$;

commit;
