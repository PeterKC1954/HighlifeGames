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

-- Auto-create profile on signup (optional trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, postcode, age_range, avatar, account_type)
  values (
    new.id,
    new.raw_user_meta_data->>'displayName',
    new.email,
    new.raw_user_meta_data->>'postcode',
    new.raw_user_meta_data->>'ageRange',
    new.raw_user_meta_data->>'avatar',
    coalesce(new.raw_user_meta_data->>'accountType', 'player')
  );
  return new;
end;
$$;

-- Trigger: auto-create profile when a new auth user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
