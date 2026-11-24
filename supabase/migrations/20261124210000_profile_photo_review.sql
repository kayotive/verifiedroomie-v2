-- Profile photo review: the admin checks photos and flags bad ones.
-- A flagged user gets a notification and 24 hours to change the photo.

alter table public.profiles
  add column if not exists photo_status text not null default 'unreviewed'
    check (photo_status in ('unreviewed', 'approved', 'flagged')),
  add column if not exists photo_flagged_at timestamptz,
  add column if not exists suspended_reason text;

-- Guard: signed-in people who are not admins cannot change the review fields,
-- and a new profile photo goes back into the review list.
create or replace function public.profiles_photo_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.photo_status := old.photo_status;
    new.photo_flagged_at := old.photo_flagged_at;
    new.suspended_reason := old.suspended_reason;
  end if;

  if new.avatar_url is distinct from old.avatar_url then
    new.photo_status := 'unreviewed';
    new.photo_flagged_at := null;
  end if;

  -- Reinstated: clear the reason, and restart the 24 hours if the photo is still flagged
  if old.is_suspended and not new.is_suspended then
    new.suspended_reason := null;
    if new.photo_status = 'flagged' then
      new.photo_flagged_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_photo_guard on public.profiles;
create trigger profiles_photo_guard
  before update on public.profiles
  for each row execute function public.profiles_photo_guard();

-- Admin: approve a photo, or flag it (the user gets a notification)
create or replace function public.review_profile_photo(p_user uuid, p_ok boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  if p_ok then
    update public.profiles
    set photo_status = 'approved', photo_flagged_at = null
    where id = p_user and not is_admin;
    if not found then
      raise exception 'Profile not found.';
    end if;
  else
    update public.profiles
    set photo_status = 'flagged', photo_flagged_at = now()
    where id = p_user and not is_admin;
    if not found then
      raise exception 'Profile not found.';
    end if;

    insert into public.notifications (id, user_id, kind, message, link, created_at)
    values (
      gen_random_uuid(),
      p_user,
      'photo_flagged',
      'Your profile photo does not meet our rules. Please replace it with a clear photo of yourself, taken with your camera or picked from your gallery, within 24 hours or your account may be suspended.',
      '/profile',
      now()
    );
  end if;
end;
$$;

-- Admin: suspend an account whose flagged photo was not fixed
create or replace function public.suspend_for_photo(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  update public.profiles
  set is_suspended = true, suspended_reason = 'photo'
  where id = p_user and photo_status = 'flagged' and not is_admin;
  if not found then
    raise exception 'Profile not found or not flagged.';
  end if;
end;
$$;