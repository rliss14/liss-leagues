import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import MatchupTracker from './pages/MatchupTracker'
import LiveTracker from './pages/LiveTracker'
import RecordBook from './pages/RecordBook'
import SeasonAwards from './pages/SeasonAwards'
import AllTime from './pages/AllTime'
import DataEntry from './pages/DataEntry'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<MatchupTracker />} />
            <Route path="/live" element={<LiveTracker />} />
            <Route path="/records" element={<RecordBook />} />
            <Route path="/awards" element={<SeasonAwards />} />
            <Route path="/all-time" element={<AllTime />} />
            <Route path="/setup" element={<DataEntry />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
