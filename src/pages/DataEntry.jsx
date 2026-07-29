import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import PasteTable from '../components/PasteTable'
import {
  getMembers,
  getSeasons,
  upsertAssignments,
  upsertResults
} from '../lib/supabaseQueries'

const TABS = ['Members', 'Seasons', 'Weekly Assignments', 'Historical Results']

export default function DataEntry() {
  const [tab, setTab] = useState(TABS[0])
  const [members, setMembers] = useState([])
  const [seasons, setSeasons] = useState([])
  const [status, setStatus] = useState(null)
  const [err, setErr] = useState(null)

  function refresh() {
    getMembers().then(setMembers).catch((e) => setErr(e.message))
    getSeasons().then(setSeasons).catch((e) => setErr(e.message))
  }

  useEffect(refresh, [])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-mustard">Setup</h1>
      <div className="flex gap-3 flex-wrap text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setStatus(null); setErr(null) }}
            className={`px-3 py-1.5 rounded-full border ${
              tab === t ? 'bg-mustard text-felt-dark border-mustard font-semibold' : 'border-mustard/30 text-chalk/80'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {err && <div className="text-brick-light">{err}</div>}
      {status && <div className="text-green-400 text-sm">{status}</div>}

      {tab === 'Members' && (
        <MembersTab onSaved={() => { setStatus('Members saved.'); refresh() }} setErr={setErr} existing={members} />
      )}
      {tab === 'Seasons' && (
        <SeasonsTab onSaved={() => { setStatus('Season saved.'); refresh() }} setErr={setErr} existing={seasons} />
      )}
      {tab === 'Weekly Assignments' && (
        <AssignmentsTab members={members} seasons={seasons} onSaved={() => setStatus('Assignments saved.')} setErr={setErr} />
      )}
      {tab === 'Historical Results' && (
        <ResultsTab members={members} seasons={seasons} onSaved={() => setStatus('Results saved.')} setErr={setErr} />
      )}
    </div>
  )
}

function MembersTab({ onSaved, setErr, existing }) {
  const [rows, setRows] = useState([])
  async function save() {
    try {
      const names = rows.map((r) => r.name).filter(Boolean)
      const { error } = await supabase.from('members').upsert(
        names.map((name) => ({ name })),
        { onConflict: 'name' }
      )
      if (error) throw error
      onSaved()
    } catch (e) {
      setErr(e.message)
    }
  }
  return (
    <div className="space-y-3">
      <p className="text-chalk/70 text-sm">Paste one member name per line (32 for the full pool).</p>
      <PasteTable columns={['name']} onParsed={setRows} placeholder={'Alex Smith\nJordan Lee\n...'} />
      <div className="text-xs text-chalk/50">Currently saved: {existing.map((m) => m.name).join(', ') || 'none yet'}</div>
      <button onClick={save} disabled={!rows.length} className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40">
        Save members
      </button>
    </div>
  )
}

function SeasonsTab({ onSaved, setErr, existing }) {
  const [label, setLabel] = useState('')
  const [startYear, setStartYear] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(1)

  async function save() {
    try {
      if (isCurrent) {
        await supabase.from('seasons').update({ is_current: false }).eq('is_current', true)
      }
      const { error } = await supabase.from('seasons').upsert(
        [{ label, start_year: Number(startYear), is_current: isCurrent, current_week: Number(currentWeek) }],
        { onConflict: 'label' }
      )
      if (error) throw error
      setLabel(''); setStartYear(''); setIsCurrent(false); setCurrentWeek(1)
      onSaved()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-3 max-w-md">
      <p className="text-chalk/70 text-sm">
        Add each season once (e.g. label "2023-24", start year 2023). Mark the one currently
        in progress as "current" — that's what the Matchup Tracker and Live Tracker use.
      </p>
      <input className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1.5 text-sm" placeholder="Season label (e.g. 2023-24)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1.5 text-sm" placeholder="Start year (e.g. 2023)" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
        This is the current season
      </label>
      {isCurrent && (
        <input className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-2 py-1.5 text-sm" placeholder="Current week (1-18)" value={currentWeek} onChange={(e) => setCurrentWeek(e.target.value)} />
      )}
      <button onClick={save} disabled={!label || !startYear} className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40">
        Save season
      </button>
      <div className="text-xs text-chalk/50">
        Existing: {existing.map((s) => `${s.label}${s.is_current ? ' (current, wk ' + s.current_week + ')' : ''}`).join(', ') || 'none yet'}
      </div>
    </div>
  )
}

function AssignmentsTab({ members, seasons, onSaved, setErr }) {
  const [seasonId, setSeasonId] = useState(seasons[0]?.id || '')
  const [rows, setRows] = useState([])

  async function save() {
    try {
      const nameToId = Object.fromEntries(members.map((m) => [m.name.toLowerCase(), m.id]))
      const payload = rows.map((r) => {
        const memberId = nameToId[r.member_name?.toLowerCase()]
        if (!memberId) throw new Error(`Unknown member: "${r.member_name}" — add them in the Members tab first.`)
        return {
          season_id: seasonId,
          week: Number(r.week),
          member_id: memberId,
          team_abbr: r.team_abbr.toUpperCase()
        }
      })
      await upsertAssignments(payload)
      onSaved()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-chalk/70 text-sm">
        Paste one row per member per week: <code>week, member_name, team_abbr</code>. For a
        full season that's 18 × 32 = 576 rows — paste them all at once.
      </p>
      <select className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
        {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <PasteTable columns={['week', 'member_name', 'team_abbr']} onParsed={setRows} placeholder={'1\tAlex Smith\tKC\n1\tJordan Lee\tSF\n...'} />
      <button onClick={save} disabled={!rows.length || !seasonId} className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40">
        Save assignments
      </button>
    </div>
  )
}

function ResultsTab({ members, seasons, onSaved, setErr }) {
  const [seasonId, setSeasonId] = useState(seasons[0]?.id || '')
  const [rows, setRows] = useState([])

  async function save() {
    try {
      const nameToId = Object.fromEntries(members.map((m) => [m.name.toLowerCase(), m.id]))
      const payload = rows.map((r) => {
        const memberId = nameToId[r.member_name?.toLowerCase()]
        if (!memberId) throw new Error(`Unknown member: "${r.member_name}" — add them in the Members tab first.`)
        return {
          season_id: seasonId,
          week: Number(r.week),
          member_id: memberId,
          team_abbr: r.team_abbr.toUpperCase(),
          opponent_abbr: r.opponent_abbr.toUpperCase(),
          score: Number(r.score),
          win: /^(true|1|y|yes|win)$/i.test(r.win),
          amount_won: r.amount_won ? Number(r.amount_won) : null,
          result_type: /hit/i.test(r.result_type) ? 'hit33' : /18|payout/i.test(r.result_type) ? 'week18_payout' : null
        }
      })
      await upsertResults(payload)
      onSaved()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-chalk/70 text-sm">
        Paste historical rows: <code>week, member_name, team_abbr, opponent_abbr, score, win, amount_won, result_type</code>.
        Leave <code>result_type</code> blank unless it's a real "hit33" or the "week18_payout" tie-break.
      </p>
      <select className="bg-felt-dark border border-mustard/40 rounded px-3 py-1.5 text-sm" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
        {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <PasteTable
        columns={['week', 'member_name', 'team_abbr', 'opponent_abbr', 'score', 'win', 'amount_won', 'result_type']}
        onParsed={setRows}
        placeholder={'1\tAlex Smith\tKC\tBAL\t27\tfalse\t\t\n18\tJordan Lee\tSF\tLAR\t31\ttrue\t50\tweek18_payout'}
      />
      <button onClick={save} disabled={!rows.length || !seasonId} className="bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40">
        Save results
      </button>
    </div>
  )
}
