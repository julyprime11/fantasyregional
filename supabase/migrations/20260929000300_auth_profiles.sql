begin;

-- Vinculamos el perfil público con el usuario real de Supabase Auth.
alter table public.profiles
  add constraint profiles_auth_user_fk
  foreign key (id)
  references auth.users(id)
  on delete cascade;

-- Función ejecutada automáticamente después de crear un usuario.
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
    display_name
  )
  values (
    new.id,
    profile_name
  );

  return new;
end;
$$;

-- Si volvemos a aplicar/desarrollar la migración evitamos duplicar el trigger.
drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

commit;