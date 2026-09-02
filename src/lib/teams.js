// ESPN's canonical NFL team abbreviations. These are what the scoreboard API
// returns, and what every lookup in this app matches against.
export const ESPN_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WSH'
]

// Franchises that have relocated. Both the old and new codes normalize to a
// single canonical code, so a team assigned as LV still matches the OAK that
// ESPN returns for 2019 — the franchise is the same, only the city moved.
//
// Raiders  OAK -> LV   (moved 2020)
// Chargers SD  -> LAC  (moved 2017)
// Rams     STL -> LAR  (moved 2016)
export const RELOCATIONS = {
  LV: { formerly: 'OAK', movedBeforeSeason: 2020 },
  LAC: { formerly: 'SD', movedBeforeSeason: 2017 },
  LAR: { formerly: 'STL', movedBeforeSeason: 2016 }
}

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

/**
 * What ESPN actually calls this franchise in a given season.
 * Useful for display — a 2019 grid should read OAK, not LV.
 */
export function teamForSeason(abbr, season) {
  const code = normalizeTeam(abbr)
  const reloc = RELOCATIONS[code]
  if (reloc && season && Number(season) < reloc.movedBeforeSeason) return reloc.formerly
  return code
}
