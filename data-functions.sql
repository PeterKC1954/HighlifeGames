-- Functions to get profile data without Supabase Auth (using session token)

CREATE OR REPLACE FUNCTION public.get_my_profile(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_session.user_id LIMIT 1;
  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  RETURN jsonb_build_object(
    'id', v_profile.id::text,
    'display_name', v_profile.display_name,
    'email', v_profile.email,
    'account_type', v_profile.account_type,
    'is_approved', v_profile.is_approved,
    'is_confirmed', v_profile.is_confirmed,
    'hecu_balance', v_profile.hecu_balance,
    'avatar', v_profile.avatar,
    'referral_code', v_profile.referral_code,
    'geo_tokens', v_profile.geo_tokens,
    'referral_discount_percent', v_profile.referral_discount_percent,
    'company_name', v_profile.company_name
  );
END;
$$;

-- Get all profiles (admin only)
CREATE OR REPLACE FUNCTION public.get_all_profiles(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_session.user_id LIMIT 1;
  IF v_profile.id IS NULL OR v_profile.account_type != 'admin' THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  RETURN COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', p.id::text,
      'display_name', p.display_name,
      'email', p.email,
      'account_type', p.account_type,
      'hecu_balance', p.hecu_balance,
      'is_confirmed', p.is_confirmed,
      'is_approved', p.is_approved,
      'avatar', p.avatar,
      'company_name', p.company_name,
      'website', p.website,
      'contact_name', p.contact_name,
      'telephone', p.telephone,
      'crn', p.crn,
      'proof_of_address_url', p.proof_of_address_url,
      'created_at', p.created_at
    ) ORDER BY p.created_at DESC) FROM public.profiles p),
    '[]'::jsonb
  );
END;
$$;

-- Get waiting players (for lobby display)
CREATE OR REPLACE FUNCTION public.get_waiting_players()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'display_name', p.display_name,
      'avatar', p.avatar
    ) ORDER BY p.created_at DESC LIMIT 12) FROM public.profiles p WHERE p.account_type = 'player'),
    '[]'::jsonb
  );
END;
$$;

-- Get my referrals count
CREATE OR REPLACE FUNCTION public.get_my_referral_count(p_token text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN 0;
  END IF;
  RETURN (SELECT count(*) FROM public.referrals WHERE referrer_id = v_session.user_id);
END;
$$;

-- Get my claims
CREATE OR REPLACE FUNCTION public.get_my_claims(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE(
    (SELECT jsonb_agg(to_jsonb(c) ORDER BY c.created_at DESC)
     FROM public.postcode_claims c WHERE c.advertiser_id = v_session.user_id),
    '[]'::jsonb
  );
END;
$$;

-- Get my adverts
CREATE OR REPLACE FUNCTION public.get_my_adverts(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;
  IF v_session.id IS NULL OR v_session.expires_at < now() THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE(
    (SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC)
     FROM public.adverts a WHERE a.advertiser_id = v_session.user_id),
    '[]'::jsonb
  );
END;
$$;

-- Check postcode availability
CREATE OR REPLACE FUNCTION public.check_postcode_available(p_postcode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing record;
BEGIN
  SELECT id, advertiser_id INTO v_existing
  FROM public.postcode_claims
  WHERE upper(postcode) = upper(trim(p_postcode))
    AND status IN ('pending', 'active')
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('available', false, 'claim_id', v_existing.id::text);
  END IF;
  RETURN jsonb_build_object('available', true);
END;
$$;

-- Admin update profile (for approve/revoke)
CREATE OR REPLACE FUNCTION public.admin_update_approval(p_token text, p_user_id text, p_approved boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

  UPDATE public.profiles SET is_approved = p_approved WHERE id = p_user_id::uuid;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waiting_players TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referral_count TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_claims TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_adverts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_postcode_available TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_approval TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
