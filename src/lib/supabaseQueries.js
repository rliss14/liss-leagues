import { supabase } from '../supabaseClient'

// ---- Members ----
export async function getMembers() {
  const { data, error } = await supabase.from('members').select('*').order('name')
  if (error) throw error
  return data
}

// ---- Seasons ----
export async function getSeasons() {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('start_year', { ascending: false })
  if (error) throw error
  return data
}

export async function getCurrentSeason() {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .maybeSingle()
  if (error) throw error
  return data
}

// ---- Weekly assignments (who owns which team, per week, per season) ----
export async function getAssignments(seasonId) {
  const { data, error } = await supabase
    .from('weekly_assignments')
    .select('*, members(name)')
    .eq('season_id', seasonId)
    .order('week')
  if (error) throw error
  return data
}

export async function upsertAssignments(rows) {
  // rows: [{ season_id, week, member_id, team_abbr }]
  const { error } = await supabase
    .from('weekly_assignments')
    .upsert(rows, { onConflict: 'season_id,week,member_id' })
  if (error) throw error
}

// ---- Weekly results (Record Book — historical + finalized-current rows) ----
export async function getResults(seasonId) {
  const { data, error } = await supabase
    .from('weekly_results')
    .select('*, members(name)')
    .eq('season_id', seasonId)
    .order('week')
  if (error) throw error
  return data
}

export async function getAllResults() {
  const { data, error } = await supabase
    .from('weekly_results')
    .select('*, members(name), seasons(label)')
  if (error) throw error
  return data
}

export async function upsertResults(rows) {
  // rows: [{ season_id, week, member_id, team_abbr, opponent_abbr, score, win, amount_won, result_type }]
  // result_type: 'hit33' | 'week18_payout' | null
  const { error } = await supabase
    .from('weekly_results')
    .upsert(rows, { onConflict: 'season_id,week,member_id' })
  if (error) throw error
}

// ---- Season awards (best/worst cumulative diff, computed at season end) ----
export async function getSeasonAwards(seasonId) {
  const { data, error } = await supabase
    .from('season_awards')
    .select('*, members(name)')
    .eq('season_id', seasonId)
  if (error) throw error
  return data
}

export async function upsertSeasonAwards(rows) {
  const { error } = await supabase
    .from('season_awards')
    .upsert(rows, { onConflict: 'season_id,award_type' })
  if (error) throw error
}
