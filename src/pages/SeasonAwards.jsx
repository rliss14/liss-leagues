import { useEffect, useMemo, useState } from 'react'
import { getSeasons, getAllResults } from '../lib/supabaseQueries'
import { computeSeasonAwards, AWARD_PAYOUT, GAMES_PER_SEASON } from '../lib/awards'
import { money } from '../lib/format'
import { usePool } from '../components/PoolLayout'

function AwardTable({ title, subtitle, rows, payout, accent }) {
  return (
    <div className="space-y-2">
      <div>
        <h2 className={`display text-xl ${accent}`}>{title}</h2>
        <p className="text-xs text-chalk/50">{subtitle}</p>
      </div>
      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left text-[10px] uppercase tracking-wider">
              <th className="px-3 py-2">Season</th>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Total |Δ|</th>
              <th className="px-3 py-2">Avg</th>
              <th className="px-3 py-2">Payout</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.seasonId} className="border-t border-mustard/10">
                <td className="px-3 py-2 font-mono text-chalk/70">
                  {s.label}
                  {s.inProgress && (
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-mustard/70">
                      in progress
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-medium">{s.member.name}</td>
                <td className="px-3 py-2 font-mono">{s.member.total}</td>
                <td className="px-3 py-2 font-mono">{s.member.avg}</td>
                <td className="px-3 py-2 font-mono">
                  {s.inProgress ? <span className="text-chalk/40">—</span> : money(payout)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6 text-center text-chalk/50">No season results loaded yet.</div>
        )}
      </div>
    </div>
  )
}

export default function SeasonAwards() {
  const pool = usePool()
  const [seasons, setSeasons] = useState([])
  const [results, setResults] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSeasons(pool.id), getAllResults(pool.id)])
      .then(([s, r]) => {
        setSeasons(s)
        setResults(r)
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [pool.id])

  const awards = useMemo(
    () => computeSeasonAwards(results, seasons, pool.target),
    [results, seasons, pool.target]
  )

  const bestRows = awards
    .filter((a) => a.best)
    .map((a) => ({ seasonId: a.seasonId, label: a.label, inProgress: a.inProgress, member: a.best }))
  const worstRows = awards
    .filter((a) => a.worst)
    .map((a) => ({ seasonId: a.seasonId, label: a.label, inProgress: a.inProgress, member: a.worst }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-3xl text-mustard">Season Awards</h1>
        <p className="text-sm text-chalk/60">
          Cumulative distance from {pool.target} across a full season. Averages divide by {GAMES_PER_SEASON} games.
        </p>
      </div>

      {err && <div className="text-brick-light">{err}</div>}
      {loading && <div className="text-chalk/60 text-sm">Computing…</div>}

      <AwardTable
        title="Most Consistent"
        subtitle={`Lowest cumulative |${pool.target} − score| · ${money(AWARD_PAYOUT.best)} per season`}
        rows={bestRows}
        payout={AWARD_PAYOUT.best}
        accent="text-mustard"
      />

      <AwardTable
        title="Least Consistent"
        subtitle={`Highest cumulative |${pool.target} − score| · ${money(AWARD_PAYOUT.worst)} per season`}
        rows={worstRows}
        payout={AWARD_PAYOUT.worst}
        accent="text-brick-light"
      />

      <p className="text-[11px] text-chalk/40">
        A season still in progress shows its current leader but no payout, since the standings can
        still move. It's excluded from Record Book money totals until the season closes.
      </p>
    </div>
  )
}
