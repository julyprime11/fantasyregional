-- NULL en XI históricos; nunca aplicaremos el bonus de forma retroactiva.
-- Los guardados nuevos exigen un capitán del propio XI (validación backend).
alter table public.fantasy_lineups
  add column captain_player_id uuid
  references public.players(id)
  on delete set null;
