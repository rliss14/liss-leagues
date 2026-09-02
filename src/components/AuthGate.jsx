import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Real authentication for the Setup screens.
 *
 * This replaces the old passcode, which only hid the UI — the anon key in the
 * shipped bundle still allowed writes. With migration 07, the database itself
 * rejects writes without a signed-in session, so this gate and the data are
 * actually in agreement.
 */
export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn() {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setPassword('')
    setBusy(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (checking) {
    return <div className="text-chalk/60 text-sm p-6 text-center">Checking sign-in…</div>
  }

  if (session) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-chalk/50">
          <span>
            Signed in as <span className="text-chalk/80">{session.user.email}</span>
          </span>
          <button onClick={signOut} className="text-mustard hover:text-mustard-light underline">
            Sign out
          </button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="felt-panel rounded-xl p-6 max-w-sm mx-auto space-y-4">
      <div>
        <div className="display text-xl text-mustard">Sign in</div>
        <p className="text-xs text-chalk/60">Setup is restricted to league admins.</p>
      </div>
      <input
        type="email"
        autoComplete="username"
        className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-3 py-2 text-sm"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        autoComplete="current-password"
        className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-3 py-2 text-sm"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && email && password && signIn()}
      />
      {error && <div className="text-brick-light text-sm">{error}</div>}
      <button
        onClick={signIn}
        disabled={busy || !email || !password}
        className="w-full bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-[11px] text-chalk/40">
        Accounts are created in the Supabase dashboard, not here.
      </p>
    </div>
  )
}
