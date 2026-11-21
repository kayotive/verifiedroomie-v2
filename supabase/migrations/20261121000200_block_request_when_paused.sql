-- A hidden seeker must show their profile again before sending a new request
create or replace function public.block_request_when_paused()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles
    where id = new.requester_id and is_paused
  ) then
    raise exception 'Your profile is hidden. Show your profile before sending a new request.';
  end if;
  return new;
end;
$$;

drop trigger if exists block_request_when_paused_trg on public.connections;
create trigger block_request_when_paused_trg
  before insert on public.connections
  for each row execute function public.block_request_when_paused();