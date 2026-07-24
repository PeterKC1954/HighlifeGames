CREATE OR REPLACE FUNCTION public.auth_signup(
  p_email text, p_password text, p_display_name text, p_postcode text,
  p_account_type text DEFAULT 'player', p_age_range text DEFAULT NULL,
  p_avatar text DEFAULT NULL, p_company_name text DEFAULT NULL,
  p_website text DEFAULT NULL, p_contact_name text DEFAULT NULL,
  p_telephone text DEFAULT NULL, p_crn text DEFAULT NULL,
  p_referral_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_id uuid;
  v_ref_code text;
  v_hecu integer;
  v_approved boolean;
  v_referrer public.profiles%ROWTYPE;
  v_existing text;
BEGIN
  SELECT email INTO v_existing FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Email already registered');
  END IF;

  v_ref_code := upper(substr(md5(random()::text || 'highlife'), 1, 8));
  v_hecu := 0;
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

NOTIFY pgrst, 'reload schema';
