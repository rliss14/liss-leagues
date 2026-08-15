import { useEffect, useMemo, useState } from 'react'
import { getFFStandings, getFFPlayoffs } from '../lib/ffQueries'
import { memberSummaries, seasonLabel } from '../lib/ffStats'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-chalk/45">{label}</div>
      <div className="font-mono text-lg text-chalk/90">{value}</div>
      {sub && <div className="text-[10px] text-chalk/40">{sub}</div>}
    </div>
  )
}

export default function FFMembers() {
  const [standings, setStandings] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [err, setErr] = useState(null)
  const [sort, setSort] = useState('winPct')

  useEffect(() => {
    getFFStandings().then(setStandings).catch((e) => setErr(e.message))
    getFFPlayoffs().then(setPlayoffs).catch((e) => setErr(e.message))
  }, [])

  const summaries = useMemo(
    () => (standings.length ? memberSummaries(standings, playoffs) : []),
    [standings, playoffs]
  )

  const sorted = useMemo(() => {
    const list = [...summaries]
    if (sort === 'name') return list.sort((a, b) => a.member.localeCompare(b.member))
    if (sort === 'pf') return list.sort((a, b) => b.pf - a.pf)
    if (sort === 'titles')
      return list.sort((a, b) => b.titles - a.titles || b.winPct - a.winPct)
    return list.sort((a, b) => b.winPct - a.winPct || b.pf - a.pf)
  }, [summaries, sort])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl text-mustard">Members</h1>
          <p className="text-sm text-chalk/60">Career résumés, all seasons combined.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            ['winPct', 'Win %'],
            ['pf', 'Points'],
            ['titles', 'Trophies'],
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
                {m.titles > 0 && <span className="ml-2">{'🏆'.repeat(m.titles)}</span>}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-chalk/40">
                {m.seasons} season{m.seasons === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
                sub={m.bestFinishSeason ? seasonLabel(m.bestFinishSeason) : null}
              />
              <Stat
                label="Total points"
                value={Math.round(m.pf).toLocaleString()}
                sub={`${m.pfPerSeason.toFixed(0)} / season`}
              />
              <Stat label="Playoff trips" value={m.appearances} sub={`of ${m.seasons}`} />
              <Stat
                label="Best game"
                value={m.bestGame ? m.bestGame.score.toFixed(2) : '—'}
                sub={m.bestGame ? seasonLabel(m.bestGame.season) + ' playoffs' : 'No playoff games'}
              />
            </div>

            {m.runnerUps > 0 && (
              <div className="text-[11px] text-chalk/45 pt-1 border-t border-mustard/10">
                Lost in the final {m.runnerUps} time{m.runnerUps === 1 ? '' : 's'}.
              </div>
            )}
          </div>
        ))}
      </div>

      {sorted.length === 0 && !err && (
        <div className="felt-panel rounded-xl p-6 text-center text-chalk/50">
          No member data loaded yet.
        </div>
      )}

      <p className="text-xs text-chalk/45">
        "Best game" is the highest single-week playoff score on record. ESPN's export doesn't
        include regular-season weekly scores, so regular-season highs aren't available yet. 2022
        playoff rounds ran two weeks and are excluded from this figure.
      </p>
    </div>
  )
}
