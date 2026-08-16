import { supabase } from '../supabaseClient'

export async function getFFStandings(league) {
  const { data, error } = await supabase
    .from('ff_standings')
    .select('*')
    .eq('league', league)
    .order('season', { ascending: false })
    .order('reg_rank')
  if (error) throw error
  return data
}

export async function getFFPlayoffs(league) {
  const { data, error } = await supabase
    .from('ff_playoffs')
    .select('*')
    .eq('league', league)
    .order('season', { ascending: false })
  if (error) throw error
  return data
}

// Weekly scores (migration 05). Paged because 12 members x 17 weeks x
// several seasons will cross Supabase's 1000-row default before long.
export async function getFFWeekly(league) {
  const PAGE = 1000
  const out = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('ff_weekly')
      .select('*')
      .eq('league', league)
      .order('season')
      .order('week')
      .range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < PAGE) break
    from += PAGE
  }
  return out
}
