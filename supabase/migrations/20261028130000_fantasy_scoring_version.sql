-- Versionado de reglas de votacion y puntos Fantasy por partido.
-- V1: 20/30/50, tabla historica. V2: 30/35/35, nueva tabla.
-- La columna se fija al crear el partido y NO depende de match_date despues.
begin;

alter table public.matches
  add column fantasy_scoring_version text not null default 'v2'
  constraint matches_fantasy_scoring_version_check
  check (fantasy_scoring_version in ('v1', 'v2'));

-- Los partidos ya iniciados/finalizados mantienen V1; los antiguos
-- programados en el pasado tambien. Solo futuros programados pasan a V2.
update public.matches
set fantasy_scoring_version = 'v1'
where status <> 'scheduled'
   or match_date < now();

-- Impedir que una modificacion posterior de la fecha cambie las reglas
-- de un partido que ya empezo. Esta proteccion es independiente del frontend.
create or replace function public.prevent_started_match_scoring_version_change()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'scheduled'
     and new.fantasy_scoring_version is distinct from old.fantasy_scoring_version then
    raise exception 'No se puede cambiar la version Fantasy de un partido iniciado.';
  end if;
  return new;
end;
$$;

create trigger matches_lock_started_scoring_version
before update of fantasy_scoring_version on public.matches
for each row
execute function public.prevent_started_match_scoring_version_change();

commit;
