-- Lets the registration and profile pages ask "is this phone number already used?"
-- - Compares the last 10 digits, so 08012345678 and +2348012345678 count as the same number.
-- - Only counts accounts whose email is confirmed, so an abandoned signup never blocks a number.
-- - Ignores the person's own account (so they can save their profile with their own number).
create or replace function public.phone_exists(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.private_details d
    join auth.users u on u.id = d.id
    where d.phone is not null
      and u.email_confirmed_at is not null
      and right(regexp_replace(d.phone, '\D', '', 'g'), 10)
        = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
      and d.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

revoke all on function public.phone_exists(text) from public;
grant execute on function public.phone_exists(text) to anon, authenticated;