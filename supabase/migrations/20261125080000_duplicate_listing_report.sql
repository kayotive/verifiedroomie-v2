-- Photo fingerprints, and an admin-only report of listings from DIFFERENT accounts
-- that share photos or the same description.

alter table public.listing_media
  add column if not exists photo_hash text,
  add column if not exists visual_hash text;

create index if not exists listing_media_photo_hash_idx on public.listing_media (photo_hash);

create or replace function public.duplicate_listing_report()
returns table (
  listing_a uuid,
  listing_b uuid,
  same_photos int,
  similar_photos int,
  same_text boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  return query
  with exact_pairs as (
    select a.listing_id as la, b.listing_id as lb, count(*)::int as n
    from public.listing_media a
    join public.listing_media b
      on a.photo_hash = b.photo_hash and a.listing_id < b.listing_id
    join public.listings x on x.id = a.listing_id
    join public.listings y on y.id = b.listing_id
    where a.photo_hash is not null
      and x.owner_id <> y.owner_id
    group by a.listing_id, b.listing_id
  ),
  visual_pairs as (
    select a.listing_id as la, b.listing_id as lb, count(*)::int as n
    from public.listing_media a
    join public.listing_media b
      on a.listing_id < b.listing_id
     and a.visual_hash is not null and b.visual_hash is not null
     and bit_count(('x' || a.visual_hash)::bit(64) # ('x' || b.visual_hash)::bit(64)) <= 5
    join public.listings x on x.id = a.listing_id
    join public.listings y on y.id = b.listing_id
    where x.owner_id <> y.owner_id
    group by a.listing_id, b.listing_id
  ),
  text_pairs as (
    select x.id as la, y.id as lb
    from public.listings x
    join public.listings y
      on x.id < y.id
     and x.owner_id <> y.owner_id
     and length(trim(coalesce(x.description, ''))) >= 30
     and lower(regexp_replace(x.description, '\s+', ' ', 'g'))
       = lower(regexp_replace(y.description, '\s+', ' ', 'g'))
  ),
  all_pairs as (
    select la, lb from exact_pairs
    union select la, lb from visual_pairs
    union select la, lb from text_pairs
  )
  select p.la, p.lb,
         coalesce(e.n, 0),
         coalesce(v.n, 0),
         (t.la is not null)
  from all_pairs p
  left join exact_pairs e on e.la = p.la and e.lb = p.lb
  left join visual_pairs v on v.la = p.la and v.lb = p.lb
  left join text_pairs t on t.la = p.la and t.lb = p.lb
  order by coalesce(e.n, 0) desc, coalesce(v.n, 0) desc;
end;
$$;

revoke all on function public.duplicate_listing_report() from public;
grant execute on function public.duplicate_listing_report() to authenticated;