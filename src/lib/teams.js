// ESPN's canonical NFL team abbreviations. These are what the scoreboard API
// returns, and what every lookup in this app matches against.
export const ESPN_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WSH'
]

// Common abbreviations from other sources, mapped to ESPN's form.
// Washington is the big one: nearly every other source says WAS, ESPN says WSH.
const ALIASES = {
  WAS: 'WSH',
  WFT: 'WSH',
  JAC: 'JAX',
  LA: 'LAR',
  STL: 'LAR',
  RAM: 'LAR',
  SD: 'LAC',
  SDG: 'LAC',
  OAK: 'LV',
  LVR: 'LV',
  RAI: 'LV',
  GNB: 'GB',
  KAN: 'KC',
  NWE: 'NE',
  NEP: 'NE',
  NOR: 'NO',
  NOS: 'NO',
  SFO: 'SF',
  TAM: 'TB',
  TBB: 'TB',
  ARZ: 'ARI',
  BLT: 'BAL',
  CLV: 'CLE',
  HST: 'HOU'
}

/**
 * Convert any common team abbreviation to ESPN's form.
 * Unknown values pass through uppercased so they stay visible rather than
 * silently disappearing.
 */
export function normalizeTeam(abbr) {
  if (!abbr) return abbr
  const up = String(abbr).trim().toUpperCase()
  return ALIASES[up] || up
}

export function isValidTeam(abbr) {
  return ESPN_TEAMS.includes(normalizeTeam(abbr))
}
