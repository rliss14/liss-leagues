import { useEffect, useMemo, useState } from 'react'
import { getFFStandings, getFFPlayoffs, getFFWeekly } from '../lib/ffQueries'
import { leagueRecords, movesCorrelation, champions, playoffRecords, weeklyRecords, seasonLabel, ASTERISK } from '../lib/ffStats'
import { usePool } from '../components/PoolLayout'

function RecordCard({ r }) {
  return (
    <div className="border-t border-mustard/10 px-3 py-3 space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-chalk/50">{r.category}</div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-chalk/90 min-w-0 break-words">{r.holder}</span>
        <span className="font-mono text-mustard font-bold whitespace-nowrap shrink-0">
          {r.value}
        </span>
      </div>
      {(r.detail || r.note) && (
        <div className="text-[11px] text-chalk/50">
          {r.detail}
          {r.note && <span className="text-chalk/35"> · {r.note}</span>}
        </div>
      )}
    </div>
  )
}

function RecordRow({ r }) {
  return (
    <tr className="border-t border-mustard/10 hover:bg-felt-light/20">
      <td className="px-3 py-2.5 text-chalk/70 text-xs uppercase tracking-wider">
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
  const league = usePool()
  const [standings, setStandings] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [weekly, setWeekly] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getFFStandings(league.id).then(setStandings).catch((e) => setErr(e.message))
    getFFPlayoffs(league.id).then(setPlayoffs).catch((e) => setErr(e.message))
    getFFWeekly(league.id).then(setWeekly).catch(() => setWeekly([]))
  }, [league.id])

  const wk = useMemo(() => (weekly.length ? weeklyRecords(weekly) : null), [weekly])

  const records = useMemo(
    () => {
      const base = standings.length && playoffs.length ? leagueRecords(standings, playoffs, league) : []
      if (!wk) return base
      const w = (label, row, val, extra) => ({
        category: label,
        holder: row.member + (extra ? ` over ${row.opponent}` : ''),
        value: val,
        detail: `${seasonLabel(row.season, league)} wk ${row.week}`,
        note: 'Regular season'
      })
      // Single-week records slot in after the season scoring records.
      return [
        base[0],
        base[1],
        w('Most points, one week', wk.high, Number(wk.high.points).toFixed(2)),
        w('Fewest points, one week', wk.low, Number(wk.low.points).toFixed(2)),
        ...base.slice(2),
        ...(wk.blowout
          ? [w('Biggest blowout', wk.blowout, Number(wk.blowout.margin).toFixed(2), true)]
          : []),
        ...(wk.nailbiter
          ? [w('Closest game', wk.nailbiter, Number(wk.nailbiter.margin).toFixed(2), true)]
          : [])
      ].filter(Boolean)
    },
    [standings, playoffs, wk]
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
        <h1 className="display text-2xl sm:text-3xl text-mustard">Record Book</h1>
        <p className="text-sm text-chalk/60">
          League-wide records for the {league.shortName}. Every number derived from the season
          archive.
        </p>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-2xl sm:text-3xl text-mustard font-bold">{seasons.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Seasons</div>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-2xl sm:text-3xl text-mustard font-bold">{champs.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Trophies awarded</div>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-2xl sm:text-3xl text-mustard font-bold">
            {new Set(champs.map((c) => c.champion)).size}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Different champs</div>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-2xl sm:text-3xl text-mustard font-bold">
            {Math.round(totalPF).toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-chalk/50">Points scored</div>
        </div>
      </div>

      {/* The records */}
      {/* Mobile: stacked cards. The four-column table forces horizontal
          scrolling on a phone, so it only appears from `sm` up. */}
      <div className="felt-panel rounded-xl sm:hidden">
        {records.map((r) => (
          <RecordCard key={r.category} r={r} />
        ))}
        {records.length === 0 && (
          <div className="p-6 text-center text-chalk/50">No data loaded yet.</div>
        )}
      </div>

      <div className="felt-panel rounded-xl overflow-x-auto hidden sm:block">
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

      {(league.twoWeekPlayoffSeasons || []).length > 0 && (
        <p className="text-xs text-chalk/45">
          <span className="text-mustard">{ASTERISK}</span>{' '}
          {league.twoWeekPlayoffSeasons.join(', ')} playoff rounds ran two weeks each, so scores and
          margins from those postseasons aren't comparable to single-week seasons. Playoff scoring
          records exclude them; season totals include them.
        </p>
      )}

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
