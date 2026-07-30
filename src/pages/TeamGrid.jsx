import { useEffect, useMemo, useState } from 'react'
import { getSeasons, getAssignments, getResults } from '../lib/supabaseQueries'
import { fetchWeekScoreboard } from '../lib/espn'

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1)

export default function TeamGrid() {
  const [seasons, setSeasons] = useState([])
  const [seasonId, setSeasonId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [scores, setScores] = useState({}) // "week|TEAM" -> final score
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    getSeasons()
      .then((s) => {
        setSeasons(s)
        const current = s.find((x) => x.is_current) || s[0]
        if (current) setSeasonId(current.id)
      })
      .catch((e) => setErr(e.message))
  }, [])

  useEffect(() => {
    if (!seasonId) return
    const season = seasons.find((s) => s.id === seasonId)
    if (!season) return

    setLoading(true)
    setErr(null)

    async function load() {
      const [assigns, results] = await Promise.all([
        getAssignments(seasonId),
        getResults(seasonId)
      ])
      setAssignments(assigns)

      const map = {}
      // Saved results are the source of truth for past weeks.
      results.forEach((r) => {
        if (r.score != null) map[`${r.week}|${r.team_abbr}`] = r.score
      })

      // For the season in progress, fill any gaps straight from ESPN.
      if (season.is_current) {
        const upTo = season.current_week || 1
        const boards = await Promise.all(
          WEEKS.filter((w) => w <= upTo).map((w) =>
            fetchWeekScoreboard(w, season.start_year)
              .then((games) => ({ w, games }))
              .catch(() => ({ w, games: [] }))
          )
        )
        boards.forEach(({ w, games }) => {
          games.forEach((g) => {
            if (g.status !== 'post') return
            ;[g.home, g.away].forEach((t) => {
              if (t && t.score != null) {
                const k = `${w}|${t.abbreviation}`
                if (map[k] == null) map[k] = t.score
              }
            })
          })
        })
      }
      setScores(map)
    }

    load().catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [seasonId, seasons])

  const { members, cell } = useMemo(() => {
    const byMember = {}
    assignments.forEach((a) => {
      const name = a.members?.name || a.member_id
      if (!byMember[name]) byMember[name] = {}
      byMember[name][a.week] = a.team_abbr
    })
    return {
      members: Object.keys(byMember).sort(),
      cell: byMember
    }
  }, [assignments])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl text-mustard">Team Grid</h1>
          <p className="text-sm text-chalk/60">
            Every member's team, week by week. Green means that team hit 33.
          </p>
        </div>
        <select
          className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {err && <div className="text-brick-light">{err}</div>}
      {loading && <div className="text-chalk/60 text-sm">Loading grid…</div>}

      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-felt-dark px-3 py-2 text-left text-mustard uppercase tracking-wider text-[10px]">
                Member
              </th>
              {WEEKS.map((w) => (
                <th key={w} className="px-2 py-2 text-mustard font-mono font-semibold min-w-[3rem]">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((name) => (
              <tr key={name} className="border-t border-mustard/10">
                <td className="sticky left-0 z-10 bg-felt-dark px-3 py-1.5 whitespace-nowrap font-medium">
                  {name}
                </td>
                {WEEKS.map((w) => {
                  const team = cell[name][w]
                  const score = team != null ? scores[`${w}|${team}`] : null
                  const isHit = score === 33
                  return (
                    <td
                      key={w}
                      title={team && score != null ? `${team} scored ${score}` : team || ''}
                      className={`px-2 py-1.5 text-center font-mono ${
                        isHit
                          ? 'bg-green-600 text-white font-bold rounded'
                          : score != null
                          ? 'text-chalk/45'
                          : 'text-chalk/75'
                      }`}
                    >
                      {team || '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && members.length === 0 && (
          <div className="p-6 text-center text-chalk/50">
            No assignments loaded for this season yet.
          </div>
        )}
      </div>

      <div className="flex gap-4 text-[11px] text-chalk/50">
        <span><span className="inline-block w-3 h-3 bg-green-600 rounded-sm align-middle mr-1" /> Hit 33</span>
        <span className="text-chalk/45">Dimmed = game final, no hit</span>
        <span className="text-chalk/75">Bright = not yet played</span>
      </div>
    </div>
  )
}
