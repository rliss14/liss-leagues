import { NavLink, Link } from 'react-router-dom'

const POOL_LINKS = [
  { to: '/NFL33', label: 'Matchups', end: true },
  { to: '/NFL33/live', label: 'Live Season' },
  { to: '/NFL33/teams', label: 'Team Grid' },
  { to: '/NFL33/winners', label: 'Winners' },
  { to: '/NFL33/awards', label: 'Season Awards' },
  { to: '/NFL33/record-book', label: 'Record Book' },
  { to: '/NFL33/rules', label: 'Rules' }
  // Setup is deliberately unlinked — reach it directly at /NFL33/setup
]

export default function Nav() {
  return (
    <nav className="felt-panel sticky top-0 z-20 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/" className="wordmark text-2xl text-mustard shrink-0">
          Liss Leagues
        </Link>
        <span className="text-chalk/30 hidden sm:inline">/</span>
        <span className="font-mono text-sm text-chalk/60 shrink-0">NFL33</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
          {POOL_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                isActive
                  ? 'text-mustard border-b-2 border-mustard pb-0.5'
                  : 'text-chalk/70 hover:text-mustard pb-0.5 border-b-2 border-transparent'
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
