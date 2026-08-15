import { useEffect, useMemo, useState } from 'react'
import { getFFStandings, getFFPlayoffs } from '../lib/ffQueries'
import { leagueRecords, movesCorrelation, champions, playoffRecords, ASTERISK } from '../lib/ffStats'

function RecordRow({ r }) {
  return (
    <tr className="border-t border-mustard/10 hover:bg-felt-light/20">
      <td className="px-3 py-2.5 text-chalk/70 text-xs uppercase tracking-wider whitespace-nowrap">
        {r.category}
      </td>
      <td className="px-3 py-2.5 font-medium">{r.holder}</td>
      <td className="px-3 py-2.5 font-mono text-mustard font-bold whitespace-nowrap">{r.value}</td>
      <td className="px-3 py-2.5 text-chalk/55 text-xs">
        {r.detail}
        {r.note && <span className="block text-chalk/35">{r.note}</span>}
      </td>
    </tr>
  )
}

export default function FFRecordBook() {
  const [standings, setStandings] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getFFStandings().then(setStandings).catch((e) => setErr(e.message))
    getFFPlayoffs().then(setPlayoffs).catch((e) => setErr(e.message))
  }, [])

  const records = useMemo(
    () => (standings.length && playoffs.length ? leagueRecords(standings, playoffs) : []),
    [standings, playoffs]
  )
  const corr = useMemo(() => movesCorrelation(standings), [standings])
  const champs = useMemo(() => champions(playoffs), [playoffs])
  const poRecs = useMemo(() => playoffRecords(playoffs), [playoffs])

  const seasons = [...new Set(standings.map((s) => s.season))]
  const totalPF = standings.reduce((a, s) => a + Number(s.pf || 0), 0)
  const neverMade = standings.length
    ? [...new Set(standings.map((s) => s.member))].filter(
        (m) => !poRecs.some((p) => p.member === m)
      )
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-3xl text-mustard">Record Book</h1>
        <p className="text-sm text-chalk/60">
          League-wide records for the EALFFL. Every number derived from the season archive.
        </p>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card p-4">
          <div className="font-mono text-3xl text-mustard font-bold">{seasons.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Seasons</div>
        </div>
        <div className="stat-card p-4">
          <div className="font-mono text-3xl text-mustard font-bold">{champs.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Trophies awarded</div>
        </div>
        <div className="stat-card p-4">
          <div className="font-mono text-3xl text-mustard font-bold">
            {new Set(champs.map((c) => c.champion)).size}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Different champs</div>
        </div>
        <div className="stat-card p-4">
          <div className="font-mono text-3xl text-mustard font-bold">
            {Math.round(totalPF).toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Points scored</div>
        </div>
      </div>

      {/* The records */}
      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left text-[10px] uppercase tracking-wider">
              <th className="px-3 py-2">Record</th>
              <th className="px-3 py-2">Holder</th>
              <th className="px-3 py-2">Mark</th>
              <th className="px-3 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <RecordRow key={r.category} r={r} />
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="p-6 text-center text-chalk/50">No data loaded yet.</div>
        )}
      </div>

      <p className="text-xs text-chalk/45">
        <span className="text-mustard">{ASTERISK}</span> 2022 playoff rounds ran two weeks each
        (Wk 15–16 and 17–18), so scores and margins from that postseason aren't comparable to
        single-week seasons. Playoff scoring records exclude 2022 entirely; season totals include it.
      </p>

      {/* Odds and ends */}
      <section className="space-y-3">
        <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">
          Odds &amp; Ends
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {neverMade.length > 0 && (
            <div className="stat-card p-4 space-y-1">
              <div className="text-xs uppercase tracking-wider text-mustard/80">
                Still Waiting
              </div>
              <div className="text-sm text-chalk/85">{neverMade.join(', ')}</div>
              <div className="text-[11px] text-chalk/45">
                Yet to make a playoff appearance.
              </div>
            </div>
          )}
          {corr != null && (
            <div className="stat-card p-4 space-y-1">
              <div className="text-xs uppercase tracking-wider text-mustard/80">
                Do Moves Matter?
              </div>
              <div className="font-mono text-2xl text-mustard font-bold">{corr}</div>
              <div className="text-[11px] text-chalk/45">
                Correlation between roster moves and finish. Essentially zero — churn hasn't bought
                anyone a trophy.
              </div>
            </div>
          )}
          <div className="stat-card p-4 space-y-1">
            <div className="text-xs uppercase tracking-wider text-mustard/80">Parity</div>
            <div className="font-mono text-2xl text-mustard font-bold">
              {new Set(champs.map((c) => c.champion)).size}/{champs.length}
            </div>
            <div className="text-[11px] text-chalk/45">
              Different champions in {champs.length} seasons. No repeat winners yet.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
