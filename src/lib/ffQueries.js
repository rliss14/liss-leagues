import { supabase } from '../supabaseClient'

export async function getFFStandings() {
  const { data, error } = await supabase
    .from('ff_standings')
    .select('*')
    .order('season', { ascending: false })
    .order('reg_rank')
  if (error) throw error
  return data
}

export async function getFFPlayoffs() {
  const { data, error } = await supabase
    .from('ff_playoffs')
    .select('*')
    .order('season', { ascending: false })
  if (error) throw error
  return data
}
