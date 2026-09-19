import { useEffect, useState, type FormEvent } from 'react'
import { DEMO_ACCOUNT } from '../lib/auth'
import { useAuth } from '../state/AuthProvider'

type Mode = 'login' | 'register'

export function LoginModal({
  open,
  onClose,
  initialMode = 'login',
}: {
  open: boolean
  onClose: () => void
  initialMode?: Mode
}) {
  const { login, register, loginDemo } = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setError(null)
    }
  }, [open, initialMode])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const err =
      mode === 'login'
        ? await login(email, password)
        : await register(email, password, displayName || undefined)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    onClose()
    setPassword('')
  }

  const tryDemo = async () => {
    setError(null)
    setBusy(true)
    const err = await loginDemo()
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-[0_24px_80px_rgba(21,23,26,0.18)]">
        <h2 id="login-title" className="font-display text-2xl tracking-tight text-ink">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Your health logs and journals stay on this device, scoped to your account.
        </p>

        <div className="mt-5 flex gap-2 rounded-full bg-bg p-1">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-sm transition ${
              mode === 'login' ? 'bg-white shadow-sm text-ink' : 'text-muted'
            }`}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-sm transition ${
              mode === 'register' ? 'bg-white shadow-sm text-ink' : 'text-muted'
            }`}
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Register
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === 'register' ? (
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Display name
              </span>
              <input
                className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none ring-ai/30 focus:ring-2"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex"
                autoComplete="name"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Email</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none ring-ai/30 focus:ring-2"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Password
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none ring-ai/30 focus:ring-2"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {error ? (
            <p className="rounded-xl bg-elevated/10 px-3 py-2 text-sm text-elevated" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-5 border-t border-border pt-5">
          <button
            type="button"
            className="w-full rounded-xl border border-border bg-bg py-2.5 text-sm text-ink transition hover:bg-white disabled:opacity-60"
            disabled={busy}
            onClick={tryDemo}
          >
            Continue as demo
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {DEMO_ACCOUNT.email} · password{' '}
            <span className="font-mono">{DEMO_ACCOUNT.password}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function SignInPrompt({
  onSignIn,
  onDemo,
}: {
  onSignIn: () => void
  onDemo?: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
      <p className="font-display text-2xl text-ink">Your personal baseline</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        Sign in to save health logs, voice journals, and stress signals under your own profile.
        Data is stored locally in your browser — not on our servers.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button type="button" className="btn-primary" onClick={onSignIn}>
          Sign in to track
        </button>
        {onDemo ? (
          <button
            type="button"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition hover:text-ink"
            onClick={onDemo}
          >
            Try demo account
          </button>
        ) : null}
      </div>
    </div>
  )
}
