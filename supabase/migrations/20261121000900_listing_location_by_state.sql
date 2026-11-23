-- Listings are now located by state and area only (no street name, no map pin)
alter table public.listings add column if not exists state text;
alter table public.listings alter column place_name drop not null;
alter table public.listings alter column latitude drop not null;
alter table public.listings alter column longitude drop not null;

grant select (state), insert (state) on public.listings to authenticated;