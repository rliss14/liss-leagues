import { useEffect, useMemo, useState } from 'react'
import { getSeasons, getAssignments, getResults } from '../lib/supabaseQueries'
import { fetchWeekScoreboard } from '../lib/espn'
import { normalizeTeam } from '../lib/teams'

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1)

export default function TeamGrid() {
  const [seasons, setSeasons] = useState([])
  const [seasonId, setSeasonId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [scores, setScores] = useState({}) // "week|TEAM" -> final score
  const [schedule, setSchedule] = useState({}) // week -> Set of team abbrs with a game
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

      const scoreMap = {}
      // Saved results are authoritative for any week already entered.
      results.forEach((r) => {
        if (r.score != null) scoreMap[`${r.week}|${normalizeTeam(r.team_abbr)}`] = r.score
      })

      // Pull the full schedule for every week of this season. A team missing
      // from a week's games was on bye — that's how byes are detected, so this
      // runs for past seasons too, not just the one in progress.
      const boards = await Promise.all(
        WEEKS.map((w) =>
          fetchWeekScoreboard(w, season.start_year)
            .then((games) => ({ w, games }))
            .catch(() => ({ w, games: null })) // null = week failed to load
        )
      )

      const scheduleMap = {}
      boards.forEach(({ w, games }) => {
        if (!games || games.length === 0) return // unknown, don't guess byes
        const playing = new Set()
        games.forEach((g) => {
          ;[g.home, g.away].forEach((t) => {
            if (!t) return
            playing.add(t.abbreviation)
            if (g.status === 'post' && t.score != null) {
              const k = `${w}|${t.abbreviation}`
              if (scoreMap[k] == null) scoreMap[k] = t.score
            }
          })
        })
        scheduleMap[w] = playing
      })

      setScores(scoreMap)
      setSchedule(scheduleMap)
    }

    load().catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [seasonId, seasons])

  const { members, cell } = useMemo(() => {
    const byMember = {}
    assignments.forEach((a) => {
      const name = a.members?.name || a.member_id
      if (!byMember[name]) byMember[name] = {}
      byMember[name][a.week] = normalizeTeam(a.team_abbr)
    })
    return { members: Object.keys(byMember).sort(), cell: byMember }
  }, [assignments])

  // A team is on bye if that week's schedule loaded and doesn't include it.
  function isBye(team, week) {
    const playing = schedule[week]
    if (!playing || !team) return false
    return !playing.has(team)
  }

  // Each team gets exactly one bye per season. Anything flagged more than
  // once is almost certainly a team abbreviation that doesn't match ESPN.
  const suspectAbbrs = useMemo(() => {
    if (!Object.keys(schedule).length) return []
    const counts = {}
    members.forEach((name) => {
      WEEKS.forEach((w) => {
        const team = cell[name][w]
        if (team && isBye(team, w)) counts[team] = (counts[team] || 0) + 1
      })
    })
    return Object.entries(counts)
      .filter(([, n]) => n > 1)
      .map(([team, n]) => ({ team, n }))
  }, [members, cell, schedule])

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
      {loading && <div className="text-chalk/60 text-sm">Loading grid and schedule…</div>}

      {suspectAbbrs.length > 0 && (
        <div className="rounded-lg border border-brick/60 bg-brick/20 p-3 text-sm">
          <span className="font-semibold text-brick-light">Check these abbreviations: </span>
          {suspectAbbrs.map((s) => `${s.team} (${s.n} byes)`).join(', ')}. Every team gets exactly one
          bye, so more than one means the abbreviation doesn't match ESPN's.
        </div>
      )}

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
                  const bye = isBye(team, w)
                  const score = team != null && !bye ? scores[`${w}|${team}`] : null
                  const isHit = score === 33

                  let cls = 'text-chalk/75' // scheduled, not yet played
                  if (bye) cls = 'text-brick-light font-semibold'
                  else if (isHit) cls = 'bg-green-600 text-white font-bold rounded'
                  else if (score != null) cls = 'text-chalk/45'

                  return (
                    <td
                      key={w}
                      title={
                        bye
                          ? `${team} — bye week`
                          : team && score != null
                          ? `${team} scored ${score}`
                          : team || ''
                      }
                      className={`px-2 py-1.5 text-center font-mono ${cls}`}
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

      <div className="flex flex-wrap gap-4 text-[11px] text-chalk/50">
        <span>
          <span className="inline-block w-3 h-3 bg-green-600 rounded-sm align-middle mr-1" /> Hit 33
        </span>
        <span className="text-brick-light">Red = bye week</span>
        <span className="text-chalk/45">Dimmed = game final, no hit</span>
        <span className="text-chalk/75">Bright = not yet played</span>
      </div>
    </div>
  )
}
