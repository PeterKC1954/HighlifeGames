CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.submit_contact_form(
  p_name text, p_email text, p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.contact_submissions (name, email, message)
  VALUES (p_name, p_email, p_message)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_submissions(p_token text)
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
      'id', c.id::text,
      'name', c.name,
      'email', c.email,
      'message', c.message,
      'is_read', c.is_read,
      'created_at', c.created_at
    ) ORDER BY c.created_at DESC) FROM public.contact_submissions c),
    '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_contact_read(p_token text, p_submission_id text)
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

  UPDATE public.contact_submissions SET is_read = true WHERE id = p_submission_id::uuid;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_contact_form TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_submissions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_contact_read TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
