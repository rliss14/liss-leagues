// Core "33 Point Pool" status logic, shared by the Matchup Tracker,
// Live Season Tracker and Team Grid so the rules live in one place.

export const TARGET = 33

// Reachable from one possession: safety (2), FG (3), TD no PAT (6),
// TD+PAT (7), TD+2pt (8). We flag the whole 1-8 band below target.
const ONE_POSSESSION_MIN = 1
const ONE_POSSESSION_MAX = 8

/**
 * @param {number|null} score
 * @param {'pre'|'in'|'post'} gameStatus
 * @param {boolean} isClosest  week-18 tie-break winner (only used when final)
 * @returns {{ key: string, label: string }}
 */
export function teamStatus(score, gameStatus, isClosest = false) {
  if (score == null || gameStatus === 'pre') {
    return { key: 'scheduled', label: 'Scheduled' }
  }

  // ---- FINAL ----
  if (gameStatus === 'post') {
    if (score === TARGET) return { key: 'hit', label: 'HIT 33 💰' }
    if (isClosest) return { key: 'closest', label: 'CLOSEST' }
    if (score > TARGET) return { key: 'busted', label: 'BUSTED' }
    return { key: 'low', label: 'LOW' }
  }

  // ---- LIVE ----
  const diff = TARGET - score
  if (score === TARGET) return { key: 'gold', label: 'Currently 33' }
  if (score > TARGET) return { key: 'busted', label: 'BUSTED' }
  if (diff >= ONE_POSSESSION_MIN && diff <= ONE_POSSESSION_MAX) {
    return { key: 'oneposs', label: `One Possession Away (${diff})` }
  }
  return { key: 'live', label: 'In Range' }
}

export function absDiffFromTarget(score) {
  if (score == null) return null
  return Math.abs(TARGET - score)
}

/**
 * Week 18 only: find the team abbreviation(s) closest to 33 across all
 * finalized games. Returns an empty Set if anyone actually hit 33, since
 * the guaranteed payout only applies when nobody lands on the number.
 */
export function findClosestTeams(games) {
  const finals = []
  games.forEach((g) => {
    if (g.status !== 'post') return
    ;[g.home, g.away].forEach((t) => {
      if (t && t.score != null) finals.push({ abbr: t.abbreviation, score: t.score })
    })
  })
  if (!finals.length) return new Set()
  if (finals.some((t) => t.score === TARGET)) return new Set()

  const best = Math.min(...finals.map((t) => absDiffFromTarget(t.score)))
  return new Set(finals.filter((t) => absDiffFromTarget(t.score) === best).map((t) => t.abbr))
}
