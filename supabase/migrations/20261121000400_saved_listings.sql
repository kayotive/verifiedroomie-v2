-- Saved listings. If a listing is deleted, the save stays (listing_id becomes empty)
-- so the seeker sees a "deleted" placeholder.
create table if not exists public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index if not exists saved_listings_user_idx
  on public.saved_listings (user_id, created_at desc);

alter table public.saved_listings enable row level security;

drop policy if exists "saved: read own" on public.saved_listings;
create policy "saved: read own" on public.saved_listings
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "saved: add own" on public.saved_listings;
create policy "saved: add own" on public.saved_listings
  for insert to authenticated
  with check (user_id = auth.uid() and listing_id is not null);

drop policy if exists "saved: remove own" on public.saved_listings;
create policy "saved: remove own" on public.saved_listings
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.saved_listings to authenticated;

-- Returns the signed-in seeker's saved listings with a safe summary of each.
-- Unavailable listings show only type, area and cover photo (no price).
-- Listings whose owner has accepted the seeker's request are left out.
create or replace function public.get_saved_listings()
returns table (
  saved_id uuid,
  listing_id uuid,
  saved_at timestamptz,
  state text,
  reason text,
  apartment_type text,
  area text,
  contribution_amount numeric,
  roomies_wanted int,
  cover_path text,
  connection text,
  i_sent boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id::uuid,
    s.listing_id::uuid,
    s.created_at::timestamptz,
    (case
      when s.listing_id is null then 'deleted'
      when l.status <> 'published'
        or not l.room_available
        or l.last_confirmed_at < now() - interval '30 days'
        or coalesce(p.is_suspended, false) then 'unavailable'
      else 'available'
    end)::text,
    (case
      when s.listing_id is null then null
      when l.status <> 'published' then 'paused'
      when not l.room_available then coalesce(l.hidden_reason, 'paused')
      when l.last_confirmed_at < now() - interval '30 days' then 'stale'
      when coalesce(p.is_suspended, false) then 'suspended'
      else null
    end)::text,
    l.apartment_type::text,
    l.area::text,
    (case
      when l.id is not null
        and l.status = 'published'
        and l.room_available
        and l.last_confirmed_at >= now() - interval '30 days'
        and not coalesce(p.is_suspended, false)
      then l.contribution_amount
    end)::numeric,
    l.roomies_wanted::int,
    (select m.path::text
       from public.listing_media m
      where m.listing_id = l.id and m.kind = 'photo'
      order by (m.category = 'living_room') desc, m.path
      limit 1),
    c.status::text,
    c.i_sent
  from public.saved_listings s
  left join public.listings l on l.id = s.listing_id
  left join public.profiles p on p.id = l.owner_id
  left join lateral (
    select cc.status, (cc.requester_id = auth.uid()) as i_sent
    from public.connections cc
    where (cc.requester_id = auth.uid() and cc.receiver_id = l.owner_id)
       or (cc.requester_id = l.owner_id and cc.receiver_id = auth.uid())
    order by cc.created_at desc
    limit 1
  ) c on true
  where s.user_id = auth.uid()
    and c.status is distinct from 'accepted'
  order by s.created_at desc;
$$;

revoke all on function public.get_saved_listings() from public, anon;
grant execute on function public.get_saved_listings() to authenticated;
