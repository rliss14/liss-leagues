import { fetchWeekScoreboard } from './espn'
import { getAssignments } from './supabaseQueries'
import { normalizeTeam } from './teams'
import { absDiffFromTarget, findClosestTeams } from './scoring'

/**
 * Work out the in-progress season's results straight from ESPN plus the
 * stored assignments, so Winners and the Record Book keep up on their own
 * instead of waiting for someone to type last week's results in.
 *
 * Payouts are derived from the pool rules rather than entered:
 *   - base pot each week is entry.perWeek x 32 members
 *   - a week with no hit carries its pot forward
 *   - a hit takes everything accumulated; several hits split it evenly
 *   - week 18, for pools that guarantee it, pays whoever finished closest
 *
 * Rows come back in the same shape as stored weekly_results rows, so the
 * pages can merge the two without caring which is which.
 */
export async function deriveCurrentSeason(pool, season, memberCount = 32) {
  if (!season) return []

  const [assignments, boards] = await Promise.all([
    getAssignments(season.id),
    Promise.all(
      Array.from({ length: 18 }, (_, i) => i + 1).map((w) =>
        fetchWeekScoreboard(w, season.start_year)
          .then((games) => ({ week: w, games }))
          .catch(() => ({ week: w, games: null }))
      )
    )
  ])

  if (!assignments.length) return []

  // week -> [{ member, team }]
  const byWeek = {}
  assignments.forEach((a) => {
    ;(byWeek[a.week] ||= []).push({
      member: a.members?.name || a.member_id,
      memberId: a.member_id,
      team: normalizeTeam(a.team_abbr)
    })
  })

  const basePot = (pool.entry?.perWeek || 5) * memberCount
  const rows = []
  let carryover = 0

  for (const { week, games } of boards) {
    if (!games || !games.length) continue

    // Only settle a week once every game in it is final; a live week has no
    // winner yet, and paying out early would be wrong.
    const allFinal = games.every((g) => g.status === 'post')
    if (!allFinal) continue

    // team -> { score, opponent }
    const results = {}
    games.forEach((g) => {
      const h = g.home, a = g.away
      if (!h || !a) return
      results[normalizeTeam(h.abbreviation)] = {
        score: h.score,
        opponent: normalizeTeam(a.abbreviation)
      }
      results[normalizeTeam(a.abbreviation)] = {
        score: a.score,
        opponent: normalizeTeam(h.abbreviation)
      }
    })

    const entries = (byWeek[week] || [])
      .map((x) => ({ ...x, ...results[x.team] }))
      .filter((x) => x.score != null) // on bye

    const pot = basePot + carryover
    const hitters = entries.filter((x) => x.score === pool.target)

    let winners = []
    let resultType = null

    if (hitters.length) {
      winners = hitters
      resultType = `hit${pool.target}`
      carryover = 0
    } else if (week === 18 && pool.week18Guarantee) {
      // Nobody hit the number, but week 18 still pays the closest.
      const closest = findClosestTeams(games, pool.target)
      winners = entries.filter((x) => closest.has(x.team))
      resultType = winners.length ? 'week18_payout' : null
      carryover = 0
    } else {
      carryover = pot
    }

    const share = winners.length ? Math.round(pot / winners.length) : 0
    const winnerKeys = new Set(winners.map((w) => w.member))

    entries.forEach((x) => {
      const won = winnerKeys.has(x.member)
      rows.push({
        id: `derived-${season.id}-${week}-${x.member}`,
        derived: true,
        season_id: season.id,
        seasons: { label: season.label, start_year: season.start_year },
        week,
        member_id: x.memberId,
        members: { name: x.member },
        team_abbr: x.team,
        opponent_abbr: x.opponent,
        score: x.score,
        win: won,
        amount_won: won ? share : null,
        result_type: won ? resultType : null,
        diff: absDiffFromTarget(x.score, pool.target)
      })
    })
  }

  return rows
}

/**
 * Stored rows win over derived ones for the same season+week+member, so
 * anything typed in by hand — a correction, an off-book payout — sticks.
 */
export function mergeResults(stored, derived) {
  const key = (r) => `${r.season_id}|${r.week}|${r.members?.name || r.member_id}`
  const seen = new Set(stored.map(key))
  return [...stored, ...derived.filter((r) => !seen.has(key(r)))]
}
