-- CUSTOM AUTH SYSTEM (no Supabase Auth)
-- Uses pgcrypto for password hashing, sessions table for tokens

-- Enable pgcrypto for crypt() and gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password_hash to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sessions (only via functions)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ===== AUTH SIGNUP =====
-- Creates a profile with hashed password, returns the new user ID
CREATE OR REPLACE FUNCTION public.auth_signup(
  p_email text,
  p_password text,
  p_display_name text,
  p_postcode text,
  p_account_type text DEFAULT 'player',
  p_age_range text DEFAULT NULL,
  p_avatar text DEFAULT NULL,
  p_company_name text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_telephone text DEFAULT NULL,
  p_crn text DEFAULT NULL,
  p_referral_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_ref_code text;
  v_hecu integer;
  v_approved boolean;
  v_referrer public.profiles%ROWTYPE;
  v_existing text;
BEGIN
  -- Check email not already taken
  SELECT email INTO v_existing FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Email already registered');
  END IF;

  -- Generate referral code for new user
  v_ref_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  -- Set defaults
  v_hecu := CASE WHEN p_account_type = 'player' THEN 50000 ELSE 0 END;
  v_approved := p_account_type != 'advertiser';

  -- Look up referrer
  IF COALESCE(p_referral_code, '') != '' THEN
    SELECT * INTO v_referrer FROM public.profiles
    WHERE referral_code = upper(trim(p_referral_code)) LIMIT 1;
  END IF;

  -- Player referred by player: +10,000 HECUs for new player
  IF v_referrer.id IS NOT NULL AND p_account_type = 'player' AND v_referrer.account_type = 'player' THEN
    v_hecu := v_hecu + 10000;
  END IF;

  -- Create profile with hashed password
  INSERT INTO public.profiles (
    id, display_name, email, postcode, age_range, avatar, account_type,
    hecu_balance, is_approved, company_name, website, contact_name, telephone, crn,
    referral_code, referred_by, password_hash
  ) VALUES (
    gen_random_uuid(), p_display_name, lower(p_email), p_postcode, p_age_range, p_avatar, p_account_type,
    v_hecu, v_approved, p_company_name, p_website, p_contact_name, p_telephone, p_crn,
    v_ref_code, v_referrer.id, crypt(p_password, gen_salt('bf'))
  )
  RETURNING id INTO v_id;

  -- Reward referrer
  IF v_referrer.id IS NOT NULL THEN
    IF p_account_type = 'player' AND v_referrer.account_type = 'player' THEN
      UPDATE public.profiles SET hecu_balance = hecu_balance + 10000, geo_tokens = geo_tokens + 1
      WHERE id = v_referrer.id;
      INSERT INTO public.referrals (referrer_id, referred_id, referral_type, reward_given)
      VALUES (v_referrer.id, v_id, 'player', true);
    ELSIF p_account_type = 'advertiser' AND v_referrer.account_type = 'advertiser' THEN
      UPDATE public.profiles SET referral_discount_percent = LEAST(50, referral_discount_percent + 10)
      WHERE id = v_referrer.id;
      INSERT INTO public.referrals (referrer_id, referred_id, referral_type, reward_given)
      VALUES (v_referrer.id, v_id, 'advertiser', true);
    END IF;
  END IF;

  RETURN jsonb_build_object('user_id', v_id, 'referral_code', v_ref_code);
END;
$$;

-- ===== AUTH LOGIN =====
-- Verifies credentials, creates session, returns token + user data
CREATE OR REPLACE FUNCTION public.auth_login(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_token text;
  v_session_id uuid;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid email or password');
  END IF;

  IF v_profile.password_hash IS NULL THEN
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

  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Delete old sessions for this user (one session at a time)
  DELETE FROM public.sessions WHERE user_id = v_profile.id;

  -- Create new session (7 day expiry)
  INSERT INTO public.sessions (id, user_id, token, expires_at)
  VALUES (gen_random_uuid(), v_profile.id, v_token, now() + interval '7 days')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'token', v_token,
    'user_id', v_profile.id::text,
    'display_name', v_profile.display_name,
    'email', v_profile.email,
    'account_type', v_profile.account_type,
    'is_approved', v_profile.is_approved
  );
END;
$$;

-- ===== AUTH VALIDATE SESSION =====
-- Checks if a token is valid, returns user data
CREATE OR REPLACE FUNCTION public.auth_validate_session(
  p_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session public.sessions%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.sessions WHERE token = p_token LIMIT 1;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid session');
  END IF;

  IF v_session.expires_at < now() THEN
    DELETE FROM public.sessions WHERE id = v_session.id;
    RETURN jsonb_build_object('error', 'Session expired');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_session.user_id LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_profile.id::text,
    'display_name', v_profile.display_name,
    'email', v_profile.email,
    'account_type', v_profile.account_type,
    'is_approved', v_profile.is_approved,
    'is_confirmed', v_profile.is_confirmed
  );
END;
$$;

-- ===== AUTH LOGOUT =====
CREATE OR REPLACE FUNCTION public.auth_logout(
  p_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sessions WHERE token = p_token;
END;
$$;

-- ===== CONFIRM EMAIL =====
-- Verifies confirmation code and marks user as confirmed
CREATE OR REPLACE FUNCTION public.auth_confirm_code(
  p_email text,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM public.profiles
  WHERE lower(email) = lower(p_email) AND confirmation_code = p_code
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid code');
  END IF;

  UPDATE public.profiles SET is_confirmed = true, confirmation_code = NULL
  WHERE id = v_profile.id;

  RETURN jsonb_build_object('success', true, 'user_id', v_profile.id::text);
END;
$$;

-- ===== SET CONFIRMATION CODE =====
CREATE OR REPLACE FUNCTION public.auth_set_confirmation_code(
  p_email text,
  p_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET confirmation_code = p_code
  WHERE lower(email) = lower(p_email);
END;
$$;

-- ===== CREATE ADMIN USER =====
CREATE OR REPLACE FUNCTION public.auth_create_admin(
  p_email text,
  p_password text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_ref_code text;
  v_existing text;
BEGIN
  SELECT email INTO v_existing FROM public.profiles WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Email already registered');
  END IF;

  v_ref_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  INSERT INTO public.profiles (
    id, display_name, email, account_type, hecu_balance, is_approved, is_confirmed,
    referral_code, password_hash
  ) VALUES (
    gen_random_uuid(), p_display_name, lower(p_email), 'admin', 0, true, true,
    v_ref_code, crypt(p_password, gen_salt('bf'))
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('user_id', v_id, 'referral_code', v_ref_code);
END;
$$;

-- Grant execute to anon role (so client can call via RPC)
GRANT EXECUTE ON FUNCTION public.auth_signup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_validate_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_logout TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_confirm_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_set_confirmation_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_create_admin TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
