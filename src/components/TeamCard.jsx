import { teamStatus } from '../lib/scoring'

const STATUS_STYLES = {
  scheduled: 'bg-felt-light/40 text-chalk/70',
  live: 'bg-felt-light/60 text-chalk',
  oneposs: 'bg-brick text-chalk font-bold animate-pulse',
  gold: 'bg-mustard text-felt-dark font-bold',
  hit: 'bg-green-700 text-chalk font-bold',
  closest: 'bg-mustard/80 text-felt-dark font-bold',
  // Final and not a winner: drained of colour so the board reads at a glance.
  busted: 'bg-busted/40 text-chalk/45',
  low: 'bg-busted/40 text-chalk/45'
}

export default function TeamCard({ team, gameStatus, ownerName, isClosest, target }) {
  if (!team) return null
  const status = teamStatus(team.score, gameStatus, target, isClosest)
  const style = STATUS_STYLES[status.key]
  const dimmed = status.key === 'busted' || status.key === 'low'

  return (
    <div className={`rounded-lg px-3 py-2 flex items-center justify-between gap-3 transition-colors ${style}`}>
      <div className="flex items-center gap-2 min-w-0">
        {team.logo && (
          <img src={team.logo} alt="" className={`w-7 h-7 shrink-0 ${dimmed ? 'opacity-40 grayscale' : ''}`} />
        )}
        <div className="min-w-0">
          <div className="font-semibold truncate">{team.displayName}</div>
          {ownerName && <div className="text-xs opacity-80 truncate">{ownerName}</div>}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="font-mono text-lg leading-none">{team.score != null ? team.score : '--'}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">{status.label}</span>
      </div>
    </div>
  )
}
