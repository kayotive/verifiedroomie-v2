-- Owners may only set these columns when creating a listing.
-- Columns like apartment_verified keep their defaults and can only be changed by admins.
revoke insert on public.listings from authenticated;
grant insert (
  owner_id, apartment_type, room_available, contribution_amount, roomies_wanted,
  move_in_date, description, house_rules, place_name, area, latitude, longitude, status
) on public.listings to authenticated;