// Season Awards are fully derived — nothing is hand-entered or stored.
// Payouts are fixed by house rule.
export const AWARD_PAYOUT = { best: 160, worst: 140 }

// Each member's team has one bye, so 17 games across the 18-week season.
export const GAMES_PER_SEASON = 17

/**
 * Compute the consistency awards for every season that has results.
 *
 * @param {Array} results  rows from getAllResults()
 * @param {Array} seasons  rows from getSeasons()
 * @returns {Array} one entry per season, newest first
 */
export function computeSeasonAwards(results, seasons) {
  const bySeason = {}

  results.forEach((r) => {
    if (r.score == null) return
    const name = r.members?.name
    if (!name) return
    if (!bySeason[r.season_id]) bySeason[r.season_id] = {}
    const bucket = bySeason[r.season_id]
    if (!bucket[name]) bucket[name] = { memberId: r.member_id, sum: 0, weeks: 0 }
    bucket[name].sum += Math.abs(33 - r.score)
    bucket[name].weeks += 1
  })

  return seasons
    .filter((s) => bySeason[s.id])
    .map((s) => {
      const standings = Object.entries(bySeason[s.id])
        .map(([name, v]) => ({
          name,
          memberId: v.memberId,
          total: v.sum,
          weeks: v.weeks,
          avg: +(v.sum / GAMES_PER_SEASON).toFixed(2)
        }))
        .sort((a, b) => a.total - b.total)

      return {
        seasonId: s.id,
        label: s.label,
        startYear: s.start_year,
        inProgress: !!s.is_current,
        best: standings[0],
        worst: standings[standings.length - 1],
        standings
      }
    })
    .sort((a, b) => b.startYear - a.startYear)
}

/**
 * Award money per member name. In-progress seasons are excluded — those
 * standings can still change, so counting them would inflate career totals.
 */
export function awardMoneyByMember(seasonAwards) {
  const totals = {}
  seasonAwards
    .filter((s) => !s.inProgress)
    .forEach((s) => {
      if (s.best) totals[s.best.name] = (totals[s.best.name] || 0) + AWARD_PAYOUT.best
      if (s.worst) totals[s.worst.name] = (totals[s.worst.name] || 0) + AWARD_PAYOUT.worst
    })
  return totals
}
