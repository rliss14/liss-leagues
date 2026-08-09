import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { POOLS, POOL_LIST } from './lib/pools'
import PoolLayout from './components/PoolLayout'
import PoolsLanding from './pages/PoolsLanding'
import MatchupTracker from './pages/MatchupTracker'
import LiveTracker from './pages/LiveTracker'
import TeamGrid from './pages/TeamGrid'
import Winners from './pages/Winners'
import SeasonAwards from './pages/SeasonAwards'
import RecordBook from './pages/RecordBook'
import Rules from './pages/Rules'
import Squares from './pages/Squares'
import DataEntry from './pages/DataEntry'
import PasscodeGate from './components/PasscodeGate'

// Netlify serves paths case-sensitively, so /nfl33 would 404 without this.
function CaseRedirect() {
  const { pathname } = useLocation()
  const fixed = pathname.replace(/^\/nfl(33|25)/i, (_, n) => `/NFL${n}`)
  return <Navigate to={fixed} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PoolsLanding />} />

        {POOL_LIST.map((pool) => (
          <Route key={pool.id} path={pool.basePath} element={<PoolLayout pool={pool} />}>
            <Route index element={<MatchupTracker />} />
            {pool.hasLiveTracker && <Route path="live" element={<LiveTracker />} />}
            <Route path="teams" element={<TeamGrid />} />
            <Route path="winners" element={<Winners />} />
            {pool.hasSeasonAwards && <Route path="awards" element={<SeasonAwards />} />}
            <Route path="record-book" element={<RecordBook />} />
            {pool.hasSquares && <Route path="squares" element={<Squares />} />}
            <Route path="rules" element={<Rules />} />
            <Route
              path="setup"
              element={
                <PasscodeGate>
                  <DataEntry />
                </PasscodeGate>
              }
            />
          </Route>
        ))}

        <Route path="/nfl33/*" element={<CaseRedirect />} />
        <Route path="/nfl25/*" element={<CaseRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
