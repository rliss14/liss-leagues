// Per-pool configuration. Everything that differs between pools lives here so
// the pages themselves stay generic.
export const POOLS = {
  NFL33: {
    id: 'NFL33',
    name: 'NFL 33 Point Pool',
    shortName: 'NFL33',
    target: 33,
    basePath: '/NFL33',
    badge: '33',
    blurb: 'One team per member, every week. Land on 33 and get paid.',
    live: true,
    entry: { total: 100, weekly: 90, perWeek: 5, other: 10, otherLabel: 'Season awards' },
    // Feature flags
    hasSeasonAwards: true,
    hasLiveTracker: true,
    hasSquares: false,
    week18Guarantee: true,
    websiteFee: 20,
    signature: 'Ryan',
    // Tabs hidden from the nav but still reachable by URL
    hiddenTabs: []
  },
  NFL25: {
    id: 'NFL25',
    name: 'NFL 25 Point Pool',
    shortName: 'NFL25',
    target: 25,
    basePath: '/NFL25',
    badge: '25',
    blurb: 'One team per member, every week. Land on 25 and get paid.',
    live: true,
    entry: { total: 100, weekly: 90, perWeek: 5, other: 10, otherLabel: 'Super Bowl squares' },
    hasSeasonAwards: false,
    hasLiveTracker: false,
    hasSquares: true,
    week18Guarantee: false,
    websiteFee: 0,
    signature: 'John',
    squaresRules: {
      reserve: 320,          // $10 per member, set aside at entry
      squaresPerMember: 3,
      xSquares: 4,           // 100 - (32 members x 3)
      quarters: 4,
      // Points added to BOTH scores when a winning square is an X.
      xFactor: [
        { label: '1st quarter', add: 1 },
        { label: '2nd quarter', add: 2 },
        { label: '3rd quarter', add: 3 },
        { label: 'Final score', add: 4 }
      ]
    },
    // No history yet, so these stay unlinked until there's data to show.
    hiddenTabs: ['winners', 'record-book', 'squares']
  }
}

// Fantasy leagues aren't point pools — different data, different tabs.
const FANTASY_TABS = [
  { slug: '', label: 'League', end: true },
  { slug: 'seasons', label: 'Seasons' },
  { slug: 'records', label: 'Record Book' },
  { slug: 'members', label: 'Members' },
  { slug: 'h2h', label: 'Head to Head' }
]

export const FANTASY_LEAGUES = {
  EALFFL: {
    id: 'EALFFL',
    name: 'Edward A. Liss Fantasy Football League',
    shortName: 'EALFFL',
    basePath: '/EALFFL',
    badge: '🏆',
    blurb: 'Twelve managers. One Edward A. Liss Memorial Trophy.',
    trophyName: 'Edward A. Liss Memorial Trophy',
    commissioner: 'Ryan',
    founded: 2022,
    live: true,
    isFantasy: true,
    hiddenTabs: [],
    tabs: FANTASY_TABS,
    // 2022 playoff rounds ran two weeks each.
    twoWeekPlayoffSeasons: [2022]
  },
  MFFL: {
    id: 'MFFL',
    name: 'Manteno Fantasy Football League',
    shortName: 'MFFL',
    basePath: '/MFFL',
    badge: '🏈',
    blurb: 'Running since 2011. The league with actual history.',
    trophyName: 'MFFL Championship',
    commissioner: 'Jack',
    founded: 2011,
    live: true,
    isFantasy: true,
    hiddenTabs: [],
    tabs: FANTASY_TABS,
    twoWeekPlayoffSeasons: []
  }
}

export const FANTASY_LIST = Object.values(FANTASY_LEAGUES)

export const POOL_LIST = Object.values(POOLS)
export const ALL_POOLS = [...POOL_LIST, ...FANTASY_LIST]

// Tiles shown on the landing page, including ones not built yet.
export const COMING_SOON = [
  { name: 'Golf Pool', badge: '⛳', blurb: 'Roster of golfers, best N scores count toward your total.' }
]

export function getPool(id) {
  return POOLS[id] || null
}
