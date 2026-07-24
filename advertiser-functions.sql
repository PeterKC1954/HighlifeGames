-- Advertiser action functions (using session token)

CREATE OR REPLACE FUNCTION public.create_postcode_claim(p_token text, p_postcode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_claim_id uuid;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_session.user_id LIMIT 1;
  IF v_profile.id IS NULL OR v_profile.account_type != 'advertiser' OR NOT v_profile.is_approved THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  -- Check availability
  PERFORM 1 FROM public.postcode_claims
  WHERE upper(postcode) = upper(trim(p_postcode)) AND status IN ('pending', 'active') LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('error', 'already_claimed');
  END IF;

  INSERT INTO public.postcode_claims (advertiser_id, postcode, status, price_per_week, changes_remaining, payment_status)
  VALUES (v_profile.id, upper(trim(p_postcode)), 'pending', 20, 3, 'unpaid')
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('success', true, 'claim_id', v_claim_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_advert(p_token text, p_claim_id text, p_title text, p_body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_claim public.postcode_claims%ROWTYPE;
  v_advert_id uuid;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  SELECT * INTO v_claim FROM public.postcode_claims
  WHERE id = p_claim_id::uuid AND advertiser_id = v_session.user_id LIMIT 1;
  IF v_claim.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Claim not found');
  END IF;

  IF v_claim.changes_remaining <= 0 THEN
    RETURN jsonb_build_object('error', 'No advert changes remaining this month');
  END IF;

  INSERT INTO public.adverts (claim_id, advertiser_id, title, body, is_active)
  VALUES (v_claim.id, v_session.user_id, p_title, p_body, false)
  RETURNING id INTO v_advert_id;

  -- Decrement changes remaining
  UPDATE public.postcode_claims SET changes_remaining = changes_remaining - 1 WHERE id = v_claim.id;

  RETURN jsonb_build_object('success', true, 'advert_id', v_advert_id::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_postcode_claim TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_advert TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
