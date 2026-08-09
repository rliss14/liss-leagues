import { createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import Nav from './Nav'

const PoolContext = createContext(null)

export function usePool() {
  const pool = useContext(PoolContext)
  if (!pool) throw new Error('usePool must be used inside a PoolLayout')
  return pool
}

export default function PoolLayout({ pool }) {
  return (
    <PoolContext.Provider value={pool}>
      <div className="min-h-screen">
        <Nav pool={pool} />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </PoolContext.Provider>
  )
}
