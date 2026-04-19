import { MarketingSubPage } from './MarketingSubPage'

export function AboutPage() {
  return (
    <MarketingSubPage title="About">
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#7a6e66] dark:text-[#ddd8d0]">
        ProEdge helps you prepare for the MCAT with pacing, pulse checks, and plans
        that respect burnout as much as content gaps.
      </p>
    </MarketingSubPage>
  )
}

export function WhyUsPage() {
  return (
    <MarketingSubPage title="Why us">
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#7a6e66] dark:text-[#ddd8d0]">
        Built for humans, not machines — human-centered prep that fits real life.
      </p>
    </MarketingSubPage>
  )
}

export function ReviewsPage() {
  return <MarketingSubPage title="Reviews" />
}

export function ContactPage() {
  return <MarketingSubPage title="Contact" />
}
