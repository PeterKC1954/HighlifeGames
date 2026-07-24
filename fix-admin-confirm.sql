CREATE OR REPLACE FUNCTION public.admin_confirm_account(p_token text, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_admin public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  SELECT * INTO v_admin FROM public.profiles WHERE id = v_session.user_id LIMIT 1;
  IF v_admin.id IS NULL OR v_admin.account_type != 'admin' THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  UPDATE public.profiles SET is_confirmed = true, confirmation_code = NULL
  WHERE id = p_user_id::uuid;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_confirm_account TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
