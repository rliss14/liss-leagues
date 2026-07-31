import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import PoolsLanding from './pages/PoolsLanding'
import MatchupTracker from './pages/MatchupTracker'
import LiveTracker from './pages/LiveTracker'
import TeamGrid from './pages/TeamGrid'
import Winners from './pages/Winners'
import SeasonAwards from './pages/SeasonAwards'
import RecordBook from './pages/RecordBook'
import Rules from './pages/Rules'
import DataEntry from './pages/DataEntry'
import PasscodeGate from './components/PasscodeGate'

function PoolLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

// Netlify serves paths case-sensitively, so /nfl33 would 404 without this.
function CaseRedirect() {
  const { pathname } = useLocation()
  const fixed = pathname.replace(/^\/nfl33/i, '/NFL33')
  return <Navigate to={fixed} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PoolsLanding />} />
        <Route path="/NFL33" element={<PoolLayout><MatchupTracker /></PoolLayout>} />
        <Route path="/NFL33/live" element={<PoolLayout><LiveTracker /></PoolLayout>} />
        <Route path="/NFL33/teams" element={<PoolLayout><TeamGrid /></PoolLayout>} />
        <Route path="/NFL33/winners" element={<PoolLayout><Winners /></PoolLayout>} />
        <Route path="/NFL33/awards" element={<PoolLayout><SeasonAwards /></PoolLayout>} />
        <Route path="/NFL33/record-book" element={<PoolLayout><RecordBook /></PoolLayout>} />
        <Route path="/NFL33/rules" element={<PoolLayout><Rules /></PoolLayout>} />
        <Route
          path="/NFL33/setup"
          element={
            <PoolLayout>
              <PasscodeGate>
                <DataEntry />
              </PasscodeGate>
            </PoolLayout>
          }
        />
        <Route path="/nfl33/*" element={<CaseRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
