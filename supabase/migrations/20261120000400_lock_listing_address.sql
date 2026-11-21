-- A property cannot move: owners cannot change the address or map pin after publishing
revoke update (area, place_name, latitude, longitude) on public.listings from authenticated;