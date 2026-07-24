import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'

type Mode = 'login' | 'signup'

function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z"
        stroke="#3D5AFE"
        strokeWidth="1.75"
      />
      <path
        d="m5 7 7 5 7-5"
        stroke="#3D5AFE"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="#3D5AFE"
        strokeWidth="1.75"
      />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="#3D5AFE"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3 5.7 15l-2.7 2.1C4.6 20.3 8 22.2 12 22.2c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-5.9-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3 7c-.6 1.2-1 2.5-1 4s.4 2.8 1 4l3.6-2.8c-.2-.6-.3-1.2-.3-1.2s.1-.6.3-1.2L3 7z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.8 14.7 2 12 2 8 2 4.6 3.9 3 7l3.6 2.8C7 7.3 9.2 5.8 12 5.8z"
      />
    </svg>
  )
}

function SocialCircle({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
    >
      {children}
    </button>
  )
}

export function LoginPage() {
  const { isAuthenticated, login, signup } = useAuth()
  const { profile, setProfile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { tab?: Mode } | null

  const [mode, setMode] = useState<Mode>(
    locationState?.tab === 'signup' ? 'signup' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const afterAuth = (displayName: string) => {
    if (!profile.name.trim() && displayName) {
      setProfile({ name: displayName })
    }
    navigate('/', { replace: true })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session =
        mode === 'login'
          ? await login(email, password)
          : await signup(name, email, password)
      afterAuth(session.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative h-dvh w-full overflow-hidden font-[Poppins,Nunito,system-ui,sans-serif] text-white"
      style={{ fontFamily: 'Poppins, Nunito, system-ui, sans-serif' }}
    >
      {/* Continuous blurred gradient mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[#4a6fd0]" aria-hidden>
        <div className="absolute -left-[10%] -top-[20%] h-[70vmin] w-[70vmin] rounded-full bg-[#7DDFD0] opacity-90 blur-[120px]" />
        <div className="absolute left-[25%] top-[10%] h-[65vmin] w-[65vmin] rounded-full bg-[#5B8DEF] opacity-85 blur-[110px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[75vmin] w-[75vmin] rounded-full bg-[#9B7EDE] opacity-90 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[40%] h-[40vmin] w-[40vmin] rounded-full bg-[#7DDFD0]/70 blur-[100px]" />
        <div className="absolute right-[15%] top-[30%] h-[45vmin] w-[45vmin] rounded-full bg-[#5B8DEF]/60 blur-[90px]" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col lg:flex-row">
        {/* Left — login form */}
        <section className="flex h-full w-full flex-col justify-center border-white/30 bg-white/[0.08] px-6 py-10 backdrop-blur-[20px] sm:px-12 lg:w-[55%] lg:rounded-r-[24px] lg:border-r lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[450px]">
            <Link
              to="/"
              className="mb-6 inline-block text-sm font-medium text-white/70 transition hover:text-white"
            >
              ← ProEdge
            </Link>

            <h1 className="mb-8 text-[2.5rem] font-light leading-none tracking-tight text-white">
              {mode === 'login' ? 'Log in' : 'Sign up'}
            </h1>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <label className="relative block">
                  <span className="sr-only">Name</span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3D5AFE]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
                      <path
                        d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1a1a1a] placeholder:text-[#9ca3af] shadow-sm outline-none ring-0 focus:ring-2 focus:ring-[#3D5AFE]/40"
                  />
                </label>
              )}

              <label className="relative block">
                <span className="sr-only">Email</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <EnvelopeIcon />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1a1a1a] placeholder:text-[#9ca3af] shadow-sm outline-none ring-0 focus:ring-2 focus:ring-[#3D5AFE]/40"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Password</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1a1a1a] placeholder:text-[#9ca3af] shadow-sm outline-none ring-0 focus:ring-2 focus:ring-[#3D5AFE]/40"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-white"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#3D5AFE] py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(61,90,254,0.65)] transition hover:bg-[#2f4aef] disabled:opacity-60"
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/30" />
              <span className="text-xs font-medium text-white/70">or</span>
              <div className="h-px flex-1 bg-white/30" />
            </div>

            <button
              type="button"
              onClick={() =>
                setError('Google sign-in is not wired yet — use email for now.')
              }
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/40 bg-white/5 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="mt-6 text-center text-xs text-white/80">
              Forgot your password?{' '}
              <button
                type="button"
                onClick={() =>
                  setError('Password reset is not available in this demo yet.')
                }
                className="font-semibold text-white underline-offset-2 hover:underline"
              >
                Reset password
              </button>
            </p>

            <p className="mt-4 text-center text-xs text-white/70">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup')
                      setError(null)
                    }}
                    className="font-semibold text-white underline-offset-2 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError(null)
                    }}
                    className="font-semibold text-white underline-offset-2 hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>

        {/* Right — promo card */}
        <section className="hidden h-full w-[45%] items-center justify-center px-8 py-10 lg:flex xl:px-14">
          <div className="flex h-[min(560px,78dvh)] w-full max-w-md flex-col rounded-3xl border border-white/20 bg-white/10 p-7 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl xl:p-8">
            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-md">
              <p className="text-[0.95rem] font-medium leading-snug text-[#5B3FA8]">
                Study smarter, not longer
              </p>
              <p className="text-[0.95rem] font-bold leading-snug text-[#4A2F9B]">
                so every study hour counts.
              </p>
            </div>

            <div className="my-6 h-px w-full bg-white/25" />

            <p className="text-sm font-medium text-white">We offer</p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-white xl:text-2xl">
              Adaptive prep that finds your weak spots.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Our diagnostic pinpoints exactly where you&apos;re losing points —
              Chem, Phys, CARS, Bio, Biochem, Psych or Soc.
            </p>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
              <span className="text-sm text-white/70">Invite your friends</span>
              <div className="flex items-center gap-2">
                <SocialCircle label="Facebook">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
                  </svg>
                </SocialCircle>
                <SocialCircle label="Twitter">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.9 6.3c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.5-1.8-.6.4-1.4.7-2.1.8A3.2 3.2 0 0 0 12 8.8c0 .3 0 .5.1.7-2.7-.1-5-1.4-6.6-3.4-.3.5-.4 1-.4 1.6 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4v.1c0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.2 3 2.3A6.5 6.5 0 0 1 5 17.2c-.3 0-.5 0-.8-.1A9 9 0 0 0 9.1 18c5.1 0 7.9-4.2 7.9-7.9v-.4c.5-.4 1-.9 1.4-1.4z" />
                  </svg>
                </SocialCircle>
                <SocialCircle label="LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM20.3 20h-2.8v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.3-.1.2-.1.5-.1.8V20H11V9.5h2.7v1.4c.4-.7 1.3-1.7 3.2-1.7 2.3 0 4 1.5 4 4.8V20z" />
                  </svg>
                </SocialCircle>
                <SocialCircle label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </SocialCircle>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile promo teaser */}
        <div className="border-t border-white/20 bg-white/[0.06] px-6 py-5 backdrop-blur-xl lg:hidden">
          <p className="text-sm font-semibold text-white">
            Adaptive prep that finds your weak spots.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">
            Diagnostics for Chem, Phys, CARS, Bio, Biochem, Psych &amp; Soc.
          </p>
        </div>
      </div>
    </div>
  )
}
