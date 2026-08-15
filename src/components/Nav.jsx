import { NavLink, Link } from 'react-router-dom'

// Every tab a pool can have. `flag` gates a tab on pool config; anything
// listed in pool.hiddenTabs stays routable but unlinked.
const ALL_TABS = [
  { slug: '', label: 'Matchups', end: true },
  { slug: 'live', label: 'Live Season', flag: 'hasLiveTracker' },
  { slug: 'teams', label: 'Team Grid' },
  { slug: 'winners', label: 'Winners' },
  { slug: 'awards', label: 'Season Awards', flag: 'hasSeasonAwards' },
  { slug: 'record-book', label: 'Record Book' },
  { slug: 'squares', label: 'Squares', flag: 'hasSquares' },
  { slug: 'rules', label: 'Rules' }
  // Setup is deliberately absent — reach it at <pool>/setup directly.
]

export default function Nav({ pool }) {
  // A pool can define its own tab list (the fantasy league does); otherwise
  // fall back to the standard point-pool tabs, filtered by feature flags.
  const source = pool.tabs || ALL_TABS
  const tabs = source.filter(
    (t) => (!t.flag || pool[t.flag]) && !pool.hiddenTabs.includes(t.slug)
  )

  return (
    <nav className="felt-panel sticky top-0 z-20 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/" className="wordmark text-2xl text-mustard shrink-0">
          Liss Leagues
        </Link>
        <span className="text-chalk/30 hidden sm:inline">/</span>
        <span className="font-mono text-sm text-chalk/60 shrink-0">{pool.shortName}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
          {tabs.map((t) => (
            <NavLink
              key={t.slug}
              to={t.slug ? `${pool.basePath}/${t.slug}` : pool.basePath}
              end={t.end}
              className={({ isActive }) =>
                isActive
                  ? 'text-mustard border-b-2 border-mustard pb-0.5'
                  : 'text-chalk/70 hover:text-mustard pb-0.5 border-b-2 border-transparent'
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
