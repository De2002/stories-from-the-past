REVOKE EXECUTE ON FUNCTION public.notify_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.account_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_active(uuid) TO authenticated, service_role;