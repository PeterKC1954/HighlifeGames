CREATE OR REPLACE FUNCTION public.update_proof_of_address(p_token text, p_user_id text, p_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  -- Only allow updating your own profile, or admin updating anyone
  IF v_session.user_id::text != p_user_id THEN
    PERFORM 1 FROM public.profiles WHERE id = v_session.user_id AND account_type = 'admin' LIMIT 1;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Not authorized');
    END IF;
  END IF;

  UPDATE public.profiles SET proof_of_address_url = p_url WHERE id = p_user_id::uuid;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Also create a function to update proof right after signup (no session yet, use user_id from signup result)
CREATE OR REPLACE FUNCTION public.set_proof_of_address(p_user_id text, p_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
BEGIN
  UPDATE public.profiles SET proof_of_address_url = p_url WHERE id = p_user_id::uuid;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_proof_of_address TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_proof_of_address TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
