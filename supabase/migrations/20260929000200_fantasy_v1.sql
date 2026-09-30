begin;

-- =========================================================
-- PROFILES
-- Perfil visible del usuario Fantasy.
-- En la fase de autenticación, id corresponderá al UUID
-- del usuario de Supabase Auth.
-- =========================================================

create table public.profiles (
  id uuid primary key,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- FANTASY LEAGUES
-- Cada liga está asociada a un único equipo real.
-- Todos los usuarios de esa liga elegirán jugadores
-- exclusivamente de ese equipo.
-- =========================================================

create table public.fantasy_leagues (
  id uuid primary key default gen_random_uuid(),

  team_id uuid not null
    references public.teams(id)
    on delete restrict,

  name text not null,

  code text not null unique,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint fantasy_leagues_name_not_empty
    check (char_length(trim(name)) > 0),

  constraint fantasy_leagues_code_not_empty
    check (char_length(trim(code)) >= 4)
);

-- =========================================================
-- LEAGUE MEMBERS
-- Usuarios que participan en una liga.
-- =========================================================

create table public.fantasy_league_members (
  id uuid primary key default gen_random_uuid(),

  league_id uuid not null
    references public.fantasy_leagues(id)
    on delete cascade,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  joined_at timestamptz not null default now(),

  constraint fantasy_league_members_league_user_key
    unique (league_id, user_id)
);

-- Necesaria también para poder referenciar league_id + user_id
-- desde las alineaciones.
create unique index fantasy_league_members_membership_idx
  on public.fantasy_league_members(league_id, user_id);

-- =========================================================
-- FANTASY LINEUPS
-- Una alineación de un usuario para un partido concreto
-- dentro de una liga concreta.
-- =========================================================

create table public.fantasy_lineups (
  id uuid primary key default gen_random_uuid(),

  league_id uuid not null,

  user_id uuid not null,

  match_id uuid not null
    references public.matches(id)
    on delete cascade,

  locked_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint fantasy_lineups_membership_fk
    foreign key (league_id, user_id)
    references public.fantasy_league_members(league_id, user_id)
    on delete cascade,

  constraint fantasy_lineups_user_league_match_key
    unique (league_id, user_id, match_id)
);

-- =========================================================
-- FANTASY LINEUP PLAYERS
-- Los jugadores escogidos en un XI.
-- =========================================================

create table public.fantasy_lineup_players (
  id uuid primary key default gen_random_uuid(),

  lineup_id uuid not null
    references public.fantasy_lineups(id)
    on delete cascade,

  player_id uuid not null
    references public.players(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint fantasy_lineup_players_lineup_player_key
    unique (lineup_id, player_id)
);

-- =========================================================
-- INDEXES
-- =========================================================

create index fantasy_leagues_team_id_idx
  on public.fantasy_leagues(team_id);

create index fantasy_leagues_created_by_idx
  on public.fantasy_leagues(created_by);

create index fantasy_league_members_user_id_idx
  on public.fantasy_league_members(user_id);

create index fantasy_lineups_match_id_idx
  on public.fantasy_lineups(match_id);

create index fantasy_lineups_user_id_idx
  on public.fantasy_lineups(user_id);

create index fantasy_lineup_players_player_id_idx
  on public.fantasy_lineup_players(player_id);

-- =========================================================
-- V1 FORMATION RULES
--
-- Cada alineación válida deberá contener:
--
-- 11 jugadores exactos
-- 1 GK
-- 3-5 defensas:
--   RB, CB, LB, RWB, LWB
-- 3-5 centrocampistas:
--   DM, CM, AM
-- 1-3 delanteros:
--   RW, LW, ST
--
-- También habrá que comprobar que todos los jugadores:
--
-- - estén activos
-- - pertenezcan al equipo real asociado a la liga
-- - no estén repetidos
--
-- Estas reglas se validarán inicialmente en
-- packages/shared para poder reutilizarlas en:
--
-- - Next.js
-- - futura app Expo / React Native
--
-- =========================================================

-- Todavía no se activa RLS.
-- Se hará junto con Supabase Auth y los permisos de usuario.

commit;