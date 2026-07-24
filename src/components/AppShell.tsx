import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/useAuth'

export type AppNavKey =
  | 'dashboard'
  | 'calendar'
  | 'analytics'
  | 'study-plan'
  | 'diagnostic'

const NAV_ITEMS: { key: AppNavKey; label: string; path: string }[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'calendar', label: 'Calendar', path: '/calendar' },
  { key: 'analytics', label: 'AI analytics', path: '/analytics' },
  { key: 'study-plan', label: 'Study plan', path: '/study-plan' },
  { key: 'diagnostic', label: 'Retake diagnostic', path: '/diagnostics/test' },
]

const linkClass =
  'rounded-full px-2.5 py-1 text-xs font-medium text-[#2c2825] transition hover:bg-white/40 sm:px-3'
const activeClass =
  'rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1a1816] shadow-sm sm:px-3'

export function AppTopBar({ active }: { active: AppNavKey }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-white/45 px-4 py-1 shadow-[0_8px_32px_rgba(31,38,135,0.06)] backdrop-blur-2xl sm:px-6 supports-[backdrop-filter]:bg-white/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1.5 px-2 sm:flex-row sm:justify-between sm:px-0">
        <span className="text-base font-bold tracking-tight text-[#1a1816]">
          ProEdge
        </span>
        <nav
          aria-label="Main"
          className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full border border-white/50 bg-white/50 p-0.5 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-2xl sm:gap-0.5"
        >
          {NAV_ITEMS.map((item) =>
            item.key === active ? (
              <span key={item.key} className={activeClass}>
                {item.label}
              </span>
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className={linkClass}
              >
                {item.label}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className={linkClass}
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  )
}

/** Shared page shell: pastel mesh + frosted top bar. */
export function AppShell({
  active,
  children,
  className = '',
}: {
  active: AppNavKey
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`onboarding-shell min-h-dvh !bg-gradient-to-br from-[#c5d9f5] via-[#f0e6f5] to-[#ffe8d6] pb-16 ${className}`}
    >
      <AppTopBar active={active} />
      {children}
    </div>
  )
}
