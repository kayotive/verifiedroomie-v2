CREATE OR REPLACE FUNCTION public.review_id_verification(p_id uuid, p_approve boolean, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid;
  v_reason text := nullif(trim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  update public.id_verifications
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = p_note,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_id and status = 'pending'
  returning user_id into v_user;

  if v_user is null then
    raise exception 'Request not found or already reviewed.';
  end if;

  if p_approve then
    update public.profiles set id_verified = true where id = v_user;

    insert into public.notifications (id, user_id, kind, message, link, created_at)
    values (
      gen_random_uuid(),
      v_user,
      'id_verified',
      'Your ID has been verified.',
      null,
      now()
    );
  else
    insert into public.notifications (id, user_id, kind, message, link, created_at)
    values (
      gen_random_uuid(),
      v_user,
      'id_rejected',
      case
        when v_reason is not null
          then 'Your ID was not approved. Reason: ' || v_reason
        else 'Your ID was not approved.'
      end,
      null,
      now()
    );
  end if;
end;
$function$;