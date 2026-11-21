-- Who the user would like to live with: male, female or any
alter table public.profiles
  add column if not exists roomie_gender_preference text not null default 'any'
  check (roomie_gender_preference in ('male', 'female', 'any'));

grant select (roomie_gender_preference) on public.profiles to authenticated;
grant update (roomie_gender_preference) on public.profiles to authenticated;

-- Gender cannot be changed after it is set (changes made in the SQL editor still work)
create or replace function public.lock_gender()
returns trigger
language plpgsql
as $$
begin
  if old.gender is not null
     and new.gender is distinct from old.gender
     and auth.uid() is not null then
    raise exception 'Gender cannot be changed after registration';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_gender_trg on public.profiles;
create trigger lock_gender_trg
  before update on public.profiles
  for each row execute function public.lock_gender();