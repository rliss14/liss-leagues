import { useEffect, useMemo, useState } from 'react'
import { getFFStandings, getFFPlayoffs, getFFWeekly } from '../lib/ffQueries'
import {
  memberSummaries,
  seasonLabel,
  bestWeekByMember,
  MEDALS,
  MEDAL_TITLES,
  POINTS_CROWN,
  POINTS_CROWN_TITLE
} from '../lib/ffStats'
import { usePool } from '../components/PoolLayout'


function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-chalk/45">{label}</div>
      <div className="font-mono text-base sm:text-lg text-chalk/90">{value}</div>
      {sub && <div className="text-[10px] text-chalk/40">{sub}</div>}
    </div>
  )
}

export default function FFMembers() {
  const league = usePool()
  const [standings, setStandings] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [weekly, setWeekly] = useState([])
  const [err, setErr] = useState(null)
  const [sort, setSort] = useState('winPct')

  useEffect(() => {
    getFFStandings(league.id).then(setStandings).catch((e) => setErr(e.message))
    getFFPlayoffs(league.id).then(setPlayoffs).catch((e) => setErr(e.message))
    // Weekly scores are optional — the page still works without them.
    getFFWeekly(league.id).then(setWeekly).catch(() => setWeekly([]))
  }, [league.id])

  const summaries = useMemo(
    () => (standings.length ? memberSummaries(standings, playoffs, league) : []),
    [standings, playoffs]
  )
  const bestWeeks = useMemo(() => bestWeekByMember(weekly), [weekly])

  const sorted = useMemo(() => {
    const list = [...summaries]
    if (sort === 'name') return list.sort((a, b) => a.member.localeCompare(b.member))
    if (sort === 'pf') return list.sort((a, b) => b.pf - a.pf)
    if (sort === 'points')
      return list.sort((a, b) => b.pointsTitles - a.pointsTitles || b.pf - a.pf)
    if (sort === 'titles')
      return list.sort(
        (a, b) =>
          b.titles - a.titles ||
          b.runnerUps - a.runnerUps ||
          b.thirds - a.thirds ||
          b.winPct - a.winPct
      )
    return list.sort((a, b) => b.winPct - a.winPct || b.pf - a.pf)
  }, [summaries, sort])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl sm:text-3xl text-mustard">Members</h1>
          <p className="text-sm text-chalk/60">Career résumés, all seasons combined.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            ['winPct', 'Win %'],
            ['pf', 'Points'],
            ['titles', 'Podium'],
            ['points', 'Scoring'],
            ['name', 'A–Z']
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                sort === k
                  ? 'bg-mustard text-felt-dark border-mustard font-semibold'
                  : 'border-mustard/30 text-chalk/70 hover:border-mustard/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((m) => (
          <div key={m.member} className="felt-panel rounded-xl p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="display text-xl text-chalk">
                {m.member}
                {(m.titles > 0 || m.runnerUps > 0 || m.thirds > 0 || m.pointsTitles > 0) && (
                  <span className="ml-2 whitespace-nowrap">
                    {m.titles > 0 && (
                      <span title={`${MEDAL_TITLES[1]} x${m.titles}`}>
                        {MEDALS[1].repeat(m.titles)}
                      </span>
                    )}
                    {m.runnerUps > 0 && (
                      <span title={`${MEDAL_TITLES[2]} x${m.runnerUps}`}>
                        {MEDALS[2].repeat(m.runnerUps)}
                      </span>
                    )}
                    {m.thirds > 0 && (
                      <span title={`${MEDAL_TITLES[3]} x${m.thirds}`}>
                        {MEDALS[3].repeat(m.thirds)}
                      </span>
                    )}
                    {m.pointsTitles > 0 && (
                      <span title={`${POINTS_CROWN_TITLE} x${m.pointsTitles}`}>
                        {POINTS_CROWN.repeat(m.pointsTitles)}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-chalk/40">
                {m.seasons} season{m.seasons === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Regular season" value={m.record} sub={`${(m.winPct * 100).toFixed(1)}%`} />
              <Stat
                label="Playoffs"
                value={m.playoffW + m.playoffL > 0 ? `${m.playoffW}-${m.playoffL}` : '—'}
                sub={m.playoffPct != null ? `${(m.playoffPct * 100).toFixed(0)}%` : 'No appearances'}
              />
              <Stat
                label="Best finish"
                value={
                  <>
                    {m.bestFinish}
                    {MEDALS[m.bestFinish] && <span className="ml-1">{MEDALS[m.bestFinish]}</span>}
                  </>
                }
                sub={m.bestFinishSeason ? seasonLabel(m.bestFinishSeason, league) : null}
              />
              <Stat
                label="Total points"
                value={Math.round(m.pf).toLocaleString()}
                sub={`${m.pfPerSeason.toFixed(0)} / season`}
              />
              <Stat
                label="Scoring titles"
                value={m.pointsTitles || '—'}
                sub={m.appearances + ' playoff trip' + (m.appearances === 1 ? '' : 's')}
              />
              <Stat
                label="Best week"
                value={
                  bestWeeks[m.member]
                    ? Number(bestWeeks[m.member].points).toFixed(2)
                    : m.bestGame
                    ? m.bestGame.score.toFixed(2)
                    : '—'
                }
                sub={
                  bestWeeks[m.member]
                    ? `${seasonLabel(bestWeeks[m.member].season, league)} wk ${bestWeeks[m.member].week}`
                    : m.bestGame
                    ? seasonLabel(m.bestGame.season, league) + ' playoffs'
                    : '—'
                }
              />
            </div>

          </div>
        ))}
      </div>

      {sorted.length === 0 && !err && (
        <div className="felt-panel rounded-xl p-6 text-center text-chalk/50">
          No member data loaded yet.
        </div>
      )}

      <p className="text-xs text-chalk/45">
        {MEDALS[1]} champion · {MEDALS[2]} runner-up · {MEDALS[3]} third place ·{' '}
        {POINTS_CROWN} scoring title.{' '}
        "Best week" is the highest single regular-season week on record. 2022's playoff rounds ran
        two weeks each, so postseason scores are excluded from it.
      </p>
    </div>
  )
}
