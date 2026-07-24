-- Highlife Games — Database schema (custom auth, no Supabase Auth)
-- Run this in the Supabase SQL Editor (Dashboard > SQL > New Query)

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Profiles table (standalone, no auth.users FK)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text not null unique,
  postcode text,
  age_range text,
  avatar text,
  account_type text not null default 'player' check (account_type in ('player', 'admin', 'advertiser')),
  hecu_balance integer not null default 0,
  company_name text,
  website text,
  contact_name text,
  telephone text,
  crn text,
  proof_of_address_url text,
  is_approved boolean not null default false,
  confirmation_code text,
  is_confirmed boolean not null default false,
  password_hash text,
  referral_code text,
  referred_by uuid references public.profiles(id) on delete set null,
  geo_tokens integer not null default 0,
  referral_discount_percent integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: users can read their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Policy: users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policy: users can insert their own profile
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Policy: admins can read all profiles
create policy "Admins can read all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'admin')
  );

-- Policy: admins can update all profiles (for approval)
create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'admin')
  );

-- Auto-create profile on signup (optional trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_account_type text;
  v_hecu integer;
  v_approved boolean;
begin
  v_account_type := coalesce(new.raw_user_meta_data->>'accountType', 'player');
  v_hecu := case when v_account_type = 'player' then 50000 else 0 end;
  v_approved := v_account_type != 'advertiser';

  insert into public.profiles (id, display_name, email, postcode, age_range, avatar, account_type, hecu_balance, is_approved, company_name, website, contact_name, telephone, crn)
  values (
    new.id,
    new.raw_user_meta_data->>'displayName',
    new.email,
    new.raw_user_meta_data->>'postcode',
    new.raw_user_meta_data->>'ageRange',
    new.raw_user_meta_data->>'avatar',
    v_account_type,
    v_hecu,
    v_approved,
    new.raw_user_meta_data->>'companyName',
    new.raw_user_meta_data->>'website',
    new.raw_user_meta_data->>'contactName',
    new.raw_user_meta_data->>'telephone',
    new.raw_user_meta_data->>'crn'
  );
  return new;
end;
$$;

-- Trigger: auto-create profile when a new auth user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ADVERTISER POSTCODE CLAIMS + ADVERTS
-- ============================================

-- Postcode claims: advertisers claim exclusive areas (£20/week)
create table if not exists public.postcode_claims (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.profiles(id) on delete cascade,
  postcode text not null,
  area_name text,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  price_per_week integer not null default 20,
  started_at timestamptz,
  expires_at timestamptz,
  changes_remaining integer not null default 3,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique: only one active/pending claim per postcode area (first come, first served)
create unique index if not exists one_claim_per_postcode
  on public.postcode_claims (upper(postcode))
  where status in ('pending', 'active');

-- Adverts: 3 changes per month per claim, shown on game boards
create table if not exists public.adverts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.postcode_claims(id) on delete cascade,
  advertiser_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  image_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.postcode_claims enable row level security;
alter table public.adverts enable row level security;

create policy "Advertisers can read own claims" on public.postcode_claims
  for select using (
    auth.uid() = advertiser_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'admin')
  );

create policy "Anyone can check claimed postcodes" on public.postcode_claims
  for select using (status in ('pending', 'active'));

create policy "Advertisers can insert own claims" on public.postcode_claims
  for insert with check (
    auth.uid() = advertiser_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'advertiser' and p.is_approved = true)
  );

create policy "Advertisers can update own claims" on public.postcode_claims
  for update using (
    auth.uid() = advertiser_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'admin')
  );

create policy "Advertisers can read own adverts" on public.adverts
  for select using (
    auth.uid() = advertiser_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'admin')
  );

create policy "Advertisers can insert own adverts" on public.adverts
  for insert with check (auth.uid() = advertiser_id);

create policy "Advertisers can update own adverts" on public.adverts
  for update using (auth.uid() = advertiser_id);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================

-- REFERRAL SYSTEM
-- Players refer players: both get 10,000 HECUs, referrer gets 1 Geo Token per referral
-- (Geo Token = go to the advertiser's geo location square in the game)
-- Advertisers refer advertisers: referrer gets 10% discount per referred advertiser (max 50%)

-- Referral columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS geo_tokens integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_discount_percent integer NOT NULL DEFAULT 0;

-- Backfill referral codes for existing users
UPDATE public.profiles
SET referral_code = upper(substr(md5(id::text || 'highlife'), 1, 8))
WHERE referral_code IS NULL;

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_type text NOT NULL CHECK (referral_type IN ('player', 'advertiser')),
  reward_given boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own referrals" ON public.referrals;
CREATE POLICY "Users can read own referrals" ON public.referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

-- Updated signup trigger: generates referral code + processes referral rewards
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_hecu integer;
  v_approved boolean;
  v_ref_code text;
  v_referrer public.profiles%ROWTYPE;
BEGIN
  v_account_type := COALESCE(new.raw_user_meta_data->>'accountType', 'player');
  v_hecu := CASE WHEN v_account_type = 'player' THEN 50000 ELSE 0 END;
  v_approved := v_account_type != 'advertiser';
  v_ref_code := upper(substr(md5(new.id::text || 'highlife'), 1, 8));

  -- Look up referrer if a code was supplied
  IF COALESCE(new.raw_user_meta_data->>'referralCode', '') != '' THEN
    SELECT * INTO v_referrer FROM public.profiles
    WHERE referral_code = upper(trim(new.raw_user_meta_data->>'referralCode'))
    LIMIT 1;
  END IF;

  -- Player referred by player: new player gets +10,000 HECUs
  IF v_referrer.id IS NOT NULL AND v_account_type = 'player' AND v_referrer.account_type = 'player' THEN
    v_hecu := v_hecu + 10000;
  END IF;

  INSERT INTO public.profiles (id, display_name, email, postcode, age_range, avatar, account_type, hecu_balance, is_approved, company_name, website, contact_name, telephone, crn, referral_code, referred_by)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'displayName',
    new.email,
    new.raw_user_meta_data->>'postcode',
    new.raw_user_meta_data->>'ageRange',
    new.raw_user_meta_data->>'avatar',
    v_account_type,
    v_hecu,
    v_approved,
    new.raw_user_meta_data->>'companyName',
    new.raw_user_meta_data->>'website',
    new.raw_user_meta_data->>'contactName',
    new.raw_user_meta_data->>'telephone',
    new.raw_user_meta_data->>'crn',
    v_ref_code,
    v_referrer.id
  );

  -- Reward the referrer
  IF v_referrer.id IS NOT NULL THEN
    IF v_account_type = 'player' AND v_referrer.account_type = 'player' THEN
      -- Referrer: +10,000 HECUs and +1 Geo Token
      UPDATE public.profiles
      SET hecu_balance = hecu_balance + 10000,
          geo_tokens = geo_tokens + 1
      WHERE id = v_referrer.id;

      INSERT INTO public.referrals (referrer_id, referred_id, referral_type, reward_given)
      VALUES (v_referrer.id, new.id, 'player', true);

    ELSIF v_account_type = 'advertiser' AND v_referrer.account_type = 'advertiser' THEN
      -- Referrer advertiser: +10% discount per referral, capped at 50%
      UPDATE public.profiles
      SET referral_discount_percent = LEAST(50, referral_discount_percent + 10)
      WHERE id = v_referrer.id;

      INSERT INTO public.referrals (referrer_id, referred_id, referral_type, reward_given)
      VALUES (v_referrer.id, new.id, 'advertiser', true);
    END IF;
  END IF;

  RETURN new;
END;
$$;
