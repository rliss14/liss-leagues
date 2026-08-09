import { AWARD_PAYOUT, GAMES_PER_SEASON } from '../lib/awards'
import { money } from '../lib/format'
import { usePool } from '../components/PoolLayout'

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">{title}</h2>
      {children}
    </section>
  )
}

function Rule({ children }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed">
      <span className="text-mustard/50 shrink-0 mt-[3px]">▸</span>
      <span className="text-chalk/85">{children}</span>
    </li>
  )
}

export default function Rules() {
  const pool = usePool()
  const { entry, target } = pool
  const basePot = entry.perWeek * 32

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="display text-3xl text-mustard">Rules</h1>
        <p className="text-sm text-chalk/60">{pool.name}</p>
      </div>

      {/* TL;DR */}
      <div className="felt-panel rounded-xl p-5 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-mustard/70 font-semibold">
          The short version
        </div>
        <p className="text-base text-chalk/90 leading-relaxed">
          You're assigned a different NFL team every week. If that team finishes with exactly{' '}
          <span className="font-mono text-mustard font-bold">{target}</span> points, you win the pot.
        </p>
        <p className="text-xs text-chalk/50">
          No skill required. Pure luck.
        </p>
      </div>

      {/* Entry fee breakdown */}
      <Section title="Entry Fee">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="stat-card p-4">
            <div className="font-mono text-3xl text-mustard font-bold">{money(entry.total)}</div>
            <div className="text-[11px] uppercase tracking-wider text-chalk/50">Total entry</div>
          </div>
          <div className="stat-card p-4">
            <div className="font-mono text-3xl text-chalk/90 font-bold">{money(entry.weekly)}</div>
            <div className="text-[11px] uppercase tracking-wider text-chalk/50">
              Weekly pots — ${entry.perWeek} × 18 weeks
            </div>
          </div>
          <div className="stat-card p-4">
            <div className="font-mono text-3xl text-chalk/90 font-bold">{money(entry.other)}</div>
            <div className="text-[11px] uppercase tracking-wider text-chalk/50">{entry.otherLabel}</div>
          </div>
        </div>
      </Section>

      {/* Weekly rules */}
      <Section title="Weekly Rules">
        <ul className="space-y-2">
          <Rule>Maximum of 32 members — one for each NFL team.</Rule>
          <Rule>
            You get a different NFL team each week. All assignments are drawn at random before the
            season starts.
          </Rule>
          <Rule>
            If your team for that week finishes with a final score of exactly{' '}
            <span className="font-mono text-mustard font-semibold">{target}</span> points, you win
            the pot.
          </Rule>
          <Rule>If more than one team scores {target} in the same week, the pot is split evenly.</Rule>
          <Rule>If nobody scores {target}, the pot carries over to the following week.</Rule>
          <Rule>After a week is won, the next week resets to the base pot.</Rule>
          <Rule>
            Every NFL team has a bye, so every member has one too. That's{' '}
            <span className="font-semibold text-chalk">{GAMES_PER_SEASON} weeks</span> where you can
            win and one where you can't.
          </Rule>
        </ul>
      </Section>

      {/* Weekly payouts */}
      <Section title="Weekly Payouts">
        <ul className="space-y-2">
          <Rule>
            Base pot is <span className="font-mono text-mustard font-semibold">{money(basePot)}</span>{' '}
            per week — ${entry.perWeek} × 32 members.
          </Rule>
          <Rule>The winner takes the entire pot, including any carryover.</Rule>
          <Rule>Multiple winners in a week split it evenly.</Rule>
        </ul>

        <div className="stat-card p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-mustard/70 font-semibold">
            Carryover example
          </div>
          <p className="text-sm text-chalk/80 leading-relaxed">
            No team hits {target} in weeks 1 through 4. Week 5's pot is{' '}
            <span className="font-mono text-mustard font-bold">{money(basePot * 5)}</span> —{' '}
            {money(basePot * 4)} carried over from the first four weeks, plus {money(basePot)} for
            week 5.
          </p>
        </div>

        {pool.week18Guarantee ? (
          <div className="rounded-lg border border-mustard/40 bg-mustard/10 p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-mustard font-semibold">
              Week 18 always pays
            </div>
            <p className="text-sm text-chalk/85 leading-relaxed">
              Nothing carries into the next season, so week 18 has a winner no matter what. If no
              team lands on {target}, the pot goes to whoever finishes closest. Above or below
              doesn't matter — a team at {target - 1} and a team at {target + 1} are equally close,
              and would tie and split. Any tie splits evenly.
            </p>
            <p className="text-xs text-chalk/50 pt-1">
              These show up in the Winners table tagged <span className="font-mono">Wk18</span>{' '}
              rather than <span className="font-mono">{target}</span>, so they count toward money
              won without counting as a career hit.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-mustard/40 bg-mustard/10 p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-mustard font-semibold">
              Week 18 has no guaranteed winner
            </div>
            <p className="text-sm text-chalk/85 leading-relaxed">
              Week 18 works like every other week: a team has to land on exactly {target} to win.
              If nobody does, the remaining pot isn't paid out and isn't carried into next season —
              it goes toward the Super Bowl squares board instead.
            </p>
          </div>
        )}

      </Section>

      {/* Season-end money */}
      {pool.hasSeasonAwards && (
        <Section title="Season Awards">
          <p className="text-sm text-chalk/70 leading-relaxed">
            Every week, your differential is how far your team's score landed from {target} — above
            or below, it counts the same. Those add up across the season.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="stat-card p-4 space-y-1">
              <div className="text-mustard text-xs font-semibold uppercase tracking-wider">
                Most Consistent
              </div>
              <div className="font-mono text-2xl text-mustard font-bold">
                {money(AWARD_PAYOUT.best)}
              </div>
              <div className="text-xs text-chalk/60">Lowest cumulative differential.</div>
            </div>
            <div className="stat-card p-4 space-y-1">
              <div className="text-brick-light text-xs font-semibold uppercase tracking-wider">
                Least Consistent
              </div>
              <div className="font-mono text-2xl text-brick-light font-bold">
                {money(AWARD_PAYOUT.worst)}
              </div>
              <div className="text-xs text-chalk/60">
                Highest cumulative differential. {money(AWARD_PAYOUT.best)} less the $
                {pool.websiteFee} website fee.
              </div>
            </div>
          </div>

          <ul className="space-y-2">
            <Rule>
              No ties on season awards. The tiebreaker is the lower or higher differential in week
              18. Still tied, it goes back to week 17, then week 16, and so on.
            </Rule>
            <Rule>
              Running differentials are on the{' '}
              <span className="text-mustard">Live Season Tracker</span> during the season, and
              finalized on the <span className="text-mustard">Season Awards</span> page once it
              closes.
            </Rule>
          </ul>
        </Section>
      )}

      <div className="pt-4 border-t border-mustard/15 text-sm text-chalk/60">
        Good luck to everyone.
        <div className="pt-1 text-chalk/40">— {pool.signature}</div>
      </div>
    </div>
  )
}
