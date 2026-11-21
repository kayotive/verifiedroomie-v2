-- Owners: how many roomies a listing is accepting (1 to 3)
alter table public.listings
  add column if not exists roomies_wanted int not null default 1
  check (roomies_wanted between 1 and 3);

-- Seekers: the most roomies they are comfortable with, counting themselves (1 to 3)
alter table public.profiles
  add column if not exists max_roomies int
  check (max_roomies between 1 and 3);

grant select (roomies_wanted), insert (roomies_wanted), update (roomies_wanted)
  on public.listings to authenticated;
grant select (max_roomies), update (max_roomies)
  on public.profiles to authenticated;