import { Link } from 'react-router-dom'

const POOLS = [
  {
    name: 'NFL 33 Point Pool',
    path: '/NFL33',
    badge: '33',
    blurb: 'One team per member, every week. Land on 33 and get paid.',
    live: true
  },
  {
    name: 'NFL25',
    path: null,
    badge: '25',
    blurb: 'Same format, different number.',
    live: false
  },
  {
    name: 'Golf Pool',
    path: null,
    badge: '⛳',
    blurb: 'Roster of golfers, best N scores count toward your total.',
    live: false
  }
]

export default function PoolsLanding() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="display text-5xl sm:text-6xl text-mustard">Liss Leagues</h1>
        <p className="text-chalk/60">Pick your pool.</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-3">
        {POOLS.map((pool) => {
          const card = (
            <div
              className={`felt-panel rounded-2xl p-6 h-full flex flex-col items-center text-center gap-3 transition-transform ${
                pool.live ? 'hover:-translate-y-1 hover:border-mustard/60' : 'opacity-55'
              }`}
            >
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center font-mono text-3xl font-bold ${
                  pool.live
                    ? 'bg-mustard text-felt-dark'
                    : 'bg-felt-light/50 text-chalk/50 border border-dashed border-mustard/30'
                }`}
              >
                {pool.badge}
              </div>
              <div className="display text-lg">{pool.name}</div>
              <p className="text-xs text-chalk/60 leading-relaxed">{pool.blurb}</p>
              <span
                className={`mt-auto text-[11px] uppercase tracking-widest font-semibold ${
                  pool.live ? 'text-green-400' : 'text-chalk/40'
                }`}
              >
                {pool.live ? 'Enter →' : 'Coming Soon'}
              </span>
            </div>
          )

          return pool.live ? (
            <Link key={pool.name} to={pool.path}>{card}</Link>
          ) : (
            <div key={pool.name} className="cursor-default">{card}</div>
          )
        })}
      </div>
    </div>
  )
}
