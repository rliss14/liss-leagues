// Core "33 Point Pool" status logic, shared by the Matchup Tracker and
// the Live Season Tracker so the rules only live in one place.

export const TARGET = 33

// Point values reachable from a single non-TD-return score: safety (2),
// FG (3), TD no PAT (6), TD+PAT (7), TD+2pt (8). We flag the whole 1-8
// range below target as "one possession away," per the brief, rather
// than only the exact reachable set — it reads clearer on the board.
const ONE_POSSESSION_MIN = 1
const ONE_POSSESSION_MAX = 8

/**
 * @param {number|null} score current/final score for the team
 * @param {'pre'|'in'|'post'} gameStatus
 * @returns {{ key: string, label: string }} status descriptor
 */
export function teamStatus(score, gameStatus) {
  if (score == null || gameStatus === 'pre') {
    return { key: 'scheduled', label: 'Scheduled' }
  }

  const diff = TARGET - score

  if (score === TARGET) {
    return gameStatus === 'post'
      ? { key: 'hit', label: 'HIT 33 💰' }
      : { key: 'gold', label: 'Currently 33' }
  }

  if (score > TARGET) {
    return { key: 'busted', label: 'Busted' }
  }

  if (diff >= ONE_POSSESSION_MIN && diff <= ONE_POSSESSION_MAX) {
    return { key: 'oneposs', label: `One Possession Away (${diff})` }
  }

  return { key: 'live', label: 'In Range' }
}

export function absDiffFromTarget(score) {
  if (score == null) return null
  return Math.abs(TARGET - score)
}
