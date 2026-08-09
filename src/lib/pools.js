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
    blurb: 'Same format, different number. Leftovers fund Super Bowl squares.',
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

export const POOL_LIST = Object.values(POOLS)

// Tiles shown on the landing page, including ones not built yet.
export const COMING_SOON = [
  { name: 'Golf Pool', badge: '⛳', blurb: 'Roster of golfers, best N scores count toward your total.' }
]

export function getPool(id) {
  return POOLS[id] || null
}
