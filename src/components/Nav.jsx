import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Matchup Tracker', end: true },
  { to: '/live', label: 'Live Season Tracker' },
  { to: '/records', label: 'Record Book' },
  { to: '/awards', label: 'Season Awards' },
  { to: '/all-time', label: 'All-Time' },
  { to: '/setup', label: 'Setup' }
]

export default function Nav() {
  return (
    <nav className="felt-panel sticky top-0 z-20 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="font-display text-xl text-mustard tracking-wide">Liss Leagues</span>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-body">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              isActive
                ? 'text-mustard font-semibold border-b-2 border-mustard pb-0.5'
                : 'text-chalk/80 hover:text-mustard pb-0.5'
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
