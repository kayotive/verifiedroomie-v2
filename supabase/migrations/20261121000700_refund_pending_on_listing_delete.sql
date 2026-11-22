-- When a listing is deleted, give seekers their Connect Point back
-- for requests on it that were never answered.
create or replace function public.refund_pending_on_listing_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
     set connect_points = p.connect_points + r.refund
    from (
      select c.requester_id, count(*)::int as refund
        from public.connections c
        join public.profiles rp on rp.id = c.requester_id
       where c.listing_id = old.id
         and c.status = 'pending'
         and rp.user_type = 'seeker'
       group by c.requester_id
    ) r
   where p.id = r.requester_id;
  return old;
end;
$$;

drop trigger if exists refund_pending_on_listing_delete_trg on public.listings;
create trigger refund_pending_on_listing_delete_trg
  before delete on public.listings
  for each row execute function public.refund_pending_on_listing_delete();