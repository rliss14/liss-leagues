// Thin wrapper around ESPN's free, unofficial public scoreboard endpoint.
// No API key required. Docs are unofficial/community-reverse-engineered;
// the shape below reflects the current live response as of 2026.

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'

/**
 * Fetch one NFL week's scoreboard (regular season by default).
 * @param {number} week 1-18
 * @param {number} year e.g. 2026
 * @param {number} seasontype 1=pre, 2=regular, 3=post
 */
export async function fetchWeekScoreboard(week, year, seasontype = 2) {
  const url = `${BASE}?week=${week}&year=${year}&seasontype=${seasontype}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN scoreboard request failed: ${res.status}`)
  const data = await res.json()
  return (data.events || []).map(parseEvent)
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
