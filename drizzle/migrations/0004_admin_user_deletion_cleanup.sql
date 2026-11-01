CREATE OR REPLACE FUNCTION public.finish_user_deletion(actor uuid, target uuid, deletion_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF actor = target OR NOT public.has_role(actor, 'admin') OR public.has_role(target, 'admin') THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted here';
  END IF;
  IF length(trim(deletion_reason)) < 3 OR length(deletion_reason) > 1000 THEN
    RAISE EXCEPTION 'A deletion reason is required';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = target) THEN
    RAISE EXCEPTION 'Remove the sign-in account before deleting its profile';
  END IF;
  DELETE FROM public.reports WHERE reporter_id = target;
  DELETE FROM public.account_moderation WHERE user_id = target;
  DELETE FROM public.profiles WHERE id = target;
  INSERT INTO public.moderation_actions(admin_id, action, target_id, reason)
  VALUES (actor, 'delete-user', target, deletion_reason);
END;
$$;
REVOKE ALL ON FUNCTION public.finish_user_deletion(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_user_deletion(uuid, uuid, text) TO service_role;