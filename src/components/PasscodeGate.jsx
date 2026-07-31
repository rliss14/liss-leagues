import { useState } from 'react'

const STORAGE_KEY = 'liss-setup-unlocked'

/**
 * Lightweight passcode gate for the Setup screen.
 *
 * Scope note: this keeps casual visitors out of the data-entry UI. It is NOT
 * real security — the Supabase anon key is present in the shipped bundle, so
 * anyone determined can write to the tables directly. Supabase Auth plus
 * row-level security is the actual fix when it's wanted.
 */
export default function PasscodeGate({ children }) {
  const expected = import.meta.env.VITE_SETUP_PASSCODE
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === 'yes'
  )
  const [entry, setEntry] = useState('')
  const [error, setError] = useState(false)

  if (!expected) {
    return (
      <div className="felt-panel rounded-xl p-6 max-w-md mx-auto space-y-2 text-sm">
        <div className="display text-lg text-brick-light">Setup Locked</div>
        <p className="text-chalk/70">
          No passcode is configured, so Setup is closed. Add an environment variable named{' '}
          <code className="font-mono text-mustard">VITE_SETUP_PASSCODE</code> in Netlify, then
          redeploy.
        </p>
      </div>
    )
  }

  if (unlocked) return children

  function submit() {
    if (entry === expected) {
      sessionStorage.setItem(STORAGE_KEY, 'yes')
      setUnlocked(true)
    } else {
      setError(true)
      setEntry('')
    }
  }

  return (
    <div className="felt-panel rounded-xl p-6 max-w-sm mx-auto space-y-4">
      <div>
        <div className="display text-xl text-mustard">Setup</div>
        <p className="text-xs text-chalk/60">Enter the passcode to continue.</p>
      </div>
      <input
        type="password"
        autoFocus
        className="w-full bg-felt-dark/60 border border-mustard/30 rounded px-3 py-2 font-mono text-sm"
        placeholder="Passcode"
        value={entry}
        onChange={(e) => {
          setEntry(e.target.value)
          setError(false)
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <div className="text-brick-light text-sm">Incorrect passcode.</div>}
      <button
        onClick={submit}
        disabled={!entry}
        className="w-full bg-mustard text-felt-dark font-semibold px-4 py-2 rounded-md disabled:opacity-40"
      >
        Unlock
      </button>
      <p className="text-[11px] text-chalk/40">
        Stays unlocked until you close this tab.
      </p>
    </div>
  )
}
