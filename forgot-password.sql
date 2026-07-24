CREATE OR REPLACE FUNCTION public.request_password_reset(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_code text;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'No account found with that email');
  END IF;

  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  UPDATE public.profiles SET reset_code = v_code, reset_code_expires = now() + interval '15 minutes'
  WHERE id = v_profile.id;

  RETURN jsonb_build_object('success', true, 'code', v_code, 'email', v_profile.email, 'display_name', v_profile.display_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_password(p_email text, p_code text, p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM public.profiles
  WHERE lower(email) = lower(p_email) AND reset_code = p_code AND reset_code_expires > now()
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired reset code');
  END IF;

  IF length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('error', 'Password must be at least 6 characters');
  END IF;

  UPDATE public.profiles
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      reset_code = NULL, reset_code_expires = NULL
  WHERE id = v_profile.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_password_reset TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_password TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
