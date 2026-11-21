-- Listings: why a listing is hidden, and when the owner last confirmed it is available
alter table public.listings
  add column if not exists hidden_reason text
    check (hidden_reason in ('found_here', 'found_elsewhere', 'paused')),
  add column if not exists last_confirmed_at timestamptz not null default now();

-- Seekers: hide the profile from the People page
alter table public.profiles
  add column if not exists is_paused boolean not null default false,
  add column if not exists paused_reason text
    check (paused_reason in ('found_here', 'found_elsewhere', 'paused'));

grant select (hidden_reason, last_confirmed_at), update (hidden_reason, last_confirmed_at)
  on public.listings to authenticated;
grant select (is_paused, paused_reason), update (is_paused, paused_reason)
  on public.profiles to authenticated;