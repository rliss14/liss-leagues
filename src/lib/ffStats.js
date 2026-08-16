// Derived stats for the Edward A. Liss Fantasy Football League.
// Everything here computes from ff_standings + ff_playoffs — nothing stored.

// 2022's playoff rounds ran two weeks (Wk 15-16, 17-18); 2023 onward are
// single-week. Any per-game scoring or margin record has to say so.
// 1st place gets the trophy rather than a gold medal — it's the
// Edward A. Liss Memorial Trophy, not a podium finish.
export const MEDALS = { 1: '🏆', 2: '🥈', 3: '🥉' }
export const MEDAL_TITLES = { 1: 'Champion', 2: 'Runner-up', 3: 'Third place' }

// Scoring title: most regular-season points. Separate from the trophy —
// the highest scorer usually isn't the champion.
export const POINTS_CROWN = '💯'
export const POINTS_CROWN_TITLE = 'Scoring title (most regular-season points)'

export const ASTERISK = '*'

// Which seasons ran multi-week playoff rounds varies by league, so it comes
// from league config rather than a module-level constant.
export function isTwoWeek(season, league) {
  const list = league?.twoWeekPlayoffSeasons || []
  return list.includes(Number(season))
}

export function seasonLabel(season, league) {
  return isTwoWeek(season, league) ? `${season}${ASTERISK}` : String(season)
}

const CHAMPIONSHIP = /championship/i

/**
 * The scoring title for each season: whoever put up the most regular-season
 * points. Ties are unlikely with decimal scoring, but if they happen every
 * tied member is listed.
 */
export function pointsChampions(standings) {
  const bySeason = {}
  standings.forEach((s) => {
    if (s.pf == null) return
    if (!bySeason[s.season]) bySeason[s.season] = []
    bySeason[s.season].push(s)
  })

  return Object.entries(bySeason)
    .map(([season, rows]) => {
      const top = Math.max(...rows.map((r) => Number(r.pf)))
      return {
        season: Number(season),
        pf: +top.toFixed(2),
        members: rows.filter((r) => Number(r.pf) === top).map((r) => r.member),
        runnerUp: [...rows]
          .sort((a, b) => Number(b.pf) - Number(a.pf))
          .filter((r) => Number(r.pf) !== top)[0] || null
      }
    })
    .sort((a, b) => b.season - a.season)
}

/** Season -> Set of members who led that season in points. */
export function pointsCrownLookup(standings) {
  const map = {}
  pointsChampions(standings).forEach((p) => {
    map[p.season] = new Set(p.members)
  })
  return map
}

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

// Consolation-ladder games don't count toward anyone's playoff record.
// The winners bracket counts, and so does the 3rd place game — a semifinal
// loser still played a real postseason game. Teams knocked out earlier have
// their later games dropped at export time.
const COUNTED_BRACKETS = /winner|third|3rd|championship/i

export function isCountedPlayoffGame(row) {
  if (!row.bracket) return true // older rows predate bracket labelling
  if (/consolation/i.test(row.bracket) && !/3rd|third/i.test(row.bracket)) return false
  return COUNTED_BRACKETS.test(row.bracket)
}

/** Every member's playoff games, wins and losses. */
export function playoffRecords(playoffs) {
  const rec = {}
  const touch = (m) => {
    if (!rec[m]) rec[m] = { member: m, w: 0, l: 0, games: 0, seasons: new Set() }
    return rec[m]
  }
  playoffs.filter(isCountedPlayoffGame).forEach((p) => {
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
export function memberSummaries(standings, playoffs, league) {
  const champs = champions(playoffs)
  const po = Object.fromEntries(playoffRecords(playoffs).map((r) => [r.member, r]))
  const titles = {}
  const finals = {}
  champs.forEach((c) => {
    titles[c.champion] = (titles[c.champion] || 0) + 1
    finals[c.runnerUp] = (finals[c.runnerUp] || 0) + 1
  })

  // Third place comes from final_rank in the standings rather than the
  // consolation bracket, so it stays right even if bracket naming changes.
  const thirds = {}
  standings.forEach((s) => {
    if (s.final_rank === 3) thirds[s.member] = (thirds[s.member] || 0) + 1
  })

  const scoringTitles = {}
  pointsChampions(standings).forEach((p) => {
    p.members.forEach((m) => (scoringTitles[m] = (scoringTitles[m] || 0) + 1))
  })

  // Best single playoff-game score we can see. Regular-season weekly scores
  // aren't in the ESPN export, so this is playoff games only, and only for
  // single-week seasons — 2022's two-week totals aren't comparable.
  const bestGame = {}
  playoffs
    .filter((p) => !isTwoWeek(p.season, league))
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
        thirds: thirds[member] || 0,
        pointsTitles: scoringTitles[member] || 0,
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
export function leagueRecords(standings, playoffs, league) {
  const out = []
  const push = (category, holder, value, detail, note) =>
    out.push({ category, holder, value, detail, note })

  const by = (arr, key, dir = 'desc') =>
    [...arr].sort((a, b) => (dir === 'desc' ? Number(b[key]) - Number(a[key]) : Number(a[key]) - Number(b[key])))[0]

  // ---- Season scoring ----
  const mostPF = by(standings, 'pf')
  push('Most points, season', mostPF.member, Number(mostPF.pf).toFixed(2), seasonLabel(mostPF.season, league))
  const fewestPF = by(standings, 'pf', 'asc')
  push('Fewest points, season', fewestPF.member, Number(fewestPF.pf).toFixed(2), seasonLabel(fewestPF.season, league))
  const mostPA = by(standings, 'pa')
  push('Most points against', mostPA.member, Number(mostPA.pa).toFixed(2), seasonLabel(mostPA.season, league))
  const bestPG = by(standings, 'pf_g')
  push('Best points per game', bestPG.member, Number(bestPG.pf_g).toFixed(1), seasonLabel(bestPG.season, league))

  // ---- Records ----
  const bestRec = [...standings].sort(
    (a, b) => b.wins - a.wins || Number(b.pf) - Number(a.pf)
  )[0]
  push('Best regular season', bestRec.member, bestRec.record, seasonLabel(bestRec.season, league))
  const worstRec = [...standings].sort(
    (a, b) => a.wins - b.wins || Number(a.pf) - Number(b.pf)
  )[0]
  push('Worst regular season', worstRec.member, worstRec.record, seasonLabel(worstRec.season, league))

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
    `${seasonLabel(lucky.season, league)} — ${lucky.pfRank}th in scoring, finished ${lucky.final_rank}`
  )
  const unlucky = by(luck, 'delta', 'asc')
  push(
    'Biggest underachiever',
    unlucky.member,
    unlucky.delta,
    `${seasonLabel(unlucky.season, league)} — ${unlucky.pfRank}th in scoring, finished ${unlucky.final_rank}`
  )

  // ---- Playoffs ----
  const single = playoffs.filter((p) => !isTwoWeek(p.season, league))
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
      `${seasonLabel(closest.season, league)} ${closest.round}`,
      'Single-week seasons only'
    )
    const blowout = by(withMargin, 'margin')
    push(
      'Biggest playoff blowout',
      `${blowout.winner} over ${blowout.loser}`,
      blowout.margin.toFixed(2),
      `${seasonLabel(blowout.season, league)} ${blowout.round}`,
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
      `${seasonLabel(high.season, league)} ${high.round}`,
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
      `${seasonLabel(u.season, league)} ${u.round}`
    )
  }

  // ---- Scoring titles ----
  const titleCounts = {}
  pointsChampions(standings).forEach((p) =>
    p.members.forEach((m) => (titleCounts[m] = (titleCounts[m] || 0) + 1))
  )
  const topTitles = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0]
  if (topTitles) {
    push(
      'Most scoring titles',
      topTitles[0],
      topTitles[1],
      'Led the league in regular-season points'
    )
  }

  // ---- Roster churn ----
  const mostMoves = by(standings, 'moves')
  push('Most roster moves, season', mostMoves.member, mostMoves.moves, seasonLabel(mostMoves.season, league))

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

/**
 * Single-week records, from ff_weekly. Regular season only by default —
 * 2022's two-week playoff rounds would otherwise dominate every high-score
 * list with totals that aren't single weeks at all.
 */
export function weeklyRecords(weekly) {
  const reg = weekly.filter((w) => w.game_type === 'REGULAR')
  if (!reg.length) return null

  const high = reg.reduce((m, w) => (Number(w.points) > Number(m.points) ? w : m))
  // A 0.00 week means an abandoned team, not a bad week — it would otherwise
  // own the "fewest points" record forever.
  const scored = reg.filter((w) => Number(w.points) > 0)
  const low = scored.length
    ? scored.reduce((m, w) => (Number(w.points) < Number(m.points) ? w : m))
    : null

  // One row per game rather than two, so margins aren't double-counted.
  const decided = reg.filter((w) => Number(w.margin) > 0)
  const blowout = decided.length
    ? decided.reduce((m, w) => (Number(w.margin) > Number(m.margin) ? w : m))
    : null
  const nailbiter = decided.length
    ? decided.reduce((m, w) => (Number(w.margin) < Number(m.margin) ? w : m))
    : null

  return { high, low, blowout, nailbiter }
}

/** Best single regular-season week per member. */
export function bestWeekByMember(weekly) {
  const best = {}
  weekly
    .filter((w) => w.game_type === 'REGULAR')
    .forEach((w) => {
      const cur = best[w.member]
      if (!cur || Number(w.points) > Number(cur.points)) best[w.member] = w
    })
  return best
}


/**
 * Head-to-head records from the weekly table.
 *
 * `scope` is 'regular' (default) or 'all'. Note that POSTSEASON rows in
 * ff_weekly include the whole consolation ladder, not just the winners
 * bracket — that's fine for "have these two ever played", but it's why
 * regular season is the default.
 *
 * Returns { records, members } where records[a][b] is a's record against b.
 */
export function headToHead(weekly, scope = 'regular') {
  const rows = scope === 'all' ? weekly : weekly.filter((w) => w.game_type === 'REGULAR')
  const records = {}
  const members = new Set()

  rows.forEach((w) => {
    if (!w.member || !w.opponent) return
    members.add(w.member)
    if (!records[w.member]) records[w.member] = {}
    const cur =
      records[w.member][w.opponent] ||
      (records[w.member][w.opponent] = { w: 0, l: 0, t: 0, pf: 0, pa: 0, games: 0 })
    const pts = Number(w.points) || 0
    const opp = Number(w.opponent_points) || 0
    cur.games += 1
    cur.pf += pts
    cur.pa += opp
    if (pts > opp) cur.w += 1
    else if (pts < opp) cur.l += 1
    else cur.t += 1
  })

  // Round the point totals once at the end to avoid float drift.
  Object.values(records).forEach((opps) =>
    Object.values(opps).forEach((r) => {
      r.pf = +r.pf.toFixed(2)
      r.pa = +r.pa.toFixed(2)
      r.diff = +(r.pf - r.pa).toFixed(2)
      r.pct = r.games ? +((r.w + 0.5 * r.t) / r.games).toFixed(3) : 0
    })
  )

  return { records, members: [...members].sort((a, b) => a.localeCompare(b)) }
}

/** One row per member: their record against a given opponent. */
export function opponentBreakdown(h2h, member) {
  const opps = h2h.records[member] || {}
  return Object.entries(opps)
    .map(([opponent, r]) => ({ opponent, ...r }))
    .sort((a, b) => b.games - a.games || a.opponent.localeCompare(b.opponent))
}

/**
 * League-wide rivalry notes. Each pair is counted once, not twice.
 * `minGames` keeps one-off blowouts out of the lopsided list.
 */
export function rivalryRecords(h2h, minGames = 5) {
  const pairs = []
  const seen = new Set()

  Object.entries(h2h.records).forEach(([a, opps]) => {
    Object.entries(opps).forEach(([b, r]) => {
      const key = [a, b].sort().join('|||')
      if (seen.has(key)) return
      seen.add(key)
      pairs.push({
        a, b,
        games: r.games,
        aWins: r.w,
        bWins: r.l,
        ties: r.t,
        margin: Math.abs(r.w - r.l),
        totalPoints: +(r.pf + r.pa).toFixed(2)
      })
    })
  })

  if (!pairs.length) return null

  const mostPlayed = pairs.reduce((m, p) => (p.games > m.games ? p : m))

  const eligible = pairs.filter((p) => p.games >= minGames)
  const lopsided = eligible.length
    ? eligible.reduce((m, p) => (p.margin > m.margin ? p : m))
    : null
  // Closest = smallest win gap, then most games, so a long even series wins.
  const closest = eligible.length
    ? eligible.reduce((m, p) => (p.margin < m.margin || (p.margin === m.margin && p.games > m.games) ? p : m))
    : null
  const highestScoring = pairs.reduce((m, p) =>
    p.games >= minGames && p.totalPoints / p.games > m.totalPoints / m.games ? p : m
  )

  return { mostPlayed, lopsided, closest, highestScoring, pairs, minGames }
}
