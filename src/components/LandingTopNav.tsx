import { NavLink } from 'react-router-dom'
import { ProfileMenu } from './ProfileMenu'
import { useAuth } from '../context/AuthProvider'

const NAV_LINKS: { label: string; to: string }[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Why Us', to: '/why-us' },
  { label: 'Reviews', to: '/reviews' },
  { label: 'Contact', to: '/contact' },
  { label: 'Dashboard', to: '/dashboard' },
]

function navLinkClass(isActive: boolean) {
  return [
    'text-[0.8125rem] font-semibold sm:text-sm rounded-md px-1 py-0.5 transition-colors',
    isActive
      ? 'text-[#2c2825] dark:text-[#faf9f7]'
      : 'landing-top-nav-link',
  ].join(' ')
}

export function LandingTopNav() {
  const { user, ready } = useAuth()

  return (
    <header className="app-shell-header">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [
              'app-shell-brand onboarding-serif shrink-0 text-xl sm:text-[1.35rem]',
              isActive ? '' : 'opacity-90',
            ].join(' ')
          }
        >
          ProEdge
        </NavLink>
        <div className="flex flex-col gap-4 sm:flex-1 lg:flex-row lg:items-center lg:justify-end lg:gap-8">
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end"
          >
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {ready && user ? (
              <ProfileMenu variant="landing" />
            ) : ready ? (
              <>
                <NavLink
                  to="/login"
                  className="landing-top-nav-link rounded-full border border-transparent px-2 py-1.5 text-[0.8125rem] font-semibold sm:text-sm"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="rounded-full bg-[#5f7f6a] px-4 py-1.5 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-[#536b5d] sm:text-sm"
                >
                  Sign up
                </NavLink>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
