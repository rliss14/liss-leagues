-- Liss Leagues — Supabase schema (33 Point Pool, phase 1)
-- Run this once in the Supabase SQL Editor for your new project.

create extension if not exists "pgcrypto";

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,        -- e.g. '2023-24'
  start_year int not null,           -- e.g. 2023 (used for ESPN's `year` param)
  is_current boolean not null default false,
  current_week int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists weekly_assignments (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  week int not null check (week between 1 and 18),
  member_id uuid not null references members(id) on delete cascade,
  team_abbr text not null,
  created_at timestamptz not null default now(),
  unique (season_id, week, member_id)
);

create table if not exists weekly_results (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  week int not null check (week between 1 and 18),
  member_id uuid not null references members(id) on delete cascade,
  team_abbr text not null,
  opponent_abbr text,
  score int,
  win boolean not null default false,
  amount_won numeric,
  result_type text check (result_type in ('hit33', 'week18_payout')), -- null = not a paid result
  created_at timestamptz not null default now(),
  unique (season_id, week, member_id)
);

create table if not exists season_awards (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  award_type text not null check (award_type in ('best_consistency', 'worst_consistency')),
  member_id uuid not null references members(id) on delete cascade,
  value numeric not null,   -- cumulative |33 - score| for the season
  payout numeric,
  created_at timestamptz not null default now(),
  unique (season_id, award_type)
);

-- Row Level Security: this app has no login screen (it's a private
-- friend-group tool), so we allow the public anon key full read/write.
-- Keep the anon key out of any public repo README/screenshots; the
-- Supabase URL + anon key together are effectively your app's password.
alter table members enable row level security;
alter table seasons enable row level security;
alter table weekly_assignments enable row level security;
alter table weekly_results enable row level security;
alter table season_awards enable row level security;

create policy "anon full access" on members for all using (true) with check (true);
create policy "anon full access" on seasons for all using (true) with check (true);
create policy "anon full access" on weekly_assignments for all using (true) with check (true);
create policy "anon full access" on weekly_results for all using (true) with check (true);
create policy "anon full access" on season_awards for all using (true) with check (true);
