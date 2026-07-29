import { useEffect, useState } from 'react'
import { fetchWeekScoreboard } from '../lib/espn'
import { getCurrentSeason, getAssignments } from '../lib/supabaseQueries'
import { absDiffFromTarget } from '../lib/scoring'

// Builds a lookup of final scores per team abbreviation for one week's scoreboard.
function finalScoresByTeam(games) {
  const map = {}
  games.forEach((g) => {
    ;[g.home, g.away].forEach((t) => {
      if (t && g.status === 'post') map[t.abbreviation] = t.score
    })
  })
  return map
}

export default function LiveTracker() {
  const [season, setSeason] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [weeksCovered, setWeeksCovered] = useState(0)

  useEffect(() => {
    getCurrentSeason().then(setSeason).catch((e) => setErr(e.message))
  }, [])

  useEffect(() => {
    if (!season) return
    setLoading(true)
    setErr(null)

    const currentWeek = season.current_week || 1

    async function run() {
      const assignments = await getAssignments(season.id)
      const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1)

      const scoreboards = await Promise.all(
        weeks.map((w) => fetchWeekScoreboard(w, season.start_year).catch(() => []))
      )

      const totals = {} // member name -> { sum, weeks }
      let finalizedWeekCount = 0

      weeks.forEach((w, idx) => {
        const games = scoreboards[idx]
        const finals = finalScoresByTeam(games)
        const anyFinal = Object.keys(finals).length > 0
        if (anyFinal) finalizedWeekCount += 1

        assignments
          .filter((a) => a.week === w)
          .forEach((a) => {
            const score = finals[a.team_abbr]
            if (score == null) return // game not final yet — not counted
            const diff = absDiffFromTarget(score)
            const name = a.members?.name || a.member_id
            if (!totals[name]) totals[name] = { sum: 0, weeks: 0 }
            totals[name].sum += diff
            totals[name].weeks += 1
          })
      })

      const leaderboard = Object.entries(totals).map(([name, t]) => ({
        name,
        totalDiff: t.sum,
        weeksPlayed: t.weeks,
        avgDiff: t.weeks ? +(t.sum / t.weeks).toFixed(2) : null
      }))

      leaderboard.sort((a, b) => a.totalDiff - b.totalDiff)

      setRows(leaderboard)
      setWeeksCovered(finalizedWeekCount)
    }

    run().catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [season])

  if (!season) {
    return (
      <div className="felt-panel rounded-lg p-6 text-center">
        No current season marked. Add one in Setup first.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-mustard">Live Season Tracker</h1>
      <p className="text-chalk/70 text-sm">
        Running total of |33 − score| across finalized weeks so far this season. Lower is better.
      </p>
      {err && <div className="text-brick-light">{err}</div>}
      {loading && <div className="text-chalk/70">Crunching every finalized game…</div>}

      {!loading && rows.length > 0 && (
        <div className="felt-panel rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-mustard text-left">
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Total |Δ|</th>
                <th className="px-3 py-2">Weeks Played</th>
                <th className="px-3 py-2">Avg / Week</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.name}
                  className={`border-t border-mustard/10 ${
                    i === 0 ? 'text-mustard font-semibold' : i === rows.length - 1 ? 'text-brick-light' : ''
                  }`}
                >
                  <td className="px-3 py-2 font-mono">{i + 1}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 font-mono">{r.totalDiff}</td>
                  <td className="px-3 py-2 font-mono">{r.weeksPlayed}</td>
                  <td className="px-3 py-2 font-mono">{r.avgDiff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-xs text-chalk/50">{weeksCovered} week(s) finalized so far.</div>
    </div>
  )
}
