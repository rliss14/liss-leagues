import { useEffect, useMemo, useState } from 'react'
import {
  getSeasons,
  getAllResults,
  getAllSeasonAwards,
  upsertSeasonAwards
} from '../lib/supabaseQueries'

const AWARD_LABELS = {
  best_consistency: 'Most Consistent',
  worst_consistency: 'Least Consistent'
}

export default function SeasonAwards() {
  const [seasons, setSeasons] = useState([])
  const [results, setResults] = useState([])
  const [awards, setAwards] = useState([])
  const [err, setErr] = useState(null)
  const [status, setStatus] = useState(null)
  const [computeSeason, setComputeSeason] = useState('')
  const [bestPayout, setBestPayout] = useState('')
  const [worstPayout, setWorstPayout] = useState('')

  function load() {
    getSeasons().then((s) => {
      setSeasons(s)
      if (s.length && !computeSeason) setComputeSeason(s[0].id)
    }).catch((e) => setErr(e.message))
    getAllResults().then(setResults).catch((e) => setErr(e.message))
    getAllSeasonAwards().then(setAwards).catch((e) => setErr(e.message))
  }

  useEffect(load, [])

  // Standings for the season selected in the compute panel.
  const standings = useMemo(() => {
    const totals = {}
    results
      .filter((r) => r.season_id === computeSeason && r.score != null)
      .forEach((r) => {
        const name = r.members?.name
        if (!name) return
        if (!totals[name]) totals[name] = { sum: 0, weeks: 0, memberId: r.member_id }
        totals[name].sum += Math.abs(33 - r.score)
        totals[name].weeks += 1
      })
    return Object.entries(totals)
      .map(([name, t]) => ({
        name,
        memberId: t.memberId,
        total: t.sum,
        avg: t.weeks ? +(t.sum / t.weeks).toFixed(2) : null
      }))
      .sort((a, b) => a.total - b.total)
  }, [results, computeSeason])

  const best = standings[0]
  const worst = standings[standings.length - 1]

  const sortedAwards = useMemo(
    () =>
      [...awards].sort((a, b) => {
        const y = (b.seasons?.start_year || 0) - (a.seasons?.start_year || 0)
        return y !== 0 ? y : a.award_type.localeCompare(b.award_type)
      }),
    [awards]
  )

  async function saveAwards() {
    setStatus(null)
    try {
      await upsertSeasonAwards([
        {
          season_id: computeSeason,
          award_type: 'best_consistency',
          member_id: best.memberId,
          value: best.total,
          payout: bestPayout ? Number(bestPayout) : null
        },
        {
          season_id: computeSeason,
          award_type: 'worst_consistency',
          member_id: worst.memberId,
          value: worst.total,
          payout: worstPayout ? Number(worstPayout) : null
        }
      ])
      setStatus('Saved.')
      setBestPayout('')
      setWorstPayout('')
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl text-mustard">Season Awards</h1>
        <p className="text-sm text-chalk/60">Consistency payouts, all seasons.</p>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left text-xs uppercase tracking-wider">
              <th className="px-3 py-2">Season</th>
              <th className="px-3 py-2">Award</th>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Cumulative |Δ|</th>
              <th className="px-3 py-2">Payout</th>
            </tr>
          </thead>
          <tbody>
            {sortedAwards.map((a) => (
              <tr key={a.id} className="border-t border-mustard/10">
                <td className="px-3 py-2 font-mono text-chalk/70">{a.seasons?.label}</td>
                <td className={`px-3 py-2 ${a.award_type === 'best_consistency' ? 'text-mustard' : 'text-brick-light'}`}>
                  {AWARD_LABELS[a.award_type]}
                </td>
                <td className="px-3 py-2 font-medium">{a.members?.name}</td>
                <td className="px-3 py-2 font-mono">{a.value}</td>
                <td className="px-3 py-2 font-mono">{a.payout ? `$${a.payout}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedAwards.length === 0 && (
          <div className="p-6 text-center text-chalk/50">No awards saved yet.</div>
        )}
      </div>

      {/* Compute + save panel */}
      <div className="felt-panel rounded-xl p-5 space-y-4">
        <div className="display text-lg">Compute awards for a season</div>
        <select
          className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
          value={computeSeason}
          onChange={(e) => setComputeSeason(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="stat-card p-4 space-y-2">
            <div className="text-mustard text-sm font-semibold uppercase tracking-wider">Most Consistent</div>
            {best ? (
              <div className="text-sm">
                <span className="font-medium">{best.name}</span> · Σ|Δ|{' '}
                <span className="font-mono">{best.total}</span> · avg{' '}
                <span className="font-mono">{best.avg}</span>
              </div>
            ) : (
              <div className="text-chalk/50 text-sm">No results for this season.</div>
            )}
            <input
              className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1 text-sm font-mono"
              placeholder="Payout ($)"
              value={bestPayout}
              onChange={(e) => setBestPayout(e.target.value)}
            />
          </div>

          <div className="stat-card p-4 space-y-2">
            <div className="text-brick-light text-sm font-semibold uppercase tracking-wider">Least Consistent</div>
            {worst ? (
              <div className="text-sm">
                <span className="font-medium">{worst.name}</span> · Σ|Δ|{' '}
                <span className="font-mono">{worst.total}</span> · avg{' '}
                <span className="font-mono">{worst.avg}</span>
              </div>
            ) : (
              <div className="text-chalk/50 text-sm">No results for this season.</div>
            )}
            <input
              className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1 text-sm font-mono"
              placeholder="Payout ($)"
              value={worstPayout}
              onChange={(e) => setWorstPayout(e.target.value)}
            />
          </div>
        </div>

        {best && worst && (
          <button
            onClick={saveAwards}
            className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md hover:bg-mustard-light"
          >
            Save awards for this season
          </button>
        )}
        {status && <div className="text-green-400 text-sm">{status}</div>}
      </div>
    </div>
  )
}
