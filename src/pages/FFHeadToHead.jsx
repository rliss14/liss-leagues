import { useEffect, useMemo, useState } from 'react'
import { getFFWeekly } from '../lib/ffQueries'
import { headToHead, opponentBreakdown, rivalryRecords } from '../lib/ffStats'
import { usePool } from '../components/PoolLayout'

function RecordCell({ r }) {
  const label = `${r.w}-${r.l}${r.t ? `-${r.t}` : ''}`
  const tone =
    r.w > r.l ? 'text-green-400' : r.w < r.l ? 'text-brick-light' : 'text-chalk/70'
  return <span className={`font-mono font-semibold ${tone}`}>{label}</span>
}

function Rivalry({ title, pair, detail, note }) {
  if (!pair) return null
  return (
    <div className="stat-card p-4 space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-mustard/80">{title}</div>
      <div className="text-sm text-chalk/90">
        {pair.a} <span className="text-chalk/40">vs</span> {pair.b}
      </div>
      <div className="font-mono text-lg text-mustard font-bold">{detail}</div>
      {note && <div className="text-[11px] text-chalk/45">{note}</div>}
    </div>
  )
}

export default function FFHeadToHead() {
  const league = usePool()
  const [weekly, setWeekly] = useState([])
  const [member, setMember] = useState('')
  const [scope, setScope] = useState('regular')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    setLoading(true)
    getFFWeekly(league.id)
      .then(setWeekly)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [league.id])

  const h2h = useMemo(() => headToHead(weekly, scope), [weekly, scope])

  useEffect(() => {
    if (h2h.members.length && !h2h.members.includes(member)) setMember(h2h.members[0])
  }, [h2h.members, member])

  const rows = useMemo(
    () => (member ? opponentBreakdown(h2h, member) : []),
    [h2h, member]
  )
  const rivalries = useMemo(() => rivalryRecords(h2h), [h2h])

  const totals = useMemo(() => {
    if (!rows.length) return null
    const w = rows.reduce((a, r) => a + r.w, 0)
    const l = rows.reduce((a, r) => a + r.l, 0)
    const t = rows.reduce((a, r) => a + r.t, 0)
    return { w, l, t, pct: w + l + t ? ((w + 0.5 * t) / (w + l + t)) : 0 }
  }, [rows])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl sm:text-3xl text-mustard">Head to Head</h1>
          <p className="text-sm text-chalk/60">Every matchup, all seasons.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            ['regular', 'Regular season'],
            ['all', 'Include playoffs']
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setScope(k)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                scope === k
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
      {loading && <div className="text-chalk/60 text-sm">Loading matchups…</div>}

      {!loading && !weekly.length && (
        <div className="felt-panel rounded-xl p-6 text-center text-chalk/50">
          No weekly scores loaded for this league yet.
        </div>
      )}

      {/* Rivalries */}
      {rivalries && (
        <section className="space-y-2">
          <h2 className="display text-lg text-chalk/80">Rivalries</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Rivalry
              title="Most played"
              pair={rivalries.mostPlayed}
              detail={`${rivalries.mostPlayed.aWins}–${rivalries.mostPlayed.bWins}`}
              note={`${rivalries.mostPlayed.games} meetings`}
            />
            <Rivalry
              title="Most lopsided"
              pair={rivalries.lopsided}
              detail={
                rivalries.lopsided
                  ? `${rivalries.lopsided.aWins}–${rivalries.lopsided.bWins}`
                  : ''
              }
              note={`${rivalries.lopsided?.games} meetings`}
            />
            <Rivalry
              title="Deadlocked"
              pair={rivalries.closest}
              detail={
                rivalries.closest ? `${rivalries.closest.aWins}–${rivalries.closest.bWins}` : ''
              }
              note={`${rivalries.closest?.games} meetings`}
            />
            <Rivalry
              title="Highest scoring"
              pair={rivalries.highestScoring}
              detail={
                rivalries.highestScoring
                  ? (rivalries.highestScoring.totalPoints / rivalries.highestScoring.games).toFixed(1)
                  : ''
              }
              note="Combined points per meeting"
            />
          </div>
          <p className="text-[11px] text-chalk/40">
            Lopsided, deadlocked and highest-scoring need at least {rivalries.minGames} meetings.
          </p>
        </section>
      )}

      {/* Per-member breakdown */}
      {h2h.members.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <h2 className="display text-lg text-chalk/80">By member</h2>
            <select
              className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            >
              {h2h.members.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="felt-panel rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-mustard text-left text-[10px] uppercase tracking-wider">
                  <th className="px-3 py-2">Opponent</th>
                  <th className="px-3 py-2">Record</th>
                  <th className="px-3 py-2">Win %</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Games</th>
                  <th className="px-3 py-2 hidden sm:table-cell">PF</th>
                  <th className="px-3 py-2 hidden sm:table-cell">PA</th>
                  <th className="px-3 py-2">Diff</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.opponent} className="border-t border-mustard/10 hover:bg-felt-light/20">
                    <td className="px-3 py-2 font-medium">{r.opponent}</td>
                    <td className="px-3 py-2"><RecordCell r={r} /></td>
                    <td className="px-3 py-2 font-mono text-chalk/70">
                      {(r.pct * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2 font-mono text-chalk/60 hidden sm:table-cell">
                      {r.games}
                    </td>
                    <td className="px-3 py-2 font-mono text-chalk/60 hidden sm:table-cell">
                      {r.pf.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 font-mono text-chalk/60 hidden sm:table-cell">
                      {r.pa.toFixed(1)}
                    </td>
                    <td
                      className={`px-3 py-2 font-mono ${
                        r.diff > 0 ? 'text-green-400' : r.diff < 0 ? 'text-brick-light' : 'text-chalk/60'
                      }`}
                    >
                      {r.diff > 0 ? '+' : ''}{r.diff.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && !loading && (
              <div className="p-6 text-center text-chalk/50">No matchups found.</div>
            )}
          </div>

          {totals && (
            <div className="text-xs text-chalk/50">
              {member} overall:{' '}
              <span className="font-mono text-chalk/80">
                {totals.w}-{totals.l}{totals.t ? `-${totals.t}` : ''}
              </span>{' '}
              ({(totals.pct * 100).toFixed(1)}%) across {rows.length} opponents
            </div>
          )}
        </section>
      )}
    </div>
  )
}
