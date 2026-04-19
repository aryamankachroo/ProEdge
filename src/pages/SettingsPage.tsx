import { useNavigate } from 'react-router-dom'
import { LandingTopNav } from '../components/LandingTopNav'
import { useAuth } from '../context/AuthProvider'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="onboarding-shell landing-hero-shell relative flex min-h-dvh flex-col">
      <LandingTopNav />
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        <div className="landing-orb landing-orb--a absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="landing-orb landing-orb--b absolute -left-20 top-[32%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-6 pb-16 pt-10">
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] dark:text-[#fafaf8]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-[#7a6e66] dark:text-[#ddd8d0]">
          Manage your account and session.
        </p>

        <section className="mt-10 rounded-2xl border border-[#e8dfd4] bg-white/80 p-6 dark:border-[#3a3836] dark:bg-[#232220]/90">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9a8f86] dark:text-[#d4cec5]">
            Account
          </h2>
          <p className="mt-4 text-sm font-medium text-[#3d3835] dark:text-[#f4f3f0]">Email</p>
          <p className="mt-1 text-sm text-[#7a6e66] dark:text-[#ddd8d0]">{user?.email ?? '—'}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e8dfd4] bg-white/80 p-6 dark:border-[#3a3836] dark:bg-[#232220]/90">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9a8f86] dark:text-[#d4cec5]">
            Session
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#7a6e66] dark:text-[#ddd8d0]">
            Sign out on this device. You can log in again anytime with your email and password.
          </p>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="mt-5 inline-flex rounded-full border border-[#deb8b0] bg-[#fff5f3] px-5 py-2 text-sm font-semibold text-[#943e32] transition hover:border-[#c99a90] hover:bg-[#ffece8] dark:border-[#6b3d35] dark:bg-[#2f2020] dark:text-[#eab4a8] dark:hover:border-[#8a4a40] dark:hover:bg-[#3d2420] dark:hover:text-[#fcd5cd]"
          >
            Log out
          </button>
        </section>
      </main>
    </div>
  )
}
