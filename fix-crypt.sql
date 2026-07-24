-- Fix: pgcrypto is in extensions schema, add it to search_path in functions

CREATE OR REPLACE FUNCTION public.auth_signup(
  p_email text, p_password text, p_display_name text, p_postcode text,
  p_account_type text DEFAULT 'player', p_age_range text DEFAULT NULL,
  p_avatar text DEFAULT NULL, p_company_name text DEFAULT NULL,
  p_website text DEFAULT NULL, p_contact_name text DEFAULT NULL,
  p_telephone text DEFAULT NULL, p_crn text DEFAULT NULL,
  p_referral_code text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions AS $$
DECLARE
  v_id uuid; v_ref_code text; v_hecu integer; v_approved boolean;
  v_referrer public.profiles%ROWTYPE; v_existing text;
BEGIN
  SELECT email INTO v_existing FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('error', 'Email already registered'); END IF;

  v_ref_code := upper(substr(md5(random()::text || 'highlife'), 1, 8));
  v_hecu := CASE WHEN p_account_type = 'player' THEN 50000 ELSE 0 END;
  v_approved := p_account_type != 'advertiser';

  IF COALESCE(p_referral_code, '') != '' THEN
    SELECT * INTO v_referrer FROM public.profiles WHERE referral_code = upper(trim(p_referral_code)) LIMIT 1;
  END IF;

  IF v_referrer.id IS NOT NULL AND p_account_type = 'player' AND v_referrer.account_type = 'player' THEN
    v_hecu := v_hecu + 10000;
  END IF;

  INSERT INTO public.profiles (display_name, email, postcode, age_range, avatar, account_type, hecu_balance, is_approved, company_name, website, contact_name, telephone, crn, referral_code, referred_by, password_hash)
  VALUES (p_display_name, lower(p_email), p_postcode, p_age_range, p_avatar, p_account_type, v_hecu, v_approved, p_company_name, p_website, p_contact_name, p_telephone, p_crn, v_ref_code, v_referrer.id, crypt(p_password, gen_salt('bf')))
  RETURNING id INTO v_id;

  IF v_referrer.id IS NOT NULL THEN
    IF p_account_type = 'player' AND v_referrer.account_type = 'player' THEN
      UPDATE public.profiles SET hecu_balance = hecu_balance + 10000, geo_tokens = geo_tokens + 1 WHERE id = v_referrer.id;
      INSERT INTO public.referrals (referrer_id, referred_id, referral_type, reward_given) VALUES (v_referrer.id, v_id, 'player', true);
    ELSIF p_account_type = 'advertiser' AND v_referrer.account_type = 'advertiser' THEN
      UPDATE public.profiles SET referral_discount_percent = LEAST(50, referral_discount_percent + 10) WHERE id = v_referrer.id;
      INSERT INTO public.referrals (referrer_id, referred_id, referral_type, reward_given) VALUES (v_referrer.id, v_id, 'advertiser', true);
    END IF;
  END IF;

  RETURN jsonb_build_object('user_id', v_id::text, 'referral_code', v_ref_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_login(p_email text, p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions AS $$
DECLARE
  v_profile public.profiles%ROWTYPE; v_token text;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_profile.id IS NULL OR v_profile.password_hash IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid email or password');
  END IF;
  IF NOT (v_profile.password_hash = crypt(p_password, v_profile.password_hash)) THEN
    RETURN jsonb_build_object('error', 'Invalid email or password');
  END IF;
  IF NOT v_profile.is_confirmed AND v_profile.account_type != 'admin' THEN
    RETURN jsonb_build_object('error', 'Please confirm your email first. Check for a 6-digit code.');
  END IF;
  IF v_profile.account_type = 'advertiser' AND NOT v_profile.is_approved THEN
    RETURN jsonb_build_object('error', 'Your advertiser account is pending admin approval.');
  END IF;

  v_token := md5(random()::text || clock_timestamp()::text || v_profile.id::text);
  DELETE FROM public.sessions WHERE user_id = v_profile.id;
  INSERT INTO public.sessions (user_id, token, expires_at) VALUES (v_profile.id, v_token, now() + interval '7 days');

  RETURN jsonb_build_object('token', v_token, 'user_id', v_profile.id::text, 'display_name', v_profile.display_name, 'email', v_profile.email, 'account_type', v_profile.account_type, 'is_approved', v_profile.is_approved);
END;
$$;

-- Also fix auth_create_admin
CREATE OR REPLACE FUNCTION public.auth_create_admin(
  p_email text, p_password text, p_display_name text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions AS $$
DECLARE
  v_id uuid; v_ref_code text; v_existing text;
BEGIN
  SELECT email INTO v_existing FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Email already registered');
  END IF;

  v_ref_code := upper(substr(md5(random()::text || 'highlife'), 1, 8));

  INSERT INTO public.profiles (display_name, email, account_type, hecu_balance, is_approved, is_confirmed, referral_code, password_hash)
  VALUES (p_display_name, lower(p_email), 'admin', 0, true, true, v_ref_code, crypt(p_password, gen_salt('bf')))
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('user_id', v_id::text, 'referral_code', v_ref_code);
END;
$$;

NOTIFY pgrst, 'reload schema';
