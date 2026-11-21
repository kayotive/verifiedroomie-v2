-- Listings: no digits in description or house rules; at most 4 digits (house or plot number) in address fields
create or replace function public.block_listing_numbers()
returns trigger
language plpgsql
as $$
declare
  check_desc boolean := true;
  check_rules boolean := true;
  check_place boolean := true;
  check_area boolean := true;
begin
  -- Changes made in the SQL editor are not checked
  if auth.uid() is null then
    return new;
  end if;

  -- On updates, only check the fields that actually changed
  if tg_op = 'UPDATE' then
    check_desc := new.description is distinct from old.description;
    check_rules := new.house_rules is distinct from old.house_rules;
    check_place := new.place_name is distinct from old.place_name;
    check_area := new.area is distinct from old.area;
  end if;

  if check_desc and new.description ~ '[0-9]' then
    raise exception 'Numbers are not allowed in the description. Write them in words instead.';
  end if;
  if check_rules and new.house_rules ~ '[0-9]' then
    raise exception 'Numbers are not allowed in the house rules. Write them in words instead.';
  end if;
  if check_place and (new.place_name ~ '[0-9]{4,}'
      or length(regexp_replace(coalesce(new.place_name, ''), '[^0-9]', '', 'g')) > 4) then
    raise exception 'Please keep numbers in the estate, street or landmark to a house or plot number only.';
  end if;
  if check_area and (new.area ~ '[0-9]{4,}'
      or length(regexp_replace(coalesce(new.area, ''), '[^0-9]', '', 'g')) > 4) then
    raise exception 'Please keep numbers in the area and city to a house or plot number only.';
  end if;

  return new;
end;
$$;

drop trigger if exists block_listing_numbers_trg on public.listings;
create trigger block_listing_numbers_trg
  before insert or update on public.listings
  for each row execute function public.block_listing_numbers();

-- Bios: no digits when the bio is changed
create or replace function public.block_bio_numbers()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null
     and new.bio is distinct from old.bio
     and new.bio ~ '[0-9]' then
    raise exception 'Numbers are not allowed in the bio.';
  end if;
  return new;
end;
$$;

drop trigger if exists block_bio_numbers_trg on public.profiles;
create trigger block_bio_numbers_trg
  before update on public.profiles
  for each row execute function public.block_bio_numbers();

-- New accounts: strip digits from the bio typed at sign-up
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  insert into public.profiles (id, full_name, gender, birth_year, occupation, religion, smoking, roomie_gender_preference, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'gender', ''),
    extract(year from nullif(new.raw_user_meta_data->>'date_of_birth', '')::date)::int,
    nullif(new.raw_user_meta_data->>'occupation', ''),
    nullif(new.raw_user_meta_data->>'religion', ''),
    nullif(new.raw_user_meta_data->>'smoking', ''),
    case
      when new.raw_user_meta_data->>'roomie_gender_preference' in ('male', 'female', 'any')
        then new.raw_user_meta_data->>'roomie_gender_preference'
      else 'any'
    end,
    nullif(left(trim(regexp_replace(coalesce(new.raw_user_meta_data->>'bio', ''), '[0-9]', '', 'g')), 300), '')
  );

  insert into public.private_details (id, phone, date_of_birth)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'date_of_birth', '')::date
  );

  return new;
end;
$function$;