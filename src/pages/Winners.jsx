import { useEffect, useMemo, useState } from 'react'
import { getAllResults } from '../lib/supabaseQueries'

// Winners = paid results only. A row counts if it carries a result_type
// (a real 33-hit or the week-18 guaranteed payout) or an amount won.
function isWinner(r) {
  return !!r.result_type || Number(r.amount_won || 0) > 0
}

export default function Winners() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getAllResults().then(setRows).catch((e) => setErr(e.message))
  }, [])

  const winners = useMemo(() => {
    const list = rows.filter(isWinner)
    list.sort((a, b) => {
      const yearDiff = (b.seasons?.start_year || 0) - (a.seasons?.start_year || 0)
      return yearDiff !== 0 ? yearDiff : a.week - b.week
    })
    if (filter === 'hit33') return list.filter((r) => r.result_type === 'hit33')
    if (filter === 'week18') return list.filter((r) => r.result_type === 'week18_payout')
    return list
  }, [rows, filter])

  const totalPaid = winners.reduce((sum, r) => sum + Number(r.amount_won || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl text-mustard">Winners</h1>
          <p className="text-sm text-chalk/60">Every paid result, all seasons.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            ['all', 'All'],
            ['hit33', '33-Hits'],
            ['week18', 'Wk18 Payouts']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full border ${
                filter === key
                  ? 'bg-mustard text-felt-dark border-mustard font-semibold'
                  : 'border-mustard/30 text-chalk/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left text-xs uppercase tracking-wider">
              <th className="px-3 py-2">Season</th>
              <th className="px-3 py-2">Wk</th>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Opp</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((r) => (
              <tr key={r.id} className="border-t border-mustard/10 hover:bg-felt-light/20">
                <td className="px-3 py-2 font-mono text-chalk/70">{r.seasons?.label}</td>
                <td className="px-3 py-2 font-mono">{r.week}</td>
                <td className="px-3 py-2 font-medium">{r.members?.name}</td>
                <td className="px-3 py-2 font-mono">{r.team_abbr}</td>
                <td className="px-3 py-2 font-mono text-chalk/60">{r.opponent_abbr}</td>
                <td className="px-3 py-2 font-mono font-bold text-mustard">{r.score}</td>
                <td className="px-3 py-2 font-mono">{r.amount_won ? `$${r.amount_won}` : '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                      r.result_type === 'hit33'
                        ? 'bg-green-700/60 text-chalk'
                        : 'bg-mustard/30 text-mustard'
                    }`}
                  >
                    {r.result_type === 'hit33' ? '33-Hit' : 'Wk18'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {winners.length === 0 && (
          <div className="p-6 text-center text-chalk/50">No winners recorded yet.</div>
        )}
      </div>

      {winners.length > 0 && (
        <div className="text-sm text-chalk/60">
          {winners.length} winning result{winners.length === 1 ? '' : 's'} ·{' '}
          <span className="font-mono text-mustard">${totalPaid.toLocaleString()}</span> paid out
        </div>
      )}
    </div>
  )
}
