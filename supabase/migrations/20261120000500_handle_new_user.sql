-- Creates the profile and private details when someone registers.
-- Reads the answers from the sign-up form (roomie preference and bio included).
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
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'bio', '')), 300), '')
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