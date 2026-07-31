import { useEffect, useMemo, useState } from 'react'
import { fetchWeekScoreboard, seasonMismatch } from '../lib/espn'
import { getCurrentSeason, getAssignments } from '../lib/supabaseQueries'
import { findClosestTeams } from '../lib/scoring'
import { normalizeTeam } from '../lib/teams'
import TeamCard from '../components/TeamCard'

export default function MatchupTracker() {
  const [season, setSeason] = useState(null)
  const [week, setWeek] = useState(1)
  const [games, setGames] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    getCurrentSeason()
      .then((s) => {
        setSeason(s)
        if (s) setWeek(s.current_week || 1)
      })
      .catch((e) => setErr(e.message))
  }, [])

  useEffect(() => {
    if (!season) return
    setLoading(true)
    setErr(null)
    Promise.all([fetchWeekScoreboard(week, season.start_year), getAssignments(season.id)])
      .then(([g, a]) => {
        setGames(g)
        setAssignments(a.filter((row) => row.week === week))
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [season, week])

  const ownerFor = useMemo(() => {
    const map = {}
    assignments.forEach((a) => {
      map[normalizeTeam(a.team_abbr)] = a.members?.name
    })
    return map
  }, [assignments])

  const mismatch = useMemo(() => seasonMismatch(games), [games])

  // Week 18 only: whoever finished closest to 33 still gets paid.
  const closestTeams = useMemo(
    () => (week === 18 ? findClosestTeams(games) : new Set()),
    [games, week]
  )

  if (!season) {
    return (
      <div className="felt-panel rounded-lg p-6 text-center">
        No current season is marked yet. Head to Setup to add one.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl text-mustard">Week {week}</h1>
          <p className="text-sm text-chalk/60">{season.label} · 33 Point Pool</p>
        </div>
        <select
          className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
        >
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      {mismatch && (
        <div className="rounded-lg border border-brick/60 bg-brick/20 p-3 text-sm">
          <span className="font-semibold text-brick-light">Season mismatch: </span>
          asked ESPN for {mismatch.requested} but it returned {mismatch.returned}. Check that this
          season's start year is set correctly in Setup.
        </div>
      )}

      {week === 18 && closestTeams.size > 0 && (
        <div className="stat-card p-3 text-sm text-mustard">
          Nobody landed on 33 — closest team{closestTeams.size > 1 ? 's' : ''} flagged below for the
          guaranteed payout.
        </div>
      )}

      {err && <div className="text-brick-light">{err}</div>}
      {loading && <div className="text-chalk/60 text-sm">Loading live scores…</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        {games.map((g) => (
          <div key={g.id} className="felt-panel rounded-xl p-4 space-y-3">
            <div className="text-xs text-chalk/60 flex flex-wrap justify-between gap-2">
              <span>
                {new Date(g.date).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
              <span className="font-medium">{g.statusDetail}</span>
            </div>
            <div className="text-[11px] text-chalk/45 flex flex-wrap justify-between gap-2">
              <span>
                {g.venue ? `${g.venue}${g.city ? ` · ${g.city}${g.state ? ', ' + g.state : ''}` : ''}` : ''}
              </span>
              <span>{g.broadcast || ''}</span>
            </div>
            {g.weather && (
              <div className="text-[11px] text-chalk/45">
                {g.weather.text}
                {g.weather.tempF != null ? ` · ${g.weather.tempF}°F` : ''}
              </div>
            )}
            <div className="space-y-2">
              <TeamCard
                team={g.away}
                gameStatus={g.status}
                ownerName={ownerFor[g.away?.abbreviation]}
                isClosest={closestTeams.has(g.away?.abbreviation)}
              />
              <TeamCard
                team={g.home}
                gameStatus={g.status}
                ownerName={ownerFor[g.home?.abbreviation]}
                isClosest={closestTeams.has(g.home?.abbreviation)}
              />
            </div>
          </div>
        ))}
      </div>

      {!loading && games.length === 0 && !err && (
        <div className="felt-panel rounded-lg p-6 text-center text-chalk/60">
          No games found for Week {week}.
        </div>
      )}
    </div>
  )
}
