import { useEffect, useState } from 'react'
import { getSeasons, getResults } from '../lib/supabaseQueries'

export default function RecordBook() {
  const [seasons, setSeasons] = useState([])
  const [seasonId, setSeasonId] = useState(null)
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getSeasons()
      .then((s) => {
        setSeasons(s)
        if (s.length) setSeasonId(s[0].id)
      })
      .catch((e) => setErr(e.message))
  }, [])

  useEffect(() => {
    if (!seasonId) return
    getResults(seasonId).then(setRows).catch((e) => setErr(e.message))
  }, [seasonId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl text-mustard">Record Book</h1>
        <select
          className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
          value={seasonId || ''}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left">
              <th className="px-3 py-2">Wk</th>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Opp</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-mustard/10">
                <td className="px-3 py-2 font-mono">{r.week}</td>
                <td className="px-3 py-2">{r.members?.name}</td>
                <td className="px-3 py-2 font-mono">{r.team_abbr}</td>
                <td className="px-3 py-2 font-mono">{r.opponent_abbr}</td>
                <td className="px-3 py-2 font-mono">{r.score}</td>
                <td className="px-3 py-2">{r.win ? 'Win' : 'Loss'}</td>
                <td className="px-3 py-2 font-mono">{r.amount_won ? `$${r.amount_won}` : ''}</td>
                <td className="px-3 py-2 text-xs uppercase tracking-wide">
                  {r.result_type === 'hit33' ? '33-Hit' : r.result_type === 'week18_payout' ? 'Wk18 Payout' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6 text-center text-chalk/60">No results entered for this season yet.</div>
        )}
      </div>
    </div>
  )
}
