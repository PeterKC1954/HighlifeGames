-- Highlife Games — Rules of Play schema additions
-- Run AFTER supabase-schema.sql / custom-auth.sql in the Supabase SQL Editor.
--
-- Implements:
--   * Personal Game Account balances (Gold Coins)
--   * Boffin inventory (cash-bought boffins persist; gold-coin ones never do)
--   * Prize seat tickets: 5 parts, serial split across parts, max 2 purchasable
--   * Ticket part trading (a part may only ever be transferred once)
--   * Player-to-player messaging + ticket part search
--   * Cognitive tracking points (reset weekly — mystery prize)
--   * GEO chests at sponsor locations (HECUs + Gold Coins)

-- ============================================
-- PERSONAL GAME ACCOUNT
-- ============================================
create table if not exists public.player_game_accounts (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  gold_coins integer not null default 0 check (gold_coins >= 0),
  cognitive_points integer not null default 0,
  cognitive_week text,                       -- ISO week e.g. '2026-W38'; reset when stale
  show_tickets_publicly boolean not null default true, -- home page visibility choice
  updated_at timestamptz not null default now()
);

alter table public.player_game_accounts enable row level security;

create policy "Players read own game account" on public.player_game_accounts
  for select using (auth.uid() = player_id);
create policy "Players see public ticket holders" on public.player_game_accounts
  for select using (show_tickets_publicly = true);

-- ============================================
-- BOFFIN INVENTORY (cash-purchased, persists between non-prize games)
-- ============================================
create table if not exists public.boffin_inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  boffin_type text not null check (boffin_type in ('junior', 'senior', 'major')),
  source text not null default 'cash' check (source = 'cash'), -- only cash boffins may persist
  status text not null default 'in_account' check (status in ('in_account', 'registered', 'used', 'expired')),
  created_at timestamptz not null default now()
);

alter table public.boffin_inventory enable row level security;
create policy "Players read own boffins" on public.boffin_inventory
  for select using (auth.uid() = player_id);

-- ============================================
-- PRIZE SEAT TICKETS (5 parts each)
-- ============================================
create table if not exists public.seat_tickets (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  serial char(10) not null,                  -- printed in full on part 1; each part shows 2 digits
  parts boolean[5] not null default '{f,f,f,f,f}',
  purchased_parts integer not null default 0 check (purchased_parts <= 2), -- max 2 parts may be bought
  traded_parts boolean[5] not null default '{f,f,f,f,f}',                  -- a part transfers only once
  status text not null default 'collecting' check (status in ('collecting', 'complete', 'used', 'void')),
  created_at timestamptz not null default now()
);

create unique index if not exists seat_tickets_serial_idx on public.seat_tickets (serial);

alter table public.seat_tickets enable row level security;
create policy "Players read own tickets" on public.seat_tickets
  for select using (auth.uid() = player_id);
create policy "Public ticket holders are searchable" on public.seat_tickets
  for select using (
    exists (select 1 from public.player_game_accounts a
            where a.player_id = seat_tickets.player_id and a.show_tickets_publicly)
  );

-- Award n random parts of a tier to a player (spills onto a fresh ticket when complete)
create or replace function public.award_ticket_parts(p_player_id uuid, p_tier text, p_count integer)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_ticket public.seat_tickets%ROWTYPE;
  v_missing integer[];
  v_idx integer;
begin
  for n in 1..p_count loop
    select * into v_ticket from public.seat_tickets
    where player_id = p_player_id and tier = p_tier and status = 'collecting'
    order by created_at desc limit 1;

    if v_ticket.id is null then
      insert into public.seat_tickets (player_id, tier, serial)
      values (p_player_id, p_tier, lpad((floor(random() * 10000000000))::bigint::text, 10, '0'))
      returning * into v_ticket;
    end if;

    select array_agg(i) into v_missing
    from generate_series(1, 5) i where not v_ticket.parts[i];

    v_idx := v_missing[floor(random() * array_length(v_missing, 1)) + 1];
    v_ticket.parts[v_idx] := true;

    update public.seat_tickets
    set parts = v_ticket.parts,
        status = case when (select bool_and(x) from unnest(v_ticket.parts) x) then 'complete' else 'collecting' end
    where id = v_ticket.id;
  end loop;
end;
$$;

-- Buy a missing part (max 2 per ticket). Payment is handled by the card
-- processor before calling this; p_price_pence is validated server-side.
create or replace function public.buy_ticket_part(p_ticket_id uuid, p_part_index integer, p_price_pence integer)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_ticket public.seat_tickets%ROWTYPE;
  v_price integer;
begin
  select * into v_ticket from public.seat_tickets where id = p_ticket_id for update;
  if v_ticket.id is null then return jsonb_build_object('error', 'Ticket not found'); end if;
  if v_ticket.player_id != auth.uid() then return jsonb_build_object('error', 'Not your ticket'); end if;
  if p_part_index < 1 or p_part_index > 5 then return jsonb_build_object('error', 'Invalid part'); end if;
  if v_ticket.parts[p_part_index] then return jsonb_build_object('error', 'Part already held'); end if;
  if v_ticket.purchased_parts >= 2 then return jsonb_build_object('error', 'Maximum 2 parts may be purchased per ticket'); end if;

  -- Bronze 20p / Silver 50p are published; higher tiers priced on game day only
  v_price := case v_ticket.tier when 'bronze' then 20 when 'silver' then 50 else p_price_pence end;
  if p_price_pence is distinct from v_price then
    return jsonb_build_object('error', 'Incorrect price for this tier today');
  end if;

  v_ticket.parts[p_part_index] := true;
  update public.seat_tickets
  set parts = v_ticket.parts,
      purchased_parts = purchased_parts + 1,
      status = case when (select bool_and(x) from unnest(v_ticket.parts) x) then 'complete' else 'collecting' end
  where id = v_ticket.id;

  return jsonb_build_object('success', true, 'price_pence', v_price);
end;
$$;

-- ============================================
-- TICKET PART TRADING (each part transfers only once)
-- ============================================
create table if not exists public.ticket_part_trades (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.seat_tickets(id) on delete cascade,
  part_index integer not null check (part_index between 1 and 5),
  from_player uuid not null references public.profiles(id),
  to_player uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.ticket_part_trades enable row level security;
create policy "Players see own trades" on public.ticket_part_trades
  for select using (auth.uid() = from_player or auth.uid() = to_player);

-- Move a held part from one player's ticket to another player's ticket of the
-- same tier. A part that has already been traded cannot move again.
create or replace function public.trade_ticket_part(
  p_from_ticket_id uuid, p_part_index integer, p_to_player uuid, p_to_ticket_id uuid default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_from public.seat_tickets%ROWTYPE;
  v_to public.seat_tickets%ROWTYPE;
begin
  select * into v_from from public.seat_tickets where id = p_from_ticket_id for update;
  if v_from.id is null then return jsonb_build_object('error', 'Ticket not found'); end if;
  if v_from.player_id != auth.uid() then return jsonb_build_object('error', 'Not your ticket'); end if;
  if not v_from.parts[p_part_index] then return jsonb_build_object('error', 'You do not hold that part'); end if;
  if v_from.traded_parts[p_part_index] then
    return jsonb_build_object('error', 'This part has already been transferred once');
  end if;

  -- Find or create the recipient's collecting ticket of the same tier
  if p_to_ticket_id is not null then
    select * into v_to from public.seat_tickets where id = p_to_ticket_id for update;
    if v_to.id is null or v_to.player_id != p_to_player or v_to.tier != v_from.tier then
      return jsonb_build_object('error', 'Invalid destination ticket');
    end if;
  else
    select * into v_to from public.seat_tickets
    where player_id = p_to_player and tier = v_from.tier and status = 'collecting'
    order by created_at desc limit 1;
    if v_to.id is null then
      insert into public.seat_tickets (player_id, tier, serial)
      values (p_to_player, v_from.tier, lpad((floor(random() * 10000000000))::bigint::text, 10, '0'))
      returning * into v_to;
    end if;
  end if;

  if v_to.parts[p_part_index] then
    return jsonb_build_object('error', 'Recipient already holds that part');
  end if;

  -- Move the part; mark it as already-transferred on BOTH tickets so it can
  -- never be traded onward again.
  v_from.parts[p_part_index] := false;
  v_from.traded_parts[p_part_index] := true;
  update public.seat_tickets set parts = v_from.parts, traded_parts = v_from.traded_parts, status = 'collecting'
  where id = v_from.id;

  v_to.parts[p_part_index] := true;
  v_to.traded_parts[p_part_index] := true;
  update public.seat_tickets
  set parts = v_to.parts, traded_parts = v_to.traded_parts,
      status = case when (select bool_and(x) from unnest(v_to.parts) x) then 'complete' else 'collecting' end
  where id = v_to.id;

  insert into public.ticket_part_trades (ticket_id, part_index, from_player, to_player)
  values (p_from_ticket_id, p_part_index, auth.uid(), p_to_player);

  return jsonb_build_object('success', true);
end;
$$;

-- Find players who hold a specific missing part (for the home-page search)
create or replace function public.search_part_holders(p_tier text, p_part_index integer)
returns table (player_id uuid, display_name text, postal_area text)
language sql
security definer set search_path = public
as $$
  select t.player_id, p.display_name, p.postal_area
  from public.seat_tickets t
  join public.profiles p on p.id = t.player_id
  join public.player_game_accounts a on a.player_id = t.player_id
  where t.tier = p_tier
    and t.parts[p_part_index]
    and not t.traded_parts[p_part_index]
    and a.show_tickets_publicly;
$$;

-- ============================================
-- PLAYER MESSAGES (home page message box)
-- ============================================
create table if not exists public.player_messages (
  id uuid primary key default gen_random_uuid(),
  from_player uuid not null references public.profiles(id) on delete cascade,
  to_player uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 1000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.player_messages enable row level security;
create policy "Players read own messages" on public.player_messages
  for select using (auth.uid() = from_player or auth.uid() = to_player);
create policy "Players send messages" on public.player_messages
  for insert with check (auth.uid() = from_player);
create policy "Recipients mark read" on public.player_messages
  for update using (auth.uid() = to_player);

-- ============================================
-- COGNITIVE POINTS — weekly reset + mystery prize
-- ============================================
-- Resets everyone's tracking points at week rollover. Call from a scheduled
-- job (Supabase cron) or lazily at read time.
create or replace function public.reset_weekly_cognitive(p_week text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
begin
  update public.player_game_accounts
  set cognitive_points = 0, cognitive_week = p_week, updated_at = now()
  where cognitive_week is distinct from p_week;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Weekly mystery prize shortlist — highest cognitive points this week
create or replace function public.cognitive_leaderboard(p_week text)
returns table (player_id uuid, display_name text, points integer)
language sql
security definer set search_path = public
as $$
  select a.player_id, p.display_name, a.cognitive_points
  from public.player_game_accounts a
  join public.profiles p on p.id = a.player_id
  where a.cognitive_week = p_week
  order by a.cognitive_points desc
  limit 20;
$$;

create table if not exists public.mystery_prize_winners (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id),
  week text not null,
  prize text,
  created_at timestamptz not null default now(),
  unique (player_id, week)
);

-- ============================================
-- GEO CHESTS (HECUs + Gold Coins at sponsor locations)
-- ============================================
create table if not exists public.geo_chests (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision,
  lng double precision,
  radius_m integer not null default 100,
  hecu_amount integer not null default 0,
  gold_coins integer not null default 0,
  max_claims integer not null default 1,
  claims integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.geo_chest_claims (
  id uuid primary key default gen_random_uuid(),
  chest_id uuid not null references public.geo_chests(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (chest_id, player_id)
);

alter table public.geo_chests enable row level security;
alter table public.geo_chest_claims enable row level security;
create policy "Anyone can see active chests" on public.geo_chests
  for select using (is_active = true);
create policy "Players read own claims" on public.geo_chest_claims
  for select using (auth.uid() = player_id);

-- Claim a chest: credits the player's game account. Traded/gifted packs are
-- handled client-side via component registration before a game.
create or replace function public.claim_geo_chest(p_chest_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_chest public.geo_chests%ROWTYPE;
begin
  select * into v_chest from public.geo_chests where id = p_chest_id and is_active for update;
  if v_chest.id is null then return jsonb_build_object('error', 'Chest not found'); end if;
  if v_chest.claims >= v_chest.max_claims then return jsonb_build_object('error', 'Chest already claimed'); end if;
  if exists (select 1 from public.geo_chest_claims where chest_id = p_chest_id and player_id = auth.uid()) then
    return jsonb_build_object('error', 'You have already claimed this chest');
  end if;

  insert into public.geo_chest_claims (chest_id, player_id) values (p_chest_id, auth.uid());
  update public.geo_chests set claims = claims + 1 where id = p_chest_id;

  insert into public.player_game_accounts (player_id, gold_coins)
  values (auth.uid(), v_chest.gold_coins)
  on conflict (player_id) do update
  set gold_coins = player_game_accounts.gold_coins + v_chest.gold_coins, updated_at = now();

  if v_chest.hecu_amount > 0 then
    update public.profiles set hecu_balance = hecu_balance + v_chest.hecu_amount where id = auth.uid();
  end if;

  return jsonb_build_object('success', true, 'gold_coins', v_chest.gold_coins, 'hecu', v_chest.hecu_amount);
end;
$$;

-- ============================================
-- PRIZE GAME SESSIONS (seats allocated by Highlife — no table/foe choice)
-- ============================================
create table if not exists public.prize_game_sessions (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  scheduled_at timestamptz not null,
  seats integer not null default 5,
  part_price_pence integer,                -- revealed on game day
  status text not null default 'scheduled' check (status in ('scheduled', 'open', 'in_play', 'finished'))
);

create table if not exists public.prize_game_seats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.prize_game_sessions(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  ticket_id uuid references public.seat_tickets(id),
  seat_number integer,                     -- allocated by Highlife, not chosen
  created_at timestamptz not null default now(),
  unique (session_id, player_id)
);

alter table public.prize_game_sessions enable row level security;
alter table public.prize_game_seats enable row level security;
create policy "Anyone sees scheduled games" on public.prize_game_sessions
  for select using (true);
create policy "Players see own seats" on public.prize_game_seats
  for select using (auth.uid() = player_id);

-- Grants for RPC access
grant execute on function public.award_ticket_parts to anon, authenticated;
grant execute on function public.buy_ticket_part to anon, authenticated;
grant execute on function public.trade_ticket_part to anon, authenticated;
grant execute on function public.search_part_holders to anon, authenticated;
grant execute on function public.reset_weekly_cognitive to anon, authenticated;
grant execute on function public.cognitive_leaderboard to anon, authenticated;
grant execute on function public.claim_geo_chest to anon, authenticated;

notify pgrst, 'reload schema';
