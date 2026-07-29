import { useEffect, useMemo, useState } from 'react'
import { getSeasons, getResults, upsertSeasonAwards, getSeasonAwards } from '../lib/supabaseQueries'

export default function SeasonAwards() {
  const [seasons, setSeasons] = useState([])
  const [seasonId, setSeasonId] = useState(null)
  const [results, setResults] = useState([])
  const [saved, setSaved] = useState([])
  const [bestPayout, setBestPayout] = useState('')
  const [worstPayout, setWorstPayout] = useState('')
  const [err, setErr] = useState(null)
  const [status, setStatus] = useState(null)

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
    Promise.all([getResults(seasonId), getSeasonAwards(seasonId)])
      .then(([r, a]) => {
        setResults(r)
        setSaved(a)
      })
      .catch((e) => setErr(e.message))
  }, [seasonId])

  const standings = useMemo(() => {
    const totals = {}
    results.forEach((r) => {
      const name = r.members?.name
      if (!name || r.score == null) return
      const diff = Math.abs(33 - r.score)
      if (!totals[name]) totals[name] = { sum: 0, weeks: 0, memberId: r.member_id }
      totals[name].sum += diff
      totals[name].weeks += 1
    })
    const rows = Object.entries(totals).map(([name, t]) => ({
      name,
      memberId: t.memberId,
      total: t.sum,
      avg: t.weeks ? +(t.sum / t.weeks).toFixed(2) : null
    }))
    rows.sort((a, b) => a.total - b.total)
    return rows
  }, [results])

  const best = standings[0]
  const worst = standings[standings.length - 1]

  async function saveAwards() {
    setStatus(null)
    try {
      await upsertSeasonAwards([
        {
          season_id: seasonId,
          award_type: 'best_consistency',
          member_id: best.memberId,
          value: best.total,
          payout: bestPayout ? Number(bestPayout) : null
        },
        {
          season_id: seasonId,
          award_type: 'worst_consistency',
          member_id: worst.memberId,
          value: worst.total,
          payout: worstPayout ? Number(worstPayout) : null
        }
      ])
      setStatus('Saved.')
      const a = await getSeasonAwards(seasonId)
      setSaved(a)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl text-mustard">Season Awards</h1>
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

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="felt-panel rounded-xl p-4 space-y-2">
          <div className="text-mustard font-display text-xl">Most Consistent</div>
          {best ? (
            <div>
              <div className="text-lg font-semibold">{best.name}</div>
              <div className="text-sm text-chalk/70">
                Cumulative |Δ|: <span className="font-mono">{best.total}</span> · Avg/week:{' '}
                <span className="font-mono">{best.avg}</span>
              </div>
            </div>
          ) : (
            <div className="text-chalk/50">No results yet.</div>
          )}
          <input
            className="mt-2 w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1 text-sm font-mono"
            placeholder="Payout amount ($)"
            value={bestPayout}
            onChange={(e) => setBestPayout(e.target.value)}
          />
        </div>

        <div className="felt-panel rounded-xl p-4 space-y-2">
          <div className="text-brick-light font-display text-xl">Least Consistent</div>
          {worst ? (
            <div>
              <div className="text-lg font-semibold">{worst.name}</div>
              <div className="text-sm text-chalk/70">
                Cumulative |Δ|: <span className="font-mono">{worst.total}</span> · Avg/week:{' '}
                <span className="font-mono">{worst.avg}</span>
              </div>
            </div>
          ) : (
            <div className="text-chalk/50">No results yet.</div>
          )}
          <input
            className="mt-2 w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1 text-sm font-mono"
            placeholder="Payout amount ($)"
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

      {saved.length > 0 && (
        <div className="text-sm text-chalk/60">
          Currently saved: {saved.map((a) => `${a.award_type} → ${a.members?.name} ($${a.payout ?? '—'})`).join(' · ')}
        </div>
      )}
    </div>
  )
}
