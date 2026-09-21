-- Highlife Games — Registration rules additions
-- Run AFTER custom-auth.sql.
--
-- Rules of Play implemented:
--   * Players register a Username used in all game play — it is theirs for
--     life. If taken, suggested variations are offered.
--   * Full address + postcode collected; only the postal area (e.g.
--     "Abergavenny") is ever shown to other players.
--   * Gender identity selected at registration.

-- New profile fields
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists address_line text;
alter table public.profiles add column if not exists postal_area text; -- public-facing location only

-- Username is unique for life once registered
create unique index if not exists profiles_username_idx
  on public.profiles (lower(username)) where username is not null;

-- ============================================
-- CHECK USERNAME — returns availability + suggested variations
-- ============================================
create or replace function public.check_username(p_username text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_clean text;
  v_taken boolean;
  v_suggestions text[] := '{}';
  v_candidate text;
  i integer;
begin
  v_clean := trim(p_username);
  if char_length(v_clean) < 3 or char_length(v_clean) > 20 then
    return jsonb_build_object('error', 'Username must be 3–20 characters');
  end if;
  if v_clean !~ '^[A-Za-z0-9_.-]+$' then
    return jsonb_build_object('error', 'Letters, numbers, dots, dashes and underscores only');
  end if;

  select exists(select 1 from public.profiles where lower(username) = lower(v_clean)) into v_taken;
  if not v_taken then
    return jsonb_build_object('available', true, 'username', v_clean);
  end if;

  -- Offer variations of the taken name
  i := 1;
  while array_length(v_suggestions, 1) is null or array_length(v_suggestions, 1) < 3 loop
    v_candidate := v_clean || (floor(random() * 90) + 10)::text;
    if i > 1 then v_candidate := v_clean || '_' || (floor(random() * 900) + 100)::text; end if;
    if not exists(select 1 from public.profiles where lower(username) = lower(v_candidate)) then
      v_suggestions := array_append(v_suggestions, v_candidate);
    end if;
    i := i + 1;
    if i > 20 then exit; end if;
  end loop;

  return jsonb_build_object('available', false, 'suggestions', v_suggestions);
end;
$$;

-- ============================================
-- UPDATED AUTH SIGNUP — username + gender + address
-- ============================================
create or replace function public.auth_signup(
  p_email text,
  p_password text,
  p_display_name text,
  p_postcode text,
  p_account_type text default 'player',
  p_age_range text default null,
  p_avatar text default null,
  p_company_name text default null,
  p_website text default null,
  p_contact_name text default null,
  p_telephone text default null,
  p_crn text default null,
  p_referral_code text default null,
  p_username text default null,
  p_gender text default null,
  p_address_line text default null,
  p_postal_area text default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
  v_ref_code text;
  v_hecu integer;
  v_approved boolean;
  v_referrer public.profiles%ROWTYPE;
  v_existing text;
  v_username_check jsonb;
begin
  -- Check email not already taken
  select email into v_existing from public.profiles where lower(email) = lower(p_email) limit 1;
  if v_existing is not null then
    return jsonb_build_object('error', 'Email already registered');
  end if;

  -- Players must choose a unique Username (registered for life)
  if p_account_type = 'player' then
    if coalesce(p_username, '') = '' then
      return jsonb_build_object('error', 'Please choose a player Username');
    end if;
    v_username_check := public.check_username(p_username);
    if (v_username_check->>'available')::boolean is not true then
      return jsonb_build_object('error', 'Username already registered', 'suggestions', v_username_check->'suggestions');
    end if;
  end if;

  -- Generate referral code for new user
  v_ref_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  -- Set defaults
  v_hecu := case when p_account_type = 'player' then 50000 else 0 end;
  v_approved := p_account_type != 'advertiser';

  -- Look up referrer
  if coalesce(p_referral_code, '') != '' then
    select * into v_referrer from public.profiles
    where referral_code = upper(trim(p_referral_code)) limit 1;
  end if;

  -- Player referred by player: +10,000 HECUs for new player
  if v_referrer.id is not null and p_account_type = 'player' and v_referrer.account_type = 'player' then
    v_hecu := v_hecu + 10000;
  end if;

  -- Create profile with hashed password
  insert into public.profiles (
    id, display_name, email, postcode, age_range, avatar, account_type,
    hecu_balance, is_approved, company_name, website, contact_name, telephone, crn,
    referral_code, referred_by, password_hash,
    username, gender, address_line, postal_area
  ) values (
    gen_random_uuid(), p_display_name, lower(p_email), p_postcode, p_age_range, p_avatar, p_account_type,
    v_hecu, v_approved, p_company_name, p_website, p_contact_name, p_telephone, p_crn,
    v_ref_code, v_referrer.id, crypt(p_password, gen_salt('bf')),
    nullif(trim(p_username), ''), p_gender, p_address_line, p_postal_area
  )
  returning id into v_id;

  -- Personal game account row (requires game-rules-schema.sql to be run first)
  if p_account_type = 'player' and to_regclass('public.player_game_accounts') is not null then
    insert into public.player_game_accounts (player_id)
    values (v_id)
    on conflict (player_id) do nothing;
  end if;

  -- Reward referrer
  if v_referrer.id is not null then
    if p_account_type = 'player' and v_referrer.account_type = 'player' then
      update public.profiles set hecu_balance = hecu_balance + 10000, geo_tokens = geo_tokens + 1
      where id = v_referrer.id;
      insert into public.referrals (referrer_id, referred_id, referral_type, reward_given)
      values (v_referrer.id, v_id, 'player', true);
    elsif p_account_type = 'advertiser' and v_referrer.account_type = 'advertiser' then
      update public.profiles set referral_discount_percent = least(50, referral_discount_percent + 10)
      where id = v_referrer.id;
      insert into public.referrals (referrer_id, referred_id, referral_type, reward_given)
      values (v_referrer.id, v_id, 'advertiser', true);
    end if;
  end if;

  return jsonb_build_object('user_id', v_id, 'referral_code', v_ref_code, 'username', p_username);
end;
$$;

grant execute on function public.check_username to anon, authenticated;
grant execute on function public.auth_signup to anon, authenticated;

notify pgrst, 'reload schema';
