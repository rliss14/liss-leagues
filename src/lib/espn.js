// Thin wrapper around ESPN's free, unofficial public scoreboard endpoint.
// No API key required. Docs are unofficial/community-reverse-engineered;
// the shape below reflects the current live response as of 2026.

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'

/**
 * Fetch one NFL week's scoreboard (regular season by default).
 *
 * IMPORTANT: the season year goes in `dates`, NOT `year`. The scoreboard
 * endpoint ignores `year` entirely and silently falls back to a default,
 * which returns the PREVIOUS season's games for whatever week you asked for.
 *
 * @param {number} week 1-18
 * @param {number} year e.g. 2026
 * @param {number} seasontype 1=pre, 2=regular, 3=post
 * @returns {Promise<Array>} games, with .requestedYear / .returnedYear on each
 */
export async function fetchWeekScoreboard(week, year, seasontype = 2) {
  const url = `${BASE}?dates=${year}&seasontype=${seasontype}&week=${week}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN scoreboard request failed: ${res.status}`)
  const data = await res.json()

  // ESPN echoes back which season it actually served. Surface any mismatch
  // rather than quietly rendering the wrong year's matchups.
  const returnedYear = data.season?.year ?? null

  return (data.events || []).map((event) => ({
    ...parseEvent(event),
    requestedYear: Number(year),
    returnedYear
  }))
}

/**
 * True when ESPN served a different season than the one requested.
 */
export function seasonMismatch(games) {
  const g = games.find((x) => x.returnedYear != null)
  if (!g) return null
  return g.returnedYear !== g.requestedYear
    ? { requested: g.requestedYear, returned: g.returnedYear }
    : null
}

function parseEvent(event) {
  const comp = event.competitions?.[0] || {}
  const competitors = comp.competitors || []
  const home = competitors.find((c) => c.homeAway === 'home')
  const away = competitors.find((c) => c.homeAway === 'away')
  const broadcast = comp.broadcasts?.[0]?.names?.[0] || comp.broadcast || null
  const venue = comp.venue || {}
  const weather = event.weather
    ? {
        text: event.weather.displayValue,
        tempF: event.weather.temperature,
        conditionId: event.weather.conditionId
      }
    : null

  return {
    id: event.id,
    date: event.date, // ISO string, UTC
    status: comp.status?.type?.state, // 'pre' | 'in' | 'post'
    statusDetail: comp.status?.type?.shortDetail,
    venue: venue.fullName || null,
    city: venue.address?.city || null,
    state: venue.address?.state || null,
    broadcast,
    weather,
    home: home
      ? {
          abbreviation: home.team.abbreviation,
          displayName: home.team.displayName,
          logo: home.team.logo,
          score: home.score != null ? Number(home.score) : null,
          winner: !!home.winner
        }
      : null,
    away: away
      ? {
          abbreviation: away.team.abbreviation,
          displayName: away.team.displayName,
          logo: away.team.logo,
          score: away.score != null ? Number(away.score) : null,
          winner: !!away.winner
        }
      : null
  }
}


/**
 * ESPN's own idea of the current week, with no week parameter supplied.
 * Returns { week, year, seasontype } or null if the request fails.
 */
export async function fetchCurrentScoreboard() {
  try {
    const res = await fetch(BASE)
    if (!res.ok) return null
    const data = await res.json()
    return {
      week: data.week?.number ?? null,
      year: data.season?.year ?? null,
      seasontype: data.season?.type ?? null,
      games: (data.events || []).map(parseEvent)
    }
  } catch {
    return null
  }
}

/**
 * 2am on the Wednesday following a given date, in the viewer's local time.
 * Monday night games finish late, so Tuesday is left alone for reviewing the
 * week that just ended; the board turns over early Wednesday morning.
 */
export function rolloverAfter(date) {
  const d = new Date(date)
  const out = new Date(d)
  out.setHours(2, 0, 0, 0)
  // 0 = Sunday ... 3 = Wednesday
  const daysUntilWed = (3 - out.getDay() + 7) % 7
  out.setDate(out.getDate() + daysUntilWed)
  // If that lands at or before the game itself, push a week.
  if (out <= d) out.setDate(out.getDate() + 7)
  return out
}

/**
 * Which week the board should show right now.
 *
 * ESPN usually rolls its scoreboard over on Tuesday, which is a day earlier
 * than we want. So: take ESPN's week, look at the previous week's last
 * kickoff, and stay on that previous week until 2am Wednesday local time.
 *
 * Falls back to `fallbackWeek` (the value stored in Setup) if ESPN is
 * unreachable, so the page still works offline.
 */
export async function resolveCurrentWeek(seasonYear, fallbackWeek = 1) {
  const now = new Date()
  const current = await fetchCurrentScoreboard()
  if (!current || current.week == null) return fallbackWeek

  // Preseason -> week 1; postseason -> week 18.
  if (current.seasontype === 1) return 1
  if (current.seasontype && current.seasontype > 2) return 18
  // A different season than the one being viewed: don't guess.
  if (current.year && seasonYear && Number(current.year) !== Number(seasonYear)) {
    return fallbackWeek
  }

  const espnWeek = Math.min(Math.max(current.week, 1), 18)
  if (espnWeek <= 1) return 1

  const prev = await fetchWeekScoreboard(espnWeek - 1, seasonYear).catch(() => [])
  if (!prev.length) return espnWeek

  const lastKickoff = prev
    .map((g) => new Date(g.date))
    .sort((a, b) => b - a)[0]
  if (!lastKickoff || Number.isNaN(lastKickoff.getTime())) return espnWeek

  return now < rolloverAfter(lastKickoff) ? espnWeek - 1 : espnWeek
}
