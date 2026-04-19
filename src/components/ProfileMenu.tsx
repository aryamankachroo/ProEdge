import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

type Props = {
  /** `landing`: pill in marketing header. `shell`: dashboard-style nav chip. */
  variant?: 'landing' | 'shell'
}

export function ProfileMenu({ variant = 'landing' }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  if (!user) return null

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  const triggerClass =
    variant === 'shell'
      ? 'profile-menu-trigger shell-nav-btn inline-flex items-center gap-1.5'
      : [
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition',
          'border-[#e8dfd4] bg-white/90 text-[#2c2825] hover:bg-[#faf7f3]',
          /* Landing trigger — high contrast in dark mode */
          'dark:border-white/25 dark:bg-[#3d4540] dark:text-white dark:hover:bg-[#4a5350]',
          'dark:ring-1 dark:ring-white/15',
        ].join(' ')

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Profile
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0 text-current opacity-90 dark:text-white dark:opacity-100"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className={[
            'absolute right-0 top-[calc(100%+8px)] z-[200] min-w-[14rem] overflow-hidden rounded-xl py-1 shadow-xl',
            'border border-[#e8dfd4] bg-[var(--pe-header-solid)] backdrop-blur-sm',
            /* Panel: lighter charcoal + bright border so content pops */
            'dark:border-white/20 dark:bg-[#2f2e2c] dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.65)]',
          ].join(' ')}
        >
          <div className="border-b border-[#e8dfd4]/90 px-3 py-2.5 dark:border-white/15">
            <p className="truncate text-sm font-semibold text-[#2c2825] dark:text-white">
              {user.email}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9a8f86] dark:text-[#e8e6e3]">
              Signed in
            </p>
          </div>
          <Link
            role="menuitem"
            to="/settings"
            onClick={() => setOpen(false)}
            className={[
              'block px-3 py-2.5 text-sm font-semibold transition',
              'text-[#3d6b4d] hover:bg-black/[0.04] hover:text-[#1a3d28]',
              'dark:bg-transparent dark:text-[#ecfdf5] dark:hover:bg-white/12 dark:hover:text-white',
            ].join(' ')}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={[
              'w-full px-3 py-2.5 text-left text-sm font-semibold transition',
              /* Brownish red — brick / rust tones */
              'text-[#943e32] hover:bg-black/[0.05] hover:text-[#6e2e25]',
              'dark:text-[#eab4a8] dark:hover:bg-[#3d2420]/95 dark:hover:text-[#fcd5cd]',
            ].join(' ')}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}
