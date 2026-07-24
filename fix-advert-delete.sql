CREATE OR REPLACE FUNCTION public.delete_advert(p_token text, p_advert_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_advert public.adverts%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  SELECT * INTO v_advert FROM public.adverts WHERE id = p_advert_id::uuid LIMIT 1;
  IF v_advert.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Advert not found');
  END IF;

  IF v_advert.advertiser_id != v_session.user_id THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  DELETE FROM public.adverts WHERE id = p_advert_id::uuid;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_advert TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
