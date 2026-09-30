alter table public.match_players
add column if not exists stats_completed boolean not null default false;