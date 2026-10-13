begin;

-- Las cuentas públicas nuevas empiezan como Jugador Fantasy.
-- No se rellenan los perfiles ya existentes con voter_role NULL:
-- la Directiva puede haber retirado expresamente su acceso.
alter table public.profiles
  alter column voter_role set default 'jugador';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
begin
  profile_name :=
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');

  if profile_name is null then
    profile_name :=
      coalesce(
        split_part(new.email, '@', 1),
        'Usuario'
      );
  end if;

  insert into public.profiles (
    id,
    display_name,
    voter_role
  )
  values (
    new.id,
    profile_name,
    'jugador'
  );

  return new;
end;
$$;

commit;
