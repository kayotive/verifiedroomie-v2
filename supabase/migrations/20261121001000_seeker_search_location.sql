-- Where a seeker is looking: a state, and optionally an area in it
alter table public.profiles
  add column if not exists looking_state text,
  add column if not exists looking_area text;

grant select (looking_state, looking_area), update (looking_state, looking_area)
  on public.profiles to authenticated;

create index if not exists profiles_looking_idx
  on public.profiles (looking_state, looking_area)
  where user_type = 'seeker';