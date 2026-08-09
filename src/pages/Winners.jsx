import { useEffect, useMemo, useState } from 'react'
import { getAllResults } from '../lib/supabaseQueries'
import { money, isTargetHit } from '../lib/format'
import { normalizeTeam } from '../lib/teams'
import { usePool } from '../components/PoolLayout'

// Winners = paid results only. A row counts if it carries a result_type
// (a target hit or the week-18 guaranteed payout) or an amount won.
function isWinner(r) {
  return !!r.result_type || Number(r.amount_won || 0) > 0
}

// Column definitions drive both the header row and the sort comparators,
// so the two can't drift apart.
const COLUMNS = [
  { key: 'season', label: 'Season', get: (r) => r.seasons?.start_year ?? 0, numeric: true },
  { key: 'week', label: 'Wk', get: (r) => r.week ?? 0, numeric: true },
  { key: 'member', label: 'Member', get: (r) => (r.members?.name || '').toLowerCase() },
  { key: 'team', label: 'Team', get: (r) => normalizeTeam(r.team_abbr) || '' },
  { key: 'opponent', label: 'Opp', get: (r) => normalizeTeam(r.opponent_abbr) || '' },
  { key: 'score', label: 'Score', get: (r) => r.score ?? 0, numeric: true },
  { key: 'amount', label: 'Amount', get: (r) => Number(r.amount_won || 0), numeric: true },
  { key: 'type', label: 'Type', get: (r) => r.result_type || '' }
]

export default function Winners() {
  const pool = usePool()
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [memberFilter, setMemberFilter] = useState('all')
  // Default view: newest season first, then earliest week.
  const [sort, setSort] = useState({ key: 'season', dir: 'desc' })

  useEffect(() => {
    getAllResults(pool.id).then(setRows).catch((e) => setErr(e.message))
  }, [pool.id])

  const allWinners = useMemo(() => rows.filter(isWinner), [rows])

  // Member list comes from winners only — no point offering someone who's never won.
  const memberOptions = useMemo(
    () =>
      [...new Set(allWinners.map((r) => r.members?.name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allWinners]
  )

  const winners = useMemo(() => {
    let list = allWinners
    if (typeFilter === 'hit33') list = list.filter(isTargetHit)
    if (typeFilter === 'week18') list = list.filter((r) => r.result_type === 'week18_payout')
    if (memberFilter !== 'all') list = list.filter((r) => r.members?.name === memberFilter)

    const col = COLUMNS.find((c) => c.key === sort.key) || COLUMNS[0]
    const factor = sort.dir === 'asc' ? 1 : -1

    return [...list].sort((a, b) => {
      const av = col.get(a)
      const bv = col.get(b)
      let cmp = col.numeric ? av - bv : String(av).localeCompare(String(bv))
      // Stable secondary ordering so equal values don't shuffle around.
      if (cmp === 0) {
        cmp =
          (b.seasons?.start_year || 0) - (a.seasons?.start_year || 0) ||
          (a.week || 0) - (b.week || 0)
        return cmp
      }
      return cmp * factor
    })
  }, [allWinners, typeFilter, memberFilter, sort])

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : // Numbers are most useful largest-first; text A-Z.
          { key, dir: COLUMNS.find((c) => c.key === key)?.numeric ? 'desc' : 'asc' }
    )
  }

  const totalPaid = winners.reduce((sum, r) => sum + Number(r.amount_won || 0), 0)
  const filtered = typeFilter !== 'all' || memberFilter !== 'all'

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl text-mustard">Winners</h1>
          <p className="text-sm text-chalk/60">Every paid result, all seasons.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            ['all', 'All'],
            ['hit33', `${pool.target}s`],
            ['week18', 'Wk18 Payouts']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                typeFilter === key
                  ? 'bg-mustard text-felt-dark border-mustard font-semibold'
                  : 'border-mustard/30 text-chalk/70 hover:border-mustard/60'
              }`}
            >
              {label}
            </button>
          ))}

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className={`bg-felt-dark border rounded-full px-3 py-1.5 ${
              memberFilter === 'all'
                ? 'border-mustard/30 text-chalk/70'
                : 'border-mustard text-mustard font-semibold'
            }`}
          >
            <option value="all">All members</option>
            {memberOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <div className="text-brick-light">{err}</div>}

      <div className="felt-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-mustard text-left text-xs uppercase tracking-wider">
              {COLUMNS.map((c) => {
                const active = sort.key === c.key
                return (
                  <th key={c.key} className="px-3 py-2">
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
            {winners.map((r) => (
              <tr key={r.id} className="border-t border-mustard/10 hover:bg-felt-light/20">
                <td className="px-3 py-2 font-mono text-chalk/70">{r.seasons?.label}</td>
                <td className="px-3 py-2 font-mono">{r.week}</td>
                <td className="px-3 py-2 font-medium">{r.members?.name}</td>
                <td className="px-3 py-2 font-mono">{normalizeTeam(r.team_abbr)}</td>
                <td className="px-3 py-2 font-mono text-chalk/60">{normalizeTeam(r.opponent_abbr)}</td>
                <td className="px-3 py-2 font-mono font-bold text-mustard">{r.score}</td>
                <td className="px-3 py-2 font-mono">{r.amount_won ? money(r.amount_won) : '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                      isTargetHit(r)
                        ? 'bg-green-700/60 text-chalk'
                        : 'bg-mustard/30 text-mustard'
                    }`}
                  >
                    {isTargetHit(r) ? pool.target : 'Wk18'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {winners.length === 0 && (
          <div className="p-6 text-center text-chalk/50">
            {allWinners.length === 0 ? 'No winners recorded yet.' : 'No winners match these filters.'}
          </div>
        )}
      </div>

      {winners.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-chalk/60">
          <span>
            {winners.length} winning result{winners.length === 1 ? '' : 's'}
            {filtered && <span className="text-chalk/40"> of {allWinners.length}</span>} ·{' '}
            <span className="font-mono text-mustard">{money(totalPaid)}</span> paid out
          </span>
          {filtered && (
            <button
              onClick={() => {
                setTypeFilter('all')
                setMemberFilter('all')
              }}
              className="text-xs text-mustard hover:text-mustard-light underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
