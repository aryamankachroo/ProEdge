import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden font-[Poppins,Nunito,system-ui,sans-serif]">
      {/* Same mint / blue / purple mesh as login */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#4a6fd0]"
        aria-hidden
      >
        <div className="absolute -left-[10%] -top-[20%] h-[70vmin] w-[70vmin] rounded-full bg-[#7DDFD0] opacity-90 blur-[120px]" />
        <div className="absolute left-[25%] top-[10%] h-[65vmin] w-[65vmin] rounded-full bg-[#5B8DEF] opacity-85 blur-[110px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[75vmin] w-[75vmin] rounded-full bg-[#9B7EDE] opacity-90 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[40%] h-[40vmin] w-[40vmin] rounded-full bg-[#7DDFD0]/70 blur-[100px]" />
        <div className="absolute right-[15%] top-[30%] h-[45vmin] w-[45vmin] rounded-full bg-[#5B8DEF]/60 blur-[90px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="mx-auto mb-5 flex max-w-2xl flex-col items-center gap-2 sm:mb-6 sm:gap-3">
          <span className="onboarding-serif text-[3.25rem] font-semibold leading-[0.95] tracking-[-0.03em] text-white drop-shadow-sm sm:text-6xl sm:leading-[0.95] md:text-7xl md:leading-[0.95] lg:text-8xl">
            ProEdge
          </span>
          <span className="max-w-md text-sm font-medium leading-snug text-white/85 sm:text-base md:text-lg">
            Your Companion for MCAT prep.
          </span>
        </h1>
        <p className="mb-10 max-w-xs text-xs leading-relaxed text-white/75 sm:max-w-sm sm:text-sm md:max-w-md">
          Built for humans, not machines — pacing, pulse checks, and plans that
          respect burnout as much as content gaps.
        </p>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="inline-flex rounded-full bg-[#3D5AFE] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(61,90,254,0.55)] transition hover:bg-[#2f4aef]"
          >
            Start
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex rounded-full bg-[#3D5AFE] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(61,90,254,0.55)] transition hover:bg-[#2f4aef]"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { tab: 'signup' } })}
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-8 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
