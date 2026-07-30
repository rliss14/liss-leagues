import { supabase } from '../supabaseClient'

// Supabase/PostgREST caps every response at 1000 rows by default. A single
// season is 18 weeks x 32 members = 576 rows, so any multi-season query blows
// straight past that. Everything unbounded goes through fetchAllPaged.
const PAGE_SIZE = 1000

async function fetchAllPaged(buildQuery) {
  const out = []
  let from = 0
  for (;;) {
    // A PostgREST builder can only be used once, so rebuild it each pass.
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return out
}

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
  return fetchAllPaged(() =>
    supabase
      .from('weekly_assignments')
      .select('*, members(name)')
      .eq('season_id', seasonId)
      .order('week')
  )
}

export async function upsertAssignments(rows) {
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('weekly_assignments')
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'season_id,week,member_id' })
    if (error) throw error
  }
}

// ---- Weekly results ----
export async function getResults(seasonId) {
  return fetchAllPaged(() =>
    supabase
      .from('weekly_results')
      .select('*, members(name)')
      .eq('season_id', seasonId)
      .order('week')
  )
}

export async function getAllResults() {
  return fetchAllPaged(() =>
    supabase
      .from('weekly_results')
      .select('*, members(name), seasons(label, start_year)')
      .order('id')
  )
}

export async function upsertResults(rows) {
  // Chunk writes too — a full season pasted at once exceeds a comfortable
  // single-request payload.
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('weekly_results')
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'season_id,week,member_id' })
    if (error) throw error
  }
}
