-- Full name cannot be changed after registration (changes made in the SQL editor still work)
create or replace function public.lock_full_name()
returns trigger
language plpgsql
as $$
begin
  if coalesce(old.full_name, '') <> ''
     and new.full_name is distinct from old.full_name
     and auth.uid() is not null then
    raise exception 'Name cannot be changed after registration';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_full_name_trg on public.profiles;
create trigger lock_full_name_trg
  before update on public.profiles
  for each row execute function public.lock_full_name();