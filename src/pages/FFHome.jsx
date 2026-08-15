import { useEffect, useMemo, useState } from 'react'
import { getFFStandings, getFFPlayoffs } from '../lib/ffQueries'
import { champions, seasonLabel, isTwoWeek } from '../lib/ffStats'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function FFHome() {
  const [standings, setStandings] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getFFStandings().then(setStandings).catch((e) => setErr(e.message))
    getFFPlayoffs().then(setPlayoffs).catch((e) => setErr(e.message))
  }, [])

  const champs = useMemo(() => champions(playoffs), [playoffs])
  const seasons = useMemo(
    () => [...new Set(standings.map((s) => s.season))].sort((a, b) => b - a),
    [standings]
  )
  const [season, setSeason] = useState(null)
  const activeSeason = season ?? seasons[0]

  const table = useMemo(
    () =>
      standings
        .filter((s) => s.season === activeSeason)
        .sort((a, b) => (a.reg_rank || 99) - (b.reg_rank || 99)),
    [standings, activeSeason]
  )

  const titleCounts = useMemo(() => {
    const c = {}
    champs.forEach((x) => (c[x.champion] = (c[x.champion] || 0) + 1))
    return Object.entries(c).sort((a, b) => b[1] - a[1])
  }, [champs])

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="display text-3xl text-mustard">Edward A. Liss Fantasy Football League</h1>
        <p className="text-sm text-chalk/60">
          EALFFL · 12 members · Est. 2022 · Playing for the Edward A. Liss Memorial Trophy
        </p>
      </header>

      {err && <div className="text-brick-light">{err}</div>}

      {/* Champions */}
      <section className="space-y-3">
        <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">
          Trophy Winners
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {champs.map((c) => (
            <div key={c.season} className="felt-panel rounded-xl p-4 flex items-center gap-4">
              <div className="text-4xl shrink-0">🏆</div>
              <div className="min-w-0">
                <div className="font-mono text-xs text-mustard/70">{seasonLabel(c.season)}</div>
                <div className="display text-xl text-chalk">{c.champion}</div>
                <div className="text-xs text-chalk/55">
                  def. {c.runnerUp} · {c.championScore.toFixed(2)}–{c.runnerUpScore.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {champs.length === 0 && (
          <div className="felt-panel rounded-xl p-6 text-center text-chalk/50">
            No championship results loaded yet.
          </div>
        )}
      </section>

      {/* Title count */}
      {titleCounts.length > 0 && (
        <section className="space-y-2">
          <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">
            Trophy Case
          </h2>
          <div className="flex flex-wrap gap-2">
            {titleCounts.map(([name, n]) => (
              <span
                key={name}
                className="stat-card px-3 py-1.5 text-sm flex items-center gap-2"
              >
                <span className="text-chalk/85">{name}</span>
                <span className="font-mono text-mustard font-bold">
                  {'🏆'.repeat(n)}
                </span>
              </span>
            ))}
          </div>
          <p className="text-xs text-chalk/45">
            {champs.length} seasons, {titleCounts.length} different champions — nobody has repeated.
          </p>
        </section>
      )}

      {/* Season standings */}
      <section className="space-y-3">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="display text-xl text-mustard">Season Standings</h2>
            <p className="text-xs text-chalk/55">
              Ordered by regular season record. Medals show where they finished after playoffs.
            </p>
          </div>
          <select
            className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
            value={activeSeason || ''}
            onChange={(e) => setSeason(Number(e.target.value))}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>{seasonLabel(s)}</option>
            ))}
          </select>
        </div>

        <div className="felt-panel rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-mustard text-left text-[10px] uppercase tracking-wider">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Record</th>
                <th className="px-3 py-2">PF</th>
                <th className="px-3 py-2">PA</th>
                <th className="px-3 py-2">PF/G</th>
                <th className="px-3 py-2">Finish</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.id || r.member} className="border-t border-mustard/10 hover:bg-felt-light/20">
                  <td className="px-3 py-2 font-mono text-chalk/60">{r.reg_rank}</td>
                  <td className="px-3 py-2 font-medium">
                    {r.member}{' '}
                    {MEDALS[r.final_rank] && <span title={`Finished ${r.final_rank}`}>{MEDALS[r.final_rank]}</span>}
                  </td>
                  <td className="px-3 py-2 text-chalk/60 text-xs">{r.team}</td>
                  <td className="px-3 py-2 font-mono">{r.record}</td>
                  <td className="px-3 py-2 font-mono">{Number(r.pf).toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono text-chalk/60">{Number(r.pa).toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono text-chalk/60">{Number(r.pf_g).toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-chalk/60">{r.final_rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {table.length === 0 && (
            <div className="p-6 text-center text-chalk/50">No standings loaded yet.</div>
          )}
        </div>
        {isTwoWeek(activeSeason) && (
          <p className="text-xs text-chalk/45">
            * 2022 playoff rounds ran two weeks each, so playoff scores that season aren't
            comparable to later ones.
          </p>
        )}
      </section>
    </div>
  )
}
