-- 1. Attach each existing request to its owner's current listing
update public.connections c
set listing_id = (
  select l.id
  from public.listings l
  where l.owner_id = (
    case
      when (select p.user_type from public.profiles p where p.id = c.receiver_id) = 'owner'
        then c.receiver_id
      else c.requester_id
    end
  )
  order by l.created_at desc
  limit 1
)
where c.listing_id is null;

-- 2. Remove the ones that have no listing to attach to
delete from public.connections where listing_id is null;

-- 3. A connection now belongs to one listing, and ends when that listing is deleted
alter table public.connections drop constraint if exists connections_listing_id_fkey;
alter table public.connections drop constraint if exists connections_requester_id_receiver_id_key;
alter table public.connections drop constraint if exists connections_requester_receiver_listing_key;

alter table public.connections
  add constraint connections_listing_id_fkey
  foreign key (listing_id) references public.listings(id) on delete cascade;

alter table public.connections alter column listing_id set not null;

-- One request per pair of people per listing
alter table public.connections
  add constraint connections_requester_receiver_listing_key
  unique (requester_id, receiver_id, listing_id);

create index if not exists connections_listing_idx on public.connections (listing_id);

drop function if exists public.send_connection_request(uuid, uuid);

create function public.send_connection_request(p_receiver uuid, p_listing uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_points integer;
  v_my_type text;
  v_their_type text;
  v_listing uuid;
  v_owner uuid;
  v_available boolean;
begin
  if v_me is null then
    raise exception 'Please log in first.';
  end if;
  if p_receiver = v_me then
    raise exception 'You cannot connect with yourself.';
  end if;

  select user_type, connect_points into v_my_type, v_points
  from public.profiles where id = v_me for update;
  select user_type into v_their_type from public.profiles where id = p_receiver;

  if v_my_type is null or v_their_type is null or v_my_type = v_their_type then
    raise exception 'Apartment owners can only connect with people looking for apartments, and the other way round.';
  end if;

  if exists (select 1 from public.profiles where id in (v_me, p_receiver) and is_suspended) then
    raise exception 'This account is not available.';
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = v_me and blocked_id = p_receiver)
       or (blocker_id = p_receiver and blocked_id = v_me)
  ) then
    raise exception 'You cannot connect with this person.';
  end if;

  -- Work out which listing this request belongs to
  if v_my_type = 'seeker' then
    select l.owner_id,
           (l.status = 'published'
            and l.room_available
            and l.last_confirmed_at >= now() - interval '30 days')
      into v_owner, v_available
    from public.listings l
    where l.id = p_listing;

    if v_owner is null or v_owner <> p_receiver then
      raise exception 'Please connect through the owner''s listing.';
    end if;
    if not v_available then
      raise exception 'This listing is no longer available.';
    end if;
    v_listing := p_listing;
  else
    select l.id into v_listing
    from public.listings l
    where l.owner_id = v_me
    order by l.created_at desc
    limit 1;

    if v_listing is null then
      raise exception 'Create your listing first, then you can connect with people.';
    end if;
  end if;

  -- Only one request per pair of people on the same listing
  if exists (
    select 1 from public.connections c
    where c.listing_id = v_listing
      and ((c.requester_id = v_me and c.receiver_id = p_receiver)
        or (c.requester_id = p_receiver and c.receiver_id = v_me))
  ) then
    raise exception 'You already have a connection or request with this person on this listing.';
  end if;

  if v_points < 1 then
    raise exception 'You have no Connect Points left.';
  end if;

  update public.profiles set connect_points = connect_points - 1 where id = v_me;
  insert into public.connections (requester_id, receiver_id, listing_id)
  values (v_me, p_receiver, v_listing);
end;
$$;

revoke all on function public.send_connection_request(uuid, uuid) from public, anon;
grant execute on function public.send_connection_request(uuid, uuid) to authenticated;

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
    where cc.listing_id = l.id
      and (cc.requester_id = auth.uid() or cc.receiver_id = auth.uid())
    order by cc.created_at desc
    limit 1
  ) c on true
  where s.user_id = auth.uid()
    and c.status is distinct from 'accepted'
  order by s.created_at desc;
$$;