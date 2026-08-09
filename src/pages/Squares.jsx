import { useEffect, useMemo, useState } from 'react'
import { getSeasons, getSquares, upsertSquares, upsertSquaresConfig } from '../lib/supabaseQueries'
import { usePool } from '../components/PoolLayout'
import PasteTable from '../components/PasteTable'
import { money } from '../lib/format'

const SIZE = 10

function RuleLine({ children }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed">
      <span className="text-mustard/50 shrink-0 mt-[3px]">▸</span>
      <span className="text-chalk/85">{children}</span>
    </li>
  )
}

function parseDigits(str) {
  if (!str) return null
  const parts = String(str).split(',').map((d) => d.trim()).filter((d) => d !== '')
  return parts.length === SIZE ? parts : null
}

export default function Squares() {
  const pool = usePool()
  const r = pool.squaresRules
  const [seasons, setSeasons] = useState([])
  const [seasonId, setSeasonId] = useState('')
  const [squares, setSquares] = useState([])
  const [config, setConfig] = useState(null)
  const [editing, setEditing] = useState(false)
  const [pasted, setPasted] = useState([])
  const [rowDigits, setRowDigits] = useState('')
  const [colDigits, setColDigits] = useState('')
  const [err, setErr] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    getSeasons(pool.id)
      .then((s) => {
        setSeasons(s)
        const current = s.find((x) => x.is_current) || s[0]
        if (current) setSeasonId(current.id)
      })
      .catch((e) => setErr(e.message))
  }, [pool.id])

  function load(id) {
    getSquares(id)
      .then(({ squares: sq, config: cfg }) => {
        setSquares(sq)
        setConfig(cfg)
        setRowDigits(cfg?.row_digits || '')
        setColDigits(cfg?.col_digits || '')
      })
      .catch((e) => setErr(e.message))
  }

  useEffect(() => {
    if (seasonId) load(seasonId)
  }, [seasonId])

  const nameAt = useMemo(() => {
    const map = {}
    squares.forEach((s) => (map[s.position] = s.name))
    return map
  }, [squares])

  const rows = parseDigits(config?.row_digits)
  const cols = parseDigits(config?.col_digits)

  async function saveNames() {
    setErr(null)
    setStatus(null)
    try {
      const payload = pasted.slice(0, 100).map((r, i) => ({
        season_id: seasonId,
        position: i,
        name: r.name || null
      }))
      await upsertSquares(payload)
      setStatus(`Saved ${payload.length} square(s).`)
      setPasted([])
      load(seasonId)
    } catch (e) {
      setErr(e.message)
    }
  }

  async function saveDigits() {
    setErr(null)
    setStatus(null)
    try {
      await upsertSquaresConfig({
        season_id: seasonId,
        row_digits: rowDigits || null,
        col_digits: colDigits || null
      })
      setStatus('Digits saved.')
      load(seasonId)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-3xl text-mustard">Super Bowl Squares</h1>
          <p className="text-sm text-chalk/60">
            Funded by the season pot and anything left over at the end of week 18.
          </p>
        </div>
        <select
          className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="felt-panel rounded-xl p-5 space-y-5">
        <div>
          <h2 className="display text-xl text-mustard">How it works</h2>
          <ul className="space-y-1.5 pt-2">
            <RuleLine>
              100 squares on a 10 × 10 grid. One team's score runs across the top, the other down
              the side.
            </RuleLine>
            <RuleLine>
              Every member gets {r.squaresPerMember} squares. The remaining {r.xSquares} are marked{' '}
              <span className="font-mono text-mustard font-semibold">X</span>.
            </RuleLine>
            <RuleLine>
              Once all squares are filled, the digits 0 through 9 are drawn at random for each axis.
              Nobody knows which numbers they hold until then.
            </RuleLine>
            <RuleLine>
              At the end of each quarter, take the last digit of each team's score. The square where
              those two digits meet wins that quarter.
            </RuleLine>
          </ul>
        </div>

        <div>
          <h2 className="display text-xl text-mustard">The pot</h2>
          <ul className="space-y-1.5 pt-2">
            <RuleLine>
              Whatever is left in the week 18 pot if nobody hits {pool.target}, plus the{' '}
              <span className="font-mono text-mustard font-semibold">{money(r.reserve)}</span>{' '}
              reserve set aside from entry fees.
            </RuleLine>
            <RuleLine>
              Split evenly across the {r.quarters} quarters — each one pays a quarter of the total.
            </RuleLine>
            <RuleLine>
              If the game goes to overtime, the final score supersedes the 4th quarter score.
            </RuleLine>
          </ul>
        </div>

        <div>
          <h2 className="display text-xl text-brick-light">The X factor</h2>
          <p className="text-sm text-chalk/70 pt-1 leading-relaxed">
            If a winning square turns out to be an{' '}
            <span className="font-mono text-mustard font-semibold">X</span>, add points to both
            teams' scores and use whichever square that lands on instead. If that one is also an{' '}
            <span className="font-mono text-mustard font-semibold">X</span>, apply the same shift
            again, and keep going until you land on a member's square.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            {r.xFactor.map((x) => (
              <div key={x.label} className="stat-card p-3 text-center">
                <div className="font-mono text-2xl text-mustard font-bold">+{x.add}</div>
                <div className="text-[10px] uppercase tracking-wider text-chalk/50">{x.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-chalk/45 pt-3">
            Example: the 2nd quarter ends 17–10, so the square is 7 and 0. If that's an X, add 2 to
            both — 19 and 12 — and the square at 9 and 2 wins instead. Still an X? Add 2 again for 1
            and 4, and so on.
          </p>
          <p className="text-xs text-chalk/45 pt-2">
            This can never run forever. Each shift walks a diagonal of at least five squares, and
            only four are marked X, so a member's square is always reachable.
          </p>
        </div>
      </div>

      {err && <div className="text-brick-light">{err}</div>}
      {status && <div className="text-green-400 text-sm">{status}</div>}

      {/* Grid */}
      <div className="felt-panel rounded-xl p-3 overflow-x-auto">
        <div className="inline-block">
          <div className="text-center text-[10px] uppercase tracking-widest text-mustard/70 pb-1">
            {config?.col_label || 'NFC'}
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-8" />
                {Array.from({ length: SIZE }, (_, c) => (
                  <th key={c} className="w-14 h-7 text-center font-mono text-sm text-mustard">
                    {cols ? cols[c] : '·'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SIZE }, (_, r) => (
                <tr key={r}>
                  <th className="w-8 text-center font-mono text-sm text-mustard">
                    {rows ? rows[r] : '·'}
                  </th>
                  {Array.from({ length: SIZE }, (_, c) => {
                    const pos = r * SIZE + c
                    const name = nameAt[pos]
                    return (
                      <td
                        key={c}
                        title={`Square ${pos + 1}`}
                        className={`w-14 h-12 border border-mustard/20 text-center text-[10px] leading-tight px-0.5 ${
                          name ? 'text-chalk/85' : 'text-chalk/25'
                        }`}
                      >
                        {name || pos + 1}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-center text-[10px] uppercase tracking-widest text-mustard/70 pt-1">
            {config?.row_label || 'AFC'} down the side
          </div>
        </div>
      </div>

      <button
        onClick={() => setEditing((v) => !v)}
        className="text-xs text-mustard hover:text-mustard-light underline"
      >
        {editing ? 'Hide entry' : 'Enter names and digits'}
      </button>

      {editing && (
        <div className="space-y-5">
          <div className="felt-panel rounded-xl p-4 space-y-3">
            <div className="display text-lg">Square names</div>
            <p className="text-xs text-chalk/60">
              Paste 100 names, one per line, filling left to right then top to bottom. Blank lines
              leave a square empty.
            </p>
            <PasteTable columns={['name']} onParsed={setPasted} placeholder={'Alex Smith\nJordan Lee\n...'} />
            <button
              onClick={saveNames}
              disabled={!pasted.length || !seasonId}
              className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40"
            >
              Save squares
            </button>
          </div>

          <div className="felt-panel rounded-xl p-4 space-y-3">
            <div className="display text-lg">Drawn digits</div>
            <p className="text-xs text-chalk/60">
              Ten digits per axis, comma separated, in grid order. Leave blank until the draw.
            </p>
            <input
              className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-3 py-2 font-mono text-sm"
              placeholder="Row digits, e.g. 3,7,1,0,5,9,2,4,8,6"
              value={rowDigits}
              onChange={(e) => setRowDigits(e.target.value)}
            />
            <input
              className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-3 py-2 font-mono text-sm"
              placeholder="Column digits, e.g. 0,4,9,2,6,1,8,3,5,7"
              value={colDigits}
              onChange={(e) => setColDigits(e.target.value)}
            />
            <button
              onClick={saveDigits}
              disabled={!seasonId}
              className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40"
            >
              Save digits
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
