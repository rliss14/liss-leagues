// Derived stats for the Edward A. Liss Fantasy Football League.
// Everything here computes from ff_standings + ff_playoffs — nothing stored.

// 2022's playoff rounds ran two weeks (Wk 15-16, 17-18); 2023 onward are
// single-week. Any per-game scoring or margin record has to say so.
export const TWO_WEEK_PLAYOFF_SEASONS = [2022]
export const ASTERISK = '*'

export function isTwoWeek(season) {
  return TWO_WEEK_PLAYOFF_SEASONS.includes(Number(season))
}

export function seasonLabel(season) {
  return isTwoWeek(season) ? `${season}${ASTERISK}` : String(season)
}

const CHAMPIONSHIP = /championship/i

export function champions(playoffs) {
  return playoffs
    .filter((p) => CHAMPIONSHIP.test(p.round))
    .map((p) => ({
      season: p.season,
      champion: p.winner,
      championScore: Number(p.winner_score),
      runnerUp: p.loser,
      runnerUpScore: Number(p.loser_score),
      margin: +(Number(p.winner_score) - Number(p.loser_score)).toFixed(2)
    }))
    .sort((a, b) => b.season - a.season)
}

/** Every member's playoff games, wins and losses. */
export function playoffRecords(playoffs) {
  const rec = {}
  const touch = (m) => {
    if (!rec[m]) rec[m] = { member: m, w: 0, l: 0, games: 0, seasons: new Set() }
    return rec[m]
  }
  playoffs.forEach((p) => {
    const w = touch(p.winner)
    const l = touch(p.loser)
    w.w += 1; w.games += 1; w.seasons.add(p.season)
    l.l += 1; l.games += 1; l.seasons.add(p.season)
  })
  return Object.values(rec).map((r) => ({
    ...r,
    appearances: r.seasons.size,
    pct: r.games ? +(r.w / r.games).toFixed(3) : 0
  }))
}

/** Per-member career summary across regular season and playoffs. */
export function memberSummaries(standings, playoffs) {
  const champs = champions(playoffs)
  const po = Object.fromEntries(playoffRecords(playoffs).map((r) => [r.member, r]))
  const titles = {}
  const finals = {}
  champs.forEach((c) => {
    titles[c.champion] = (titles[c.champion] || 0) + 1
    finals[c.runnerUp] = (finals[c.runnerUp] || 0) + 1
  })

  // Best single playoff-game score we can see. Regular-season weekly scores
  // aren't in the ESPN export, so this is playoff games only, and only for
  // single-week seasons — 2022's two-week totals aren't comparable.
  const bestGame = {}
  playoffs
    .filter((p) => !isTwoWeek(p.season))
    .forEach((p) => {
      ;[[p.winner, p.winner_score], [p.loser, p.loser_score]].forEach(([m, s]) => {
        const v = Number(s)
        if (!bestGame[m] || v > bestGame[m].score) {
          bestGame[m] = { score: v, season: p.season, round: p.round }
        }
      })
    })

  const byMember = {}
  standings.forEach((s) => {
    if (!byMember[s.member]) byMember[s.member] = []
    byMember[s.member].push(s)
  })

  return Object.entries(byMember)
    .map(([member, rows]) => {
      const w = rows.reduce((a, r) => a + (r.wins || 0), 0)
      const l = rows.reduce((a, r) => a + (r.losses || 0), 0)
      const t = rows.reduce((a, r) => a + (r.ties || 0), 0)
      const pf = rows.reduce((a, r) => a + Number(r.pf || 0), 0)
      const pa = rows.reduce((a, r) => a + Number(r.pa || 0), 0)
      const bestFinish = Math.min(...rows.map((r) => r.final_rank || 99))
      const bestFinishSeason = rows.find((r) => r.final_rank === bestFinish)?.season
      const p = po[member]

      return {
        member,
        seasons: rows.length,
        w, l, t,
        record: `${w}-${l}${t ? `-${t}` : ''}`,
        winPct: w + l ? +(w / (w + l)).toFixed(3) : 0,
        pf: +pf.toFixed(2),
        pfPerSeason: +(pf / rows.length).toFixed(1),
        pa: +pa.toFixed(2),
        diff: +(pf - pa).toFixed(2),
        titles: titles[member] || 0,
        runnerUps: finals[member] || 0,
        bestFinish,
        bestFinishSeason,
        playoffW: p?.w || 0,
        playoffL: p?.l || 0,
        playoffPct: p?.pct ?? null,
        appearances: p?.appearances || 0,
        bestGame: bestGame[member] || null,
        avgRegRank: +(rows.reduce((a, r) => a + (r.reg_rank || 0), 0) / rows.length).toFixed(1),
        moves: rows.reduce((a, r) => a + (r.moves || 0), 0)
      }
    })
    .sort((a, b) => b.winPct - a.winPct || b.pf - a.pf)
}

/**
 * League-wide single records — one holder each, not a leaderboard.
 * `note` carries the asterisk explanation where 2022 is involved.
 */
export function leagueRecords(standings, playoffs) {
  const out = []
  const push = (category, holder, value, detail, note) =>
    out.push({ category, holder, value, detail, note })

  const by = (arr, key, dir = 'desc') =>
    [...arr].sort((a, b) => (dir === 'desc' ? Number(b[key]) - Number(a[key]) : Number(a[key]) - Number(b[key])))[0]

  // ---- Season scoring ----
  const mostPF = by(standings, 'pf')
  push('Most points, season', mostPF.member, Number(mostPF.pf).toFixed(2), seasonLabel(mostPF.season))
  const fewestPF = by(standings, 'pf', 'asc')
  push('Fewest points, season', fewestPF.member, Number(fewestPF.pf).toFixed(2), seasonLabel(fewestPF.season))
  const mostPA = by(standings, 'pa')
  push('Most points against', mostPA.member, Number(mostPA.pa).toFixed(2), seasonLabel(mostPA.season))
  const bestPG = by(standings, 'pf_g')
  push('Best points per game', bestPG.member, Number(bestPG.pf_g).toFixed(1), seasonLabel(bestPG.season))

  // ---- Records ----
  const bestRec = [...standings].sort(
    (a, b) => b.wins - a.wins || Number(b.pf) - Number(a.pf)
  )[0]
  push('Best regular season', bestRec.member, bestRec.record, seasonLabel(bestRec.season))
  const worstRec = [...standings].sort(
    (a, b) => a.wins - b.wins || Number(a.pf) - Number(b.pf)
  )[0]
  push('Worst regular season', worstRec.member, worstRec.record, seasonLabel(worstRec.season))

  // ---- Luck: scoring rank vs final placement ----
  const bySeason = {}
  standings.forEach((s) => {
    if (!bySeason[s.season]) bySeason[s.season] = []
    bySeason[s.season].push(s)
  })
  const luck = []
  Object.values(bySeason).forEach((rows) => {
    const ranked = [...rows].sort((a, b) => Number(b.pf) - Number(a.pf))
    ranked.forEach((r, i) => {
      luck.push({ ...r, pfRank: i + 1, delta: i + 1 - (r.final_rank || 99) })
    })
  })
  const lucky = by(luck, 'delta')
  push(
    'Biggest overachiever',
    lucky.member,
    `+${lucky.delta}`,
    `${seasonLabel(lucky.season)} — ${lucky.pfRank}th in scoring, finished ${lucky.final_rank}`
  )
  const unlucky = by(luck, 'delta', 'asc')
  push(
    'Biggest underachiever',
    unlucky.member,
    unlucky.delta,
    `${seasonLabel(unlucky.season)} — ${unlucky.pfRank}th in scoring, finished ${unlucky.final_rank}`
  )

  // ---- Playoffs ----
  const single = playoffs.filter((p) => !isTwoWeek(p.season))
  const withMargin = single.map((p) => ({
    ...p,
    margin: Number(p.winner_score) - Number(p.loser_score)
  }))
  if (withMargin.length) {
    const closest = by(withMargin, 'margin', 'asc')
    push(
      'Closest playoff game',
      `${closest.winner} over ${closest.loser}`,
      closest.margin.toFixed(2),
      `${seasonLabel(closest.season)} ${closest.round}`,
      'Single-week seasons only'
    )
    const blowout = by(withMargin, 'margin')
    push(
      'Biggest playoff blowout',
      `${blowout.winner} over ${blowout.loser}`,
      blowout.margin.toFixed(2),
      `${seasonLabel(blowout.season)} ${blowout.round}`,
      'Single-week seasons only'
    )
    const scores = single.flatMap((p) => [
      { m: p.winner, s: Number(p.winner_score), season: p.season, round: p.round },
      { m: p.loser, s: Number(p.loser_score), season: p.season, round: p.round }
    ])
    const high = by(scores, 's')
    push(
      'Highest playoff score',
      high.m,
      high.s.toFixed(2),
      `${seasonLabel(high.season)} ${high.round}`,
      'Single-week seasons only'
    )
  }

  // ---- Seed upsets ----
  const seedNum = (s) => {
    const m = String(s || '').match(/#(\d+)/)
    return m ? Number(m[1]) : null
  }
  const upsets = playoffs
    .map((p) => ({ ...p, ws: seedNum(p.winner_seed), ls: seedNum(p.loser_seed) }))
    .filter((p) => p.ws != null && p.ls != null)
    .map((p) => ({ ...p, gap: p.ws - p.ls }))
  if (upsets.length) {
    const u = by(upsets, 'gap')
    push(
      'Biggest seed upset',
      `${u.winner} over ${u.loser}`,
      `#${u.ws} beat #${u.ls}`,
      `${seasonLabel(u.season)} ${u.round}`
    )
  }

  // ---- Roster churn ----
  const mostMoves = by(standings, 'moves')
  push('Most roster moves, season', mostMoves.member, mostMoves.moves, seasonLabel(mostMoves.season))

  return out
}

/** Correlation between roster moves and final placement, for the fun of it. */
export function movesCorrelation(standings) {
  const rows = standings.filter((s) => s.moves != null && s.final_rank != null)
  if (rows.length < 3) return null
  const n = rows.length
  const mx = rows.reduce((a, r) => a + r.moves, 0) / n
  const my = rows.reduce((a, r) => a + r.final_rank, 0) / n
  let num = 0, dx = 0, dy = 0
  rows.forEach((r) => {
    const a = r.moves - mx
    const b = r.final_rank - my
    num += a * b; dx += a * a; dy += b * b
  })
  return dx && dy ? +(num / Math.sqrt(dx * dy)).toFixed(3) : null
}
