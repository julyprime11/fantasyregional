-- Eventos de gol sin ficha del goleador rival y anotación de propia puerta.
-- En los eventos anteriores, el equipo goleador se deduce de player_id.
alter table public.match_events
  add column scoring_team_id uuid references public.teams(id) on delete restrict,
  add column is_own_goal boolean not null default false;

-- Permiso de inserción para directiva, además de la comprobación del servidor.
create policy "match_events_directiva_insert_goal"
on public.match_events
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.voter_role = 'directiva'
  )
);
