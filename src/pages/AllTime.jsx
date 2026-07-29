import { useEffect, useMemo, useState } from 'react'
import { getAllResults } from '../lib/supabaseQueries'
import { supabase } from '../supabaseClient'

export default function AllTime() {
  const [results, setResults] = useState([])
  const [awards, setAwards] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getAllResults().then(setResults).catch((e) => setErr(e.message))
    supabase
      .from('season_awards')
      .select('*, members(name), seasons(label)')
      .then(({ data, error }) => {
        if (error) setErr(error.message)
        else setAwards(data)
      })
  }, [])

  const careerHits = useMemo(() => {
    const counts = {}
    results.forEach((r) => {
      if (r.result_type === 'hit33') {
        const name = r.members?.name
        counts[name] = (counts[name] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [results])

  const moneyWon = useMemo(() => {
    const totals = {}
    results.forEach((r) => {
      const name = r.members?.name
      if (!name) return
      totals[name] = (totals[name] || 0) + Number(r.amount_won || 0)
    })
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }, [results])

  const bestSeason = useMemo(
    () => awards.find((a) => a.award_type === 'best_consistency' && a.value === Math.min(
      ...awards.filter((x) => x.award_type === 'best_consistency').map((x) => x.value)
    )),
    [awards]
  )
  const worstSeason = useMemo(
    () => awards.find((a) => a.award_type === 'worst_consistency' && a.value === Math.max(
      ...awards.filter((x) => x.award_type === 'worst_consistency').map((x) => x.value)
    )),
    [awards]
  )

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-mustard">All-Time</h1>
      {err && <div className="text-brick-light">{err}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="felt-panel rounded-xl p-4">
          <div className="text-mustard font-display text-xl mb-2">Most Career 33-Hits</div>
          <ol className="space-y-1 text-sm">
            {careerHits.slice(0, 8).map((r, i) => (
              <li key={r.name} className="flex justify-between">
                <span>{i + 1}. {r.name}</span>
                <span className="font-mono">{r.count}</span>
              </li>
            ))}
          </ol>
          {careerHits.length === 0 && <div className="text-chalk/50 text-sm">No hits recorded yet.</div>}
        </div>

        <div className="felt-panel rounded-xl p-4">
          <div className="text-mustard font-display text-xl mb-2">Most Money Won</div>
          <ol className="space-y-1 text-sm">
            {moneyWon.slice(0, 8).map((r, i) => (
              <li key={r.name} className="flex justify-between">
                <span>{i + 1}. {r.name}</span>
                <span className="font-mono">${r.total}</span>
              </li>
            ))}
          </ol>
          {moneyWon.length === 0 && <div className="text-chalk/50 text-sm">No winnings recorded yet.</div>}
        </div>

        <div className="felt-panel rounded-xl p-4">
          <div className="text-mustard font-display text-xl mb-2">Best Season Ever</div>
          {bestSeason ? (
            <div className="text-sm">
              {bestSeason.members?.name} — {bestSeason.seasons?.label} (Σ|Δ| {bestSeason.value})
            </div>
          ) : (
            <div className="text-chalk/50 text-sm">No season awards saved yet.</div>
          )}
        </div>

        <div className="felt-panel rounded-xl p-4">
          <div className="text-brick-light font-display text-xl mb-2">Worst Season Ever</div>
          {worstSeason ? (
            <div className="text-sm">
              {worstSeason.members?.name} — {worstSeason.seasons?.label} (Σ|Δ| {worstSeason.value})
            </div>
          ) : (
            <div className="text-chalk/50 text-sm">No season awards saved yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
