import { useEffect, useMemo, useState } from 'react'
import { getFFStandings } from '../lib/ffQueries'
import {
  seasonLabel,
  isTwoWeek,
  pointsCrownLookup,
  MEDALS,
  MEDAL_TITLES,
  POINTS_CROWN,
  POINTS_CROWN_TITLE
} from '../lib/ffStats'
import { usePool } from '../components/PoolLayout'

// Column definitions drive both the header row and the sort comparators.
const COLUMNS = [
  { key: 'reg_rank', label: '#', get: (r) => r.reg_rank ?? 99, numeric: true, defaultDir: 'asc' },
  { key: 'member', label: 'Member', get: (r) => (r.member || '').toLowerCase() },
  { key: 'team', label: 'Team', get: (r) => (r.team || '').toLowerCase(), hideOnMobile: true },
  { key: 'wins', label: 'Record', get: (r) => (r.wins ?? 0) * 1000 + Number(r.pf || 0) / 10000, numeric: true },
  { key: 'pf', label: 'PF', get: (r) => Number(r.pf || 0), numeric: true },
  { key: 'pa', label: 'PA', get: (r) => Number(r.pa || 0), numeric: true, hideOnMobile: true },
  { key: 'pf_g', label: 'PF/G', get: (r) => Number(r.pf_g || 0), numeric: true, hideOnMobile: true },
  { key: 'diff', label: 'Diff', get: (r) => Number(r.pf || 0) - Number(r.pa || 0), numeric: true },
  { key: 'moves', label: 'Moves', get: (r) => r.moves ?? 0, numeric: true, hideOnMobile: true },
  { key: 'final_rank', label: 'Finish', get: (r) => r.final_rank ?? 99, numeric: true, defaultDir: 'asc' }
]

export default function FFSeasons() {
  const league = usePool()
  const [standings, setStandings] = useState([])
  const [err, setErr] = useState(null)
  const [season, setSeason] = useState(null)
  const [sort, setSort] = useState({ key: 'reg_rank', dir: 'asc' })

  useEffect(() => {
    getFFStandings(league.id).then(setStandings).catch((e) => setErr(e.message))
  }, [league.id])

  const crowns = useMemo(() => pointsCrownLookup(standings), [standings])
  const former = useMemo(() => new Set(league.formerMembers || []), [league.formerMembers])

  const seasons = useMemo(
    () => [...new Set(standings.map((s) => s.season))].sort((a, b) => b - a),
    [standings]
  )
  const activeSeason = season ?? seasons[0]

  const rows = useMemo(() => {
    const list = standings.filter((s) => s.season === activeSeason)
    const col = COLUMNS.find((c) => c.key === sort.key) || COLUMNS[0]
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = col.get(a)
      const bv = col.get(b)
      const cmp = col.numeric ? av - bv : String(av).localeCompare(String(bv))
      // Regular-season order is the stable fallback.
      if (cmp === 0) return (a.reg_rank ?? 99) - (b.reg_rank ?? 99)
      return cmp * factor
    })
  }, [standings, activeSeason, sort])

  function toggleSort(key) {
    const col = COLUMNS.find((c) => c.key === key)
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: col?.defaultDir || (col?.numeric ? 'desc' : 'asc') }
    )
  }

  const totals = useMemo(() => {
    if (!rows.length) return null
    const pf = rows.reduce((a, r) => a + Number(r.pf || 0), 0)
    return {
      pf: pf.toFixed(2),
      avg: (pf / rows.length).toFixed(2),
      moves: rows.reduce((a, r) => a + (r.moves || 0), 0)
    }
  }, [rows])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl sm:text-3xl text-mustard">Seasons</h1>
          <p className="text-sm text-chalk/60">
            Regular season order. Click any column to sort.
          </p>
        </div>
        <select
          className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
          value={activeSeason || ''}
          onChange={(e) => setSeason(Number(e.target.value))}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>{seasonLabel(s, league)}</option>
          ))}
        </select>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left text-[10px] uppercase tracking-wider">
              {COLUMNS.map((c) => {
                const active = sort.key === c.key
                return (
                  <th
                    key={c.key}
                    className={`px-2 sm:px-3 py-2 ${c.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  >
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={`flex items-center gap-1 uppercase tracking-wider hover:text-mustard-light ${
                        active ? 'text-mustard' : 'text-mustard/60'
                      }`}
                      title={`Sort by ${c.label}`}
                    >
                      {c.label}
                      <span className={active ? 'opacity-100' : 'opacity-0'}>
                        {sort.dir === 'asc' ? '▲' : '▼'}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const diff = Number(r.pf || 0) - Number(r.pa || 0)
              return (
                <tr key={r.id || r.member} className="border-t border-mustard/10 hover:bg-felt-light/20">
                  <td className="px-2 sm:px-3 py-2 font-mono text-chalk/60">{r.reg_rank}</td>
                  <td
                    className={`px-2 sm:px-3 py-2 font-medium whitespace-nowrap ${
                      former.has(r.member) ? 'text-chalk/60' : ''
                    }`}
                    title={former.has(r.member) ? 'Former member' : undefined}
                  >
                    {r.member}{' '}
                    {MEDALS[r.final_rank] && (
                      <span title={MEDAL_TITLES[r.final_rank]}>{MEDALS[r.final_rank]}</span>
                    )}
                    {crowns[r.season]?.has(r.member) && (
                      <span title={POINTS_CROWN_TITLE}>{POINTS_CROWN}</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-chalk/60 text-xs hidden md:table-cell">{r.team}</td>
                  <td className="px-2 sm:px-3 py-2 font-mono">{r.record}</td>
                  <td
                    className={`px-2 sm:px-3 py-2 font-mono ${
                      crowns[r.season]?.has(r.member) ? 'text-mustard font-bold' : ''
                    }`}
                  >
                    {Number(r.pf).toFixed(1)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 font-mono text-chalk/60 hidden md:table-cell">{Number(r.pa).toFixed(2)}</td>
                  <td className="px-2 sm:px-3 py-2 font-mono text-chalk/60 hidden md:table-cell">{Number(r.pf_g).toFixed(1)}</td>
                  <td
                    className={`px-2 sm:px-3 py-2 font-mono ${
                      diff > 0 ? 'text-green-400' : diff < 0 ? 'text-brick-light' : 'text-chalk/60'
                    }`}
                  >
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 font-mono text-chalk/60 hidden md:table-cell">{r.moves}</td>
                  <td className="px-2 sm:px-3 py-2 font-mono text-chalk/60">{r.final_rank}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6 text-center text-chalk/50">No standings loaded yet.</div>
        )}
      </div>

      {totals && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-chalk/50">
          <span>
            League total: <span className="font-mono text-chalk/70">{totals.pf}</span>
          </span>
          <span>
            Average per team: <span className="font-mono text-chalk/70">{totals.avg}</span>
          </span>
          <span>
            Roster moves: <span className="font-mono text-chalk/70">{totals.moves}</span>
          </span>
        </div>
      )}

      <p className="text-xs text-chalk/45">
        {MEDALS[1]} champion · {MEDALS[2]} runner-up · {MEDALS[3]} third place ·{' '}
        {POINTS_CROWN} scoring title. The Finish column is
        placement after the playoffs, which is why it often differs from regular season order.
        {isTwoWeek(activeSeason, league) && ' 2022 playoff rounds ran two weeks each.'}
      </p>
    </div>
  )
}
