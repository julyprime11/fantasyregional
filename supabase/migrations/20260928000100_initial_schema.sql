-- Initial MVP schema. This migration has not been applied and replaces the original draft.
begin;

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete restrict,
  name text not null,
  category text,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  first_name text not null,
  last_name text,
  shirt_number integer,
  position text not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint players_position_check check (position in ('GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST')),
  constraint players_shirt_number_nonnegative check (shirt_number >= 0)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  first_name text not null,
  last_name text,
  role text not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  constraint seasons_date_order check (end_date >= start_date)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete set null,
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  match_date timestamptz not null,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled',
  voting_opens_at timestamptz,
  voting_closes_at timestamptz,
  created_at timestamptz not null default now(),
  constraint matches_status_check check (status in ('scheduled', 'finished', 'voting', 'closed')),
  constraint matches_distinct_teams check (home_team_id <> away_team_id),
  constraint matches_home_score_nonnegative check (home_score >= 0),
  constraint matches_away_score_nonnegative check (away_score >= 0),
  constraint matches_voting_window_order check (voting_closes_at >= voting_opens_at)
);

create table public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  starter boolean not null default false,
  minutes_played integer not null default 0,
  goals integer not null default 0,
  assists integer not null default 0,
  yellow_cards integer not null default 0,
  red_cards integer not null default 0,
  clean_sheet boolean not null default false,
  created_at timestamptz not null default now(),
  constraint match_players_match_id_player_id_key unique (match_id, player_id),
  constraint match_players_minutes_played_nonnegative check (minutes_played >= 0),
  constraint match_players_goals_nonnegative check (goals >= 0),
  constraint match_players_assists_nonnegative check (assists >= 0),
  constraint match_players_yellow_cards_nonnegative check (yellow_cards >= 0),
  constraint match_players_red_cards_nonnegative check (red_cards >= 0)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  voter_id uuid not null,
  voter_role text not null,
  score numeric not null,
  created_at timestamptz not null default now(),
  constraint ratings_match_id_player_id_voter_id_key unique (match_id, player_id, voter_id),
  constraint ratings_score_range check (score between 1 and 10)
);

-- The unique constraints on match_players and ratings already index match_id.
create index teams_club_id_idx on public.teams(club_id);
create index players_team_id_idx on public.players(team_id);
create index staff_team_id_idx on public.staff(team_id);
create index competitions_season_id_idx on public.competitions(season_id);
create index matches_competition_id_idx on public.matches(competition_id);
create index matches_home_team_id_idx on public.matches(home_team_id);
create index matches_away_team_id_idx on public.matches(away_team_id);
create index match_players_player_id_idx on public.match_players(player_id);
create index match_players_team_id_idx on public.match_players(team_id);
create index ratings_player_id_idx on public.ratings(player_id);

-- RLS is intentionally not enabled in this foundation migration.
-- RLS policies, voter authorization, and ownership enforcement will be added in the authentication phase.
-- voter_id is a UUID placeholder without an auth foreign key for now.
-- Do not use these unprotected tables for production or sensitive data.

commit;
