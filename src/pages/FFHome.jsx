import { useEffect, useMemo, useState } from 'react'
import { getFFStandings, getFFPlayoffs } from '../lib/ffQueries'
import {
  champions,
  seasonLabel,
  memberSummaries,
  pointsChampions,
  MEDALS,
  MEDAL_TITLES,
  POINTS_CROWN,
  POINTS_CROWN_TITLE
} from '../lib/ffStats'
import { usePool } from '../components/PoolLayout'


export default function FFHome() {
  const league = usePool()
  const [standings, setStandings] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    getFFStandings(league.id).then(setStandings).catch((e) => setErr(e.message))
    getFFPlayoffs(league.id).then(setPlayoffs).catch((e) => setErr(e.message))
  }, [league.id])

  const champs = useMemo(() => champions(playoffs), [playoffs])
  const scoringTitles = useMemo(() => pointsChampions(standings), [standings])

  // Podium counts drive the trophy case: every member who has finished top three.
  const podium = useMemo(
    () =>
      standings.length
        ? memberSummaries(standings, playoffs, league)
            .filter((m) => m.titles || m.runnerUps || m.thirds || m.pointsTitles)
            .sort(
              (a, b) =>
                b.titles - a.titles ||
                b.runnerUps - a.runnerUps ||
                b.thirds - a.thirds ||
                b.pointsTitles - a.pointsTitles
            )
        : [],
    [standings, playoffs]
  )

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="display text-2xl sm:text-3xl text-mustard leading-tight">
          {league.name}
        </h1>
        <p className="text-sm text-chalk/60">
          {league.shortName} · Est. {league.founded} · Commissioner {league.commissioner} · Playing
          for the {league.trophyName}
        </p>
      </header>

      {err && <div className="text-brick-light">{err}</div>}

      {/* Champions */}
      <section className="space-y-3">
        <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">
          Trophy Winners
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {champs.map((c) => (
            <div key={c.season} className="felt-panel rounded-xl p-4 flex items-center gap-4">
              <div className="text-4xl shrink-0">🏆</div>
              <div className="min-w-0">
                <div className="font-mono text-xs text-mustard/70">{seasonLabel(c.season, league)}</div>
                <div className="display text-xl text-chalk">{c.champion}</div>
                <div className="text-xs text-chalk/55">
                  def. {c.runnerUp} · {c.championScore.toFixed(2)}–{c.runnerUpScore.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {champs.length === 0 && (
          <div className="felt-panel rounded-xl p-6 text-center text-chalk/50">
            No championship results loaded yet.
          </div>
        )}
      </section>

      {/* Scoring titles */}
      {scoringTitles.length > 0 && (
        <section className="space-y-3">
          <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">
            Scoring Titles
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {scoringTitles.map((p) => (
              <div
                key={p.season}
                className="stat-card px-3 py-2 flex items-center justify-between gap-3"
              >
                <span className="text-sm">
                  <span className="font-mono text-xs text-mustard/70 mr-2">
                    {seasonLabel(p.season, league)}
                  </span>
                  <span className="text-chalk/85">{p.members.join(' & ')}</span>
                </span>
                <span className="font-mono text-sm text-mustard font-bold whitespace-nowrap">
                  {p.pf.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-chalk/45">
            Most regular-season points. {POINTS_CROWN} marks it elsewhere on the site — it's a
            separate award from the trophy, and usually a different person.
          </p>
        </section>
      )}

      {/* Trophy case */}
      {podium.length > 0 && (
        <section className="space-y-2">
          <h2 className="display text-xl text-mustard border-b border-mustard/20 pb-1">
            Trophy Case
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {podium.map((m) => (
              <div
                key={m.member}
                className="stat-card px-3 py-2 flex items-center justify-between gap-3"
              >
                <span className="text-sm text-chalk/85">{m.member}</span>
                <span className="text-sm whitespace-nowrap">
                  {m.titles > 0 && <span title={MEDAL_TITLES[1]}>{MEDALS[1].repeat(m.titles)}</span>}
                  {m.runnerUps > 0 && (
                    <span title={MEDAL_TITLES[2]}>{MEDALS[2].repeat(m.runnerUps)}</span>
                  )}
                  {m.thirds > 0 && <span title={MEDAL_TITLES[3]}>{MEDALS[3].repeat(m.thirds)}</span>}
                  {m.pointsTitles > 0 && (
                    <span title={POINTS_CROWN_TITLE}>{POINTS_CROWN.repeat(m.pointsTitles)}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-chalk/45">
            {champs.length} seasons, {new Set(champs.map((c) => c.champion)).size} different
            champions — nobody has repeated.
          </p>
        </section>
      )}

    </div>
  )
}
