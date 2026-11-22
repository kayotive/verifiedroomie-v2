-- An owner can only have one listing. They must delete it before posting another.
create or replace function public.one_listing_per_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.listings where owner_id = new.owner_id) then
    raise exception 'You already have a listing. Delete it before posting a new one.';
  end if;
  return new;
end;
$$;

drop trigger if exists one_listing_per_owner_trg on public.listings;
create trigger one_listing_per_owner_trg
  before insert on public.listings
  for each row execute function public.one_listing_per_owner();