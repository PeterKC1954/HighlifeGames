CREATE TABLE IF NOT EXISTS public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.join_waiting_list(p_email text, p_display_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_id uuid;
  v_existing text;
BEGIN
  SELECT email INTO v_existing FROM public.waiting_list WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'You are already on the waiting list!');
  END IF;

  INSERT INTO public.waiting_list (email, display_name)
  VALUES (lower(p_email), p_display_name)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_waiting_list(p_token text)
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

  RETURN COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', w.id::text,
      'email', w.email,
      'display_name', w.display_name,
      'created_at', w.created_at
    ) ORDER BY w.created_at ASC) FROM public.waiting_list w),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_waiting_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waiting_list TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
