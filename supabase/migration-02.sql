-- Liss Leagues — migration 02
-- Adds the fields needed for the expanded Record Book stats.
-- Safe to run on an existing database: it only ADDs columns, nothing is dropped.
-- Run this in the Supabase SQL Editor the same way you ran schema.sql.

-- Did the NFL team win the actual game? (separate from whether the member
-- won money — a member can win the pool with a team that lost the game.)
alter table weekly_results
  add column if not exists team_won_game boolean;

-- Was the member's team playing at home or away that week?
alter table weekly_results
  add column if not exists home_away text
  check (home_away in ('home', 'away'));

-- Helpful indexes for the all-time aggregations.
create index if not exists idx_results_result_type on weekly_results (result_type);
create index if not exists idx_results_team on weekly_results (team_abbr);
create index if not exists idx_results_opponent on weekly_results (opponent_abbr);
