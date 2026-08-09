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

// ---- Members (scoped per pool) ----
export async function getMembers(pool) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('pool', pool)
    .order('name')
  if (error) throw error
  return data
}

// ---- Seasons (scoped per pool) ----
export async function getSeasons(pool) {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('pool', pool)
    .order('start_year', { ascending: false })
  if (error) throw error
  return data
}

export async function getCurrentSeason(pool) {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('pool', pool)
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

export async function getAllResults(pool) {
  const rows = await fetchAllPaged(() =>
    supabase
      .from('weekly_results')
      .select('*, members(name), seasons(label, start_year, pool)')
      .order('id')
  )
  // Filter client-side: PostgREST can't filter on an embedded table without
  // an inner join, and the row counts here are small enough that it's moot.
  return pool ? rows.filter((r) => r.seasons?.pool === pool) : rows
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

// ---- Super Bowl squares (structure only; payout rules TBD) ----
export async function getSquares(seasonId) {
  const [gridRes, cfgRes] = await Promise.all([
    supabase.from('squares').select('*').eq('season_id', seasonId).order('position'),
    supabase.from('squares_config').select('*').eq('season_id', seasonId).maybeSingle()
  ])
  if (gridRes.error) throw gridRes.error
  if (cfgRes.error) throw cfgRes.error
  return { squares: gridRes.data || [], config: cfgRes.data || null }
}

export async function upsertSquares(rows) {
  const { error } = await supabase
    .from('squares')
    .upsert(rows, { onConflict: 'season_id,position' })
  if (error) throw error
}

export async function upsertSquaresConfig(row) {
  const { error } = await supabase
    .from('squares_config')
    .upsert(row, { onConflict: 'season_id' })
  if (error) throw error
}
