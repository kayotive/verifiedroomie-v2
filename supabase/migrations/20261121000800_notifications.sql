-- Notifications: each person sees only their own
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  message text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications: mark own read" on public.notifications;
create policy "notifications: mark own read" on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- People can read their notifications and mark them read, nothing else.
-- New notifications are only created by the database rules below.
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- New request, accepted, declined
create or replace function public.notify_connection_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if tg_op = 'INSERT' then
    select split_part(full_name, ' ', 1) into v_name
      from public.profiles where id = new.requester_id;
    insert into public.notifications (user_id, kind, message, link)
    values (
      new.receiver_id,
      'request_received',
      coalesce(nullif(v_name, ''), 'Someone') || ' sent you a connection request.',
      '/requests'
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    select split_part(full_name, ' ', 1) into v_name
      from public.profiles where id = new.receiver_id;
    if new.status = 'accepted' then
      insert into public.notifications (user_id, kind, message, link)
      values (
        new.requester_id,
        'request_accepted',
        coalesce(nullif(v_name, ''), 'Someone')
          || ' accepted your connection request. Their phone number is now on your Requests page.',
        '/requests'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, kind, message, link)
      values (
        new.requester_id,
        'request_declined',
        coalesce(nullif(v_name, ''), 'Someone') || ' declined your connection request.',
        '/requests'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_connection_events_trg on public.connections;
create trigger notify_connection_events_trg
  after insert or update on public.connections
  for each row execute function public.notify_connection_events();

-- Refund rule from before, now also telling the seeker why their balance went up
create or replace function public.refund_pending_on_listing_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := case old.apartment_type
    when 'self_contained' then 'Self-contained'
    when '1_bedroom' then '1 Bedroom'
    when '2_bedroom' then '2 Bedroom'
    when '3_bedroom' then '3 Bedroom'
    else 'Apartment'
  end;
begin
  insert into public.notifications (user_id, kind, message, link)
  select c.requester_id,
         'refund',
         'The ' || v_type || ' listing in ' || coalesce(old.area, 'your search area')
           || ' that you sent a request on was deleted by its owner. Your Connect Point has been refunded.',
         '/feed'
    from public.connections c
    join public.profiles rp on rp.id = c.requester_id
   where c.listing_id = old.id
     and c.status = 'pending'
     and rp.user_type = 'seeker';

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