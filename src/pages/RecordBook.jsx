import { useEffect, useMemo, useState } from 'react'
import { getAllResults, getSeasons } from '../lib/supabaseQueries'
import { computeSeasonAwards, awardMoneyByMember, AWARD_PAYOUT } from '../lib/awards'
import { money } from '../lib/format'

function StatCard({ title, children, note }) {
  return (
    <div className="stat-card p-4 space-y-2">
      <div className="text-mustard text-xs font-semibold uppercase tracking-wider">{title}</div>
      {children}
      {note && <div className="text-[11px] text-chalk/40 pt-1">{note}</div>}
    </div>
  )
}

function Leaders({ rows, unit = '', limit = 5, empty = 'No data yet.', formatter }) {
  if (!rows.length) return <div className="text-chalk/50 text-sm">{empty}</div>
  return (
    <ol className="space-y-1 text-sm">
      {rows.slice(0, limit).map((r, i) => (
        <li key={r.label + i} className="flex justify-between gap-3">
          <span className={i === 0 ? 'font-semibold' : 'text-chalk/80'}>
            {i + 1}. {r.label}
          </span>
          <span className={`font-mono ${i === 0 ? 'text-mustard font-bold' : 'text-chalk/70'}`}>
            {formatter ? formatter(r.value) : `${unit}${r.value}`}{r.suffix || ''}
          </span>
        </li>
      ))}
    </ol>
  )
}

const rank = (obj, mapLabel = (k) => k) =>
  Object.entries(obj)
    .map(([k, v]) => ({ label: mapLabel(k), value: v }))
    .sort((a, b) => b.value - a.value)

export default function RecordBook() {
  const [results, setResults] = useState([])
  const [seasons, setSeasons] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getAllResults().then(setResults).catch((e) => setErr(e.message))
    getSeasons().then(setSeasons).catch((e) => setErr(e.message))
  }, [])

  // Season awards are derived, not stored.
  const awards = useMemo(() => computeSeasonAwards(results, seasons), [results, seasons])
  const awardMoney = useMemo(() => awardMoneyByMember(awards), [awards])

  const hits = useMemo(() => results.filter((r) => r.result_type === 'hit33'), [results])

  // ---- Money: weekly winnings + season award payouts combined ----
  const moneyByMember = useMemo(() => {
    const totals = {}
    results.forEach((r) => {
      const name = r.members?.name
      if (!name) return
      totals[name] = (totals[name] || 0) + Number(r.amount_won || 0)
    })
    Object.entries(awardMoney).forEach(([name, amt]) => {
      totals[name] = (totals[name] || 0) + amt
    })
    return rank(totals)
  }, [results, awardMoney])

  const moneyOneSeason = useMemo(() => {
    const totals = {}
    const key = (name, label) => `${name}|||${label}`
    results.forEach((r) => {
      const name = r.members?.name
      if (!name) return
      const k = key(name, r.seasons?.label)
      totals[k] = (totals[k] || 0) + Number(r.amount_won || 0)
    })
    awards
      .filter((a) => !a.inProgress)
      .forEach((a) => {
        if (a.best) {
          const k = key(a.best.name, a.label)
          totals[k] = (totals[k] || 0) + AWARD_PAYOUT.best
        }
        if (a.worst) {
          const k = key(a.worst.name, a.label)
          totals[k] = (totals[k] || 0) + AWARD_PAYOUT.worst
        }
      })
    return rank(totals, (k) => {
      const [n, s] = k.split('|||')
      return `${n} (${s})`
    }).filter((r) => r.value > 0)
  }, [results, awards])

  const moneyOneWeek = useMemo(
    () =>
      results
        .filter((r) => Number(r.amount_won || 0) > 0)
        .map((r) => ({
          label: `${r.members?.name} — ${r.seasons?.label} Wk ${r.week}`,
          value: Number(r.amount_won)
        }))
        .sort((a, b) => b.value - a.value),
    [results]
  )

  // ---- Hit counts ----
  const hitsByMember = useMemo(() => {
    const c = {}
    hits.forEach((r) => {
      const n = r.members?.name
      if (n) c[n] = (c[n] || 0) + 1
    })
    return rank(c)
  }, [hits])

  const hitsOneSeason = useMemo(() => {
    const c = {}
    hits.forEach((r) => {
      const k = `${r.members?.name}|||${r.seasons?.label}`
      c[k] = (c[k] || 0) + 1
    })
    return rank(c, (k) => {
      const [n, s] = k.split('|||')
      return `${n} (${s})`
    })
  }, [hits])

  const hitsByTeam = useMemo(() => {
    const c = {}
    hits.forEach((r) => {
      if (r.team_abbr) c[r.team_abbr] = (c[r.team_abbr] || 0) + 1
    })
    return rank(c)
  }, [hits])

  const hitsAllowedByTeam = useMemo(() => {
    const c = {}
    hits.forEach((r) => {
      if (r.opponent_abbr) c[r.opponent_abbr] = (c[r.opponent_abbr] || 0) + 1
    })
    return rank(c)
  }, [hits])

  const hitsByWeek = useMemo(() => {
    const c = {}
    hits.forEach((r) => {
      c[r.week] = (c[r.week] || 0) + 1
    })
    return rank(c, (k) => `Week ${k}`)
  }, [hits])

  // ---- Context splits (need migration-02 columns) ----
  const splits = useMemo(() => {
    const wins = hits.filter((r) => r.team_won_game === true).length
    const losses = hits.filter((r) => r.team_won_game === false).length
    const home = hits.filter((r) => r.home_away === 'home').length
    const away = hits.filter((r) => r.home_away === 'away').length
    return { wins, losses, home, away, unknownWL: hits.length - wins - losses, unknownHA: hits.length - home - away }
  }, [hits])

  // ---- Season consistency extremes ----
  const bestSeason = useMemo(() => {
    const done = awards.filter((a) => a.best)
    return done.length
      ? done.reduce((m, a) => (a.best.total < m.best.total ? a : m))
      : null
  }, [awards])

  const worstSeason = useMemo(() => {
    const done = awards.filter((a) => a.worst)
    return done.length
      ? done.reduce((m, a) => (a.worst.total > m.worst.total ? a : m))
      : null
  }, [awards])

  // ---- Extras ----
  const heartbreaks = useMemo(() => {
    const c = {}
    results.forEach((r) => {
      if (r.score === 32 || r.score === 34) {
        const n = r.members?.name
        if (n) c[n] = (c[n] || 0) + 1
      }
    })
    return rank(c)
  }, [results])

  const multiHitWeeks = useMemo(() => {
    const c = {}
    hits.forEach((r) => {
      const k = `${r.seasons?.label} Wk ${r.week}`
      c[k] = (c[k] || 0) + 1
    })
    return rank(c).filter((r) => r.value > 1)
  }, [hits])

  const avgDiffByMember = useMemo(() => {
    const t = {}
    results.forEach((r) => {
      if (r.score == null) return
      const n = r.members?.name
      if (!n) return
      if (!t[n]) t[n] = { sum: 0, n: 0 }
      t[n].sum += Math.abs(33 - r.score)
      t[n].n += 1
    })
    return Object.entries(t)
      .map(([label, v]) => ({ label, value: +(v.sum / v.n).toFixed(2) }))
      .sort((a, b) => a.value - b.value)
  }, [results])

  // ---- Longest drought: most consecutive played weeks without a 33 ----
  const droughts = useMemo(() => {
    const byMember = {}
    results.forEach((r) => {
      const n = r.members?.name
      if (!n) return
      if (!byMember[n]) byMember[n] = []
      byMember[n].push({
        year: r.seasons?.start_year || 0,
        week: r.week,
        hit: r.result_type === 'hit33'
      })
    })

    return Object.entries(byMember)
      .map(([name, weeks]) => {
        weeks.sort((a, b) => a.year - b.year || a.week - b.week)
        let longest = 0
        let run = 0
        weeks.forEach((w) => {
          if (w.hit) {
            if (run > longest) longest = run
            run = 0
          } else {
            run += 1
          }
        })
        // The trailing run is still active — no hit has ended it yet.
        const active = run > longest
        if (run > longest) longest = run
        return { label: name, value: longest, suffix: active ? ' wks (active)' : ' wks' }
      })
      .sort((a, b) => b.value - a.value)
  }, [results])

  // ---- Most-assigned team per member ----
  // Results are the record of weeks actually played; assignments fill in any
  // week that hasn't been written back as a result yet (i.e. the live season).
  const favoriteTeams = useMemo(() => {
    const tally = {}
    const seen = new Set()

    results.forEach((r) => {
      const n = r.members?.name
      if (!n || !r.team_abbr) return
      seen.add(`${r.season_id}|${r.week}|${r.member_id}`)
      if (!tally[n]) tally[n] = {}
      tally[n][r.team_abbr] = (tally[n][r.team_abbr] || 0) + 1
    })

    assignments.forEach((a) => {
      const n = a.members?.name
      if (!n || !a.team_abbr) return
      if (seen.has(`${a.season_id}|${a.week}|${a.member_id}`)) return
      if (!tally[n]) tally[n] = {}
      tally[n][a.team_abbr] = (tally[n][a.team_abbr] || 0) + 1
    })

    return Object.entries(tally)
      .map(([name, teams]) => {
        const sorted = Object.entries(teams).sort((a, b) => b[1] - a[1])
        const [team, count] = sorted[0]
        return { name, team, count, total: sorted.reduce((s, [, c]) => s + c, 0) }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [results, assignments])

  // Distinct season+week combinations, not row count.
  const weeksRecorded = useMemo(
    () => new Set(results.map((r) => `${r.season_id}|${r.week}`)).size,
    [results]
  )

  const totalPaid =
    results.reduce((s, r) => s + Number(r.amount_won || 0), 0) +
    Object.values(awardMoney).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl text-mustard">Record Book</h1>
        <p className="text-sm text-chalk/60">
          Every all-time number, derived automatically from the Winners and Season Awards data.
        </p>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="stat-card p-4">
          <div className="text-xs uppercase tracking-wider text-chalk/50">Total 33-Hits</div>
          <div className="font-mono text-3xl text-mustard font-bold">{hits.length}</div>
        </div>
        <div className="stat-card p-4">
          <div className="text-xs uppercase tracking-wider text-chalk/50">Total Paid Out</div>
          <div className="font-mono text-3xl text-mustard font-bold">{money(totalPaid)}</div>
        </div>
        <div className="stat-card p-4">
          <div className="text-xs uppercase tracking-wider text-chalk/50">Weeks Recorded</div>
          <div className="font-mono text-3xl text-mustard font-bold">{weeksRecorded}</div>
          <div className="text-[10px] text-chalk/40 pt-0.5">
            {results.length.toLocaleString()} member-weeks
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard title="Most Career 33-Hits"><Leaders rows={hitsByMember} /></StatCard>
        <StatCard title="Most Money Won (Career)" note="Includes week-18 payouts and season awards.">
          <Leaders rows={moneyByMember} formatter={money} />
        </StatCard>
        <StatCard title="Most Money Won — One Season"><Leaders rows={moneyOneSeason} formatter={money} /></StatCard>
        <StatCard title="Most Money Won — One Week"><Leaders rows={moneyOneWeek} formatter={money} /></StatCard>
        <StatCard title="Most 33-Hits — One Season"><Leaders rows={hitsOneSeason} /></StatCard>
        <StatCard title="Most Common Week for 33s"><Leaders rows={hitsByWeek} /></StatCard>
        <StatCard title="Team That Has Hit 33 Most"><Leaders rows={hitsByTeam} /></StatCard>
        <StatCard title="Team That Has Given Up 33 Most" note="Opponent on the losing end of a 33.">
          <Leaders rows={hitsAllowedByTeam} />
        </StatCard>
      </div>

      <div className="stat-card p-4 space-y-3">
        <div className="text-mustard text-xs font-semibold uppercase tracking-wider">
          How the 33s Happened
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            ['In a Win', splits.wins],
            ['In a Loss', splits.losses],
            ['At Home', splits.home],
            ['Away', splits.away]
          ].map(([label, val]) => (
            <div key={label}>
              <div className="font-mono text-2xl text-mustard font-bold">{val}</div>
              <div className="text-[11px] uppercase tracking-wider text-chalk/50">{label}</div>
            </div>
          ))}
        </div>
        {(splits.unknownWL > 0 || splits.unknownHA > 0) && (
          <div className="text-[11px] text-chalk/40">
            {Math.max(splits.unknownWL, splits.unknownHA)} hit(s) missing win/loss or home/away data —
            add those columns in Setup to complete these splits.
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard title="Best Season Ever" note="Lowest cumulative |33 − score|.">
          {bestSeason ? (
            <div className="text-sm">
              <span className="font-semibold">{bestSeason.best.name}</span> — {bestSeason.label} ·{' '}
              <span className="font-mono text-mustard">Σ|Δ| {bestSeason.best.total}</span>
            </div>
          ) : (
            <div className="text-chalk/50 text-sm">No season results yet.</div>
          )}
        </StatCard>
        <StatCard title="Worst Season Ever" note="Highest cumulative |33 − score|.">
          {worstSeason ? (
            <div className="text-sm">
              <span className="font-semibold">{worstSeason.worst.name}</span> — {worstSeason.label} ·{' '}
              <span className="font-mono text-brick-light">Σ|Δ| {worstSeason.worst.total}</span>
            </div>
          ) : (
            <div className="text-chalk/50 text-sm">No season results yet.</div>
          )}
        </StatCard>
      </div>

      <div>
        <div className="display text-lg text-chalk/80 mb-3">Bonus Records</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Longest Drought" note="Most weeks in a row without a 33. 'Active' means it's still running.">
            <Leaders rows={droughts} />
          </StatCard>
          <StatCard title="Heartbreak Club" note="Finished at 32 or 34 — one score away.">
            <Leaders rows={heartbreaks} />
          </StatCard>
          <StatCard title="Multi-Hit Weeks" note="Weeks where more than one member hit 33.">
            <Leaders rows={multiHitWeeks} empty="Never happened yet." />
          </StatCard>
          <StatCard title="Best All-Time Average |Δ|" note="Lowest average distance from 33, all weeks.">
            <Leaders rows={avgDiffByMember} />
          </StatCard>
        </div>
      </div>

    </div>
  )
}
