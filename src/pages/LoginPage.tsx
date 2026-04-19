import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LandingTopNav } from '../components/LandingTopNav'
import { PasswordInput } from '../components/PasswordInput'
import { getStoredRememberPreference, useAuth } from '../context/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => getStoredRememberPreference())
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email, password, rememberMe)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="onboarding-shell landing-hero-shell relative flex min-h-dvh flex-col">
      <LandingTopNav />
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        <div className="landing-orb landing-orb--a absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="landing-orb landing-orb--b absolute -left-20 top-[32%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
        <div className="landing-orb landing-orb--c absolute bottom-[5%] left-[15%] h-72 w-72 rounded-full bg-[#c9b8e8]/28 blur-[80px]" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <p className="onboarding-serif text-center text-2xl font-semibold tracking-tight text-[#2c2825] dark:text-[#fafaf8]">
          Log in
        </p>
        <p className="mt-2 text-center text-sm text-[#7a6e66] dark:text-[#ddd8d0]">
          Welcome back — continue your MCAT prep.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col gap-4 rounded-2xl border border-[#e8dfd4] bg-white/80 p-6 shadow-[0_12px_40px_-20px_rgba(62,47,35,0.15)] dark:border-[#3a3836] dark:bg-[#232220]/90 dark:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.45)]"
        >
          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#3d3835] dark:text-[#f4f3f0]">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="onboarding-input font-normal"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#3d3835] dark:text-[#f4f3f0]">
            Password
            <PasswordInput
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-[#5f7f6a] dark:text-[#c8dccf]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-[#e8dfd4] text-[#5f7f6a] focus:ring-[#5f7f6a]"
            />
            <span className="leading-snug">
              Keep me signed in on this browser — your account stays saved and you can log in
              anytime with email and password.
            </span>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="landing-hero-cta mt-2 inline-flex w-full justify-center rounded-full bg-[#5f7f6a] py-2.5 text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(95,127,106,0.55)] transition-colors hover:bg-[#536b5d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#7a6e66] dark:text-[#ddd8d0]">
          No account?{' '}
          <Link to="/signup" className="font-semibold text-[#5f7f6a] underline-offset-2 hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="font-medium text-[#5f7f6a] underline-offset-2 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
