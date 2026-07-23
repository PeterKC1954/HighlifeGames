-- Highlife Games — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL > New Query)

-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
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
