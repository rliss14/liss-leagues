-- Liss Leagues — migration 03
-- Adds multi-pool support (NFL33 + NFL25) and the Super Bowl squares scaffold.
-- Safe to run on an existing database: existing rows default to NFL33.
-- Run this in the Supabase SQL Editor.

-- ---------------------------------------------------------------
-- 1. Scope members and seasons to a pool
-- ---------------------------------------------------------------
alter table members add column if not exists pool text not null default 'NFL33';
alter table seasons add column if not exists pool text not null default 'NFL33';

-- The old single-column uniqueness blocks two pools from sharing a season
-- label ("2026-27") or a member name. Replace with pool-scoped uniqueness.
alter table seasons drop constraint if exists seasons_label_key;
alter table members drop constraint if exists members_name_key;

create unique index if not exists seasons_pool_label_key on seasons (pool, label);
create unique index if not exists members_pool_name_key on members (pool, name);

create index if not exists idx_seasons_pool on seasons (pool);
create index if not exists idx_members_pool on members (pool);

-- weekly_assignments and weekly_results hang off season_id, so they separate
-- by pool automatically. No changes needed there.

-- ---------------------------------------------------------------
-- 1b. Allow a per-pool "hit" marker (hit33 for NFL33, hit25 for NFL25)
-- ---------------------------------------------------------------
alter table weekly_results drop constraint if exists weekly_results_result_type_check;
alter table weekly_results add constraint weekly_results_result_type_check
  check (result_type in ('hit33', 'hit25', 'week18_payout'));

-- ---------------------------------------------------------------
-- 2. Super Bowl squares (structure only — payout rules still TBD)
-- ---------------------------------------------------------------
create table if not exists squares (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  position int not null check (position between 0 and 99), -- 0-99, row-major
  name text,
  created_at timestamptz not null default now(),
  unique (season_id, position)
);

-- The digits drawn for each axis, stored as comma-separated strings
-- ("3,7,1,0,..."). Blank until the draw happens.
create table if not exists squares_config (
  season_id uuid primary key references seasons(id) on delete cascade,
  row_digits text,
  col_digits text,
  row_label text default 'AFC',
  col_label text default 'NFC',
  updated_at timestamptz not null default now()
);

alter table squares enable row level security;
alter table squares_config enable row level security;
create policy "anon full access" on squares for all using (true) with check (true);
create policy "anon full access" on squares_config for all using (true) with check (true);
