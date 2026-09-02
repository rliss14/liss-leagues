-- Liss Leagues — migration 07
-- Lock down writes. Everyone can still read; only a signed-in user can change
-- anything. Run this AFTER creating your login (see the README).
--
-- Before this migration, the public anon key could write to every table. That
-- key ships inside the site's JavaScript, so anyone who opened DevTools could
-- have overwritten a season. This closes that.

-- ---------------------------------------------------------------
-- 1. Drop the old wide-open policies
-- ---------------------------------------------------------------
drop policy if exists "anon full access" on members;
drop policy if exists "anon full access" on seasons;
drop policy if exists "anon full access" on weekly_assignments;
drop policy if exists "anon full access" on weekly_results;
drop policy if exists "anon full access" on season_awards;
drop policy if exists "anon full access" on squares;
drop policy if exists "anon full access" on squares_config;
drop policy if exists "anon full access" on ff_standings;
drop policy if exists "anon full access" on ff_playoffs;
drop policy if exists "anon full access" on ff_weekly;

-- ---------------------------------------------------------------
-- 2. Public read, authenticated write
-- ---------------------------------------------------------------
-- Read stays open so league members can browse without an account.
create policy "public read" on members            for select using (true);
create policy "public read" on seasons            for select using (true);
create policy "public read" on weekly_assignments for select using (true);
create policy "public read" on weekly_results     for select using (true);
create policy "public read" on season_awards      for select using (true);
create policy "public read" on squares            for select using (true);
create policy "public read" on squares_config     for select using (true);
create policy "public read" on ff_standings       for select using (true);
create policy "public read" on ff_playoffs        for select using (true);
create policy "public read" on ff_weekly          for select using (true);

-- Writes require a signed-in session.
create policy "auth write" on members            for all to authenticated using (true) with check (true);
create policy "auth write" on seasons            for all to authenticated using (true) with check (true);
create policy "auth write" on weekly_assignments for all to authenticated using (true) with check (true);
create policy "auth write" on weekly_results     for all to authenticated using (true) with check (true);
create policy "auth write" on season_awards      for all to authenticated using (true) with check (true);
create policy "auth write" on squares            for all to authenticated using (true) with check (true);
create policy "auth write" on squares_config     for all to authenticated using (true) with check (true);
create policy "auth write" on ff_standings       for all to authenticated using (true) with check (true);
create policy "auth write" on ff_playoffs        for all to authenticated using (true) with check (true);
create policy "auth write" on ff_weekly          for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------
-- 3. Confirm RLS is on everywhere (it's the switch that makes the
--    policies above actually apply)
-- ---------------------------------------------------------------
alter table members            enable row level security;
alter table seasons            enable row level security;
alter table weekly_assignments enable row level security;
alter table weekly_results     enable row level security;
alter table season_awards      enable row level security;
alter table squares            enable row level security;
alter table squares_config     enable row level security;
alter table ff_standings       enable row level security;
alter table ff_playoffs        enable row level security;
alter table ff_weekly          enable row level security;
