import type { ReactNode } from 'react'
import { LandingTopNav } from '../components/LandingTopNav'

type Props = {
  title: string
  children?: ReactNode
}

export function MarketingSubPage({ title, children }: Props) {
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

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-10">
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] dark:text-[#fafaf8] sm:text-4xl">
          {title}
        </h1>
        {children ?? (
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#7a6e66] dark:text-[#ddd8d0]">
            Content for this page is coming soon.
          </p>
        )}
      </main>
    </div>
  )
}
