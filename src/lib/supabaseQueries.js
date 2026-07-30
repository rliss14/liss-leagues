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

// ---- Weekly assignments ----
export async function getAssignments(seasonId) {
  const { data, error } = await supabase
    .from('weekly_assignments')
    .select('*, members(name)')
    .eq('season_id', seasonId)
    .order('week')
  if (error) throw error
  return data
}

export async function getAllAssignments() {
  const { data, error } = await supabase
    .from('weekly_assignments')
    .select('*, members(name), seasons(label, start_year)')
  if (error) throw error
  return data
}

export async function upsertAssignments(rows) {
  const { error } = await supabase
    .from('weekly_assignments')
    .upsert(rows, { onConflict: 'season_id,week,member_id' })
  if (error) throw error
}

// ---- Weekly results ----
export async function getResults(seasonId) {
  const { data, error } = await supabase
    .from('weekly_results')
    .select('*, members(name)')
    .eq('season_id', seasonId)
    .order('week')
  if (error) throw error
  return data
}

// Every result row across every season, with season label attached.
export async function getAllResults() {
  const { data, error } = await supabase
    .from('weekly_results')
    .select('*, members(name), seasons(label, start_year)')
  if (error) throw error
  return data
}

export async function upsertResults(rows) {
  const { error } = await supabase
    .from('weekly_results')
    .upsert(rows, { onConflict: 'season_id,week,member_id' })
  if (error) throw error
}

// ---- Season awards ----
export async function getSeasonAwards(seasonId) {
  const { data, error } = await supabase
    .from('season_awards')
    .select('*, members(name)')
    .eq('season_id', seasonId)
  if (error) throw error
  return data
}

export async function getAllSeasonAwards() {
  const { data, error } = await supabase
    .from('season_awards')
    .select('*, members(name), seasons(label, start_year)')
  if (error) throw error
  return data
}

export async function upsertSeasonAwards(rows) {
  const { error } = await supabase
    .from('season_awards')
    .upsert(rows, { onConflict: 'season_id,award_type' })
  if (error) throw error
}
