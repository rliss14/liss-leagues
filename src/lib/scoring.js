// Core point-pool status logic, shared by every pool. The target score is
// passed in rather than hardcoded, so the same rules drive 33 and 25.

// Reachable from one possession: safety (2), FG (3), TD no PAT (6),
// TD+PAT (7), TD+2pt (8). The whole 1-8 band below target is flagged.
const ONE_POSSESSION_MIN = 1
const ONE_POSSESSION_MAX = 8

/**
 * @param {number|null} score
 * @param {'pre'|'in'|'post'} gameStatus
 * @param {number} target the pool's winning score
 * @param {boolean} isClosest week-18 tie-break winner (pools that guarantee one)
 */
export function teamStatus(score, gameStatus, target, isClosest = false) {
  if (score == null || gameStatus === 'pre') {
    return { key: 'scheduled', label: 'Scheduled' }
  }

  // ---- FINAL ----
  if (gameStatus === 'post') {
    if (score === target) return { key: 'hit', label: `HIT ${target} 💰` }
    if (isClosest) return { key: 'closest', label: 'CLOSEST' }
    if (score > target) return { key: 'busted', label: 'BUSTED' }
    return { key: 'low', label: 'LOW' }
  }

  // ---- LIVE ----
  const diff = target - score
  if (score === target) return { key: 'gold', label: `Currently ${target}` }
  if (score > target) return { key: 'busted', label: 'BUSTED' }
  if (diff >= ONE_POSSESSION_MIN && diff <= ONE_POSSESSION_MAX) {
    return { key: 'oneposs', label: `One Possession Away (${diff})` }
  }
  return { key: 'live', label: 'In Range' }
}

export function absDiffFromTarget(score, target) {
  if (score == null) return null
  return Math.abs(target - score)
}

/**
 * Week 18 only, and only for pools that guarantee a winner: the team(s)
 * closest to target across all finalized games. Empty if anyone hit it exactly.
 */
export function findClosestTeams(games, target) {
  const finals = []
  games.forEach((g) => {
    if (g.status !== 'post') return
    ;[g.home, g.away].forEach((t) => {
      if (t && t.score != null) finals.push({ abbr: t.abbreviation, score: t.score })
    })
  })
  if (!finals.length) return new Set()
  if (finals.some((t) => t.score === target)) return new Set()

  const best = Math.min(...finals.map((t) => absDiffFromTarget(t.score, target)))
  return new Set(
    finals.filter((t) => absDiffFromTarget(t.score, target) === best).map((t) => t.abbr)
  )
}
