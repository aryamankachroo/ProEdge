import { useNavigate } from 'react-router-dom'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="onboarding-shell relative flex min-h-dvh flex-col">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="absolute -left-20 top-[32%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
        <div className="absolute bottom-[5%] left-[15%] h-72 w-72 rounded-full bg-[#c9b8e8]/28 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="mx-auto mb-5 flex max-w-2xl flex-col items-center gap-2 sm:mb-6 sm:gap-3">
          <span className="onboarding-serif text-[3.25rem] font-semibold leading-[0.95] tracking-[-0.03em] text-[#2c2825] sm:text-6xl sm:leading-[0.95] md:text-7xl md:leading-[0.95] lg:text-8xl">
            ProEdge
          </span>
          <span className="max-w-md text-sm font-medium leading-snug text-[#7a6e66] sm:text-base md:text-lg">
            Your Companion for MCAT prep.
          </span>
        </h1>
        <p className="mb-10 max-w-xs text-xs leading-relaxed text-[#9a8f86] sm:max-w-sm sm:text-sm md:max-w-md">
          Built for humans, not machines — pacing, pulse checks, and plans that
          respect burnout as much as content gaps.
        </p>

        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="onboarding-footer-cta inline-flex rounded-full bg-[#5f7f6a] px-8 py-2.5 text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(95,127,106,0.55)] transition hover:bg-[#536b5d]"
        >
          Start
        </button>
      </div>
    </div>
  )
}
