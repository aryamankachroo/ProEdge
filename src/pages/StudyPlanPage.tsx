import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { STUDY_STATUS_LABELS } from '../types/profile'
import { useProfile } from '../context/useProfile'

function daysUntilExam(examDateIso: string): number | null {
  if (!examDateIso) return null
  const exam = new Date(`${examDateIso}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((exam.getTime() - today.getTime()) / 86_400_000)
  return diff
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#ebe3da] py-3.5 last:border-0">
      <span className="text-sm text-[#7a6e66]">{label}</span>
      <span className="onboarding-serif text-right text-base font-semibold text-[#1a1816]">
        {value}
      </span>
    </div>
  )
}

function Panel({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/80 p-6 shadow-[0_12px_48px_-16px_rgba(90,70,55,0.12)] backdrop-blur-md sm:p-7">
      {title ? (
        <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#9a8b7e] uppercase">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  )
}

export function StudyPlanPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const {
    targetScore,
    baselineScore,
    examDate,
    hoursPerDay,
    studyDays,
    studyStatus,
    fullTimeStudying,
    weakSections,
  } = profile

  const daysLeft = daysUntilExam(examDate)
  const weeksLeft =
    daysLeft !== null && daysLeft > 0
      ? Math.max(1, Math.round(daysLeft / 7))
      : null

  const studyDaysPerWeek = studyDays.length
  const weeklyHours = hoursPerDay * studyDaysPerWeek

  const contextLabel =
    studyStatus && studyStatus in STUDY_STATUS_LABELS
      ? `${STUDY_STATUS_LABELS[studyStatus as keyof typeof STUDY_STATUS_LABELS]} · ${fullTimeStudying ? 'full-time focus' : 'lighter load'}`
      : '—'

  const weak = weakSections.length
  const share = weak > 0 ? Math.round(100 / weak) : 0

  return (
    <div className="onboarding-shell relative min-h-dvh pb-32 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/35 blur-[80px]" />
        <div className="absolute -left-20 top-[28%] h-72 w-72 rounded-full bg-[#a8c5b4]/40 blur-[72px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-5 py-8 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="onboarding-nav-back mb-6 inline-flex items-center gap-2 text-sm font-semibold"
        >
          <span aria-hidden>←</span> Back
        </button>

        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] sm:text-[2rem]">
          Your study plan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#7a6e66]">
          From your questionnaire: goals, schedule, and sections you want to
          shore up.
        </p>

        <div className="mt-8 space-y-5">
          <Panel title="Snapshot">
            <div className="mt-1">
              <Row label="Target score" value={String(targetScore)} />
              <Row label="Baseline / last FL" value={String(baselineScore)} />
              <Row label="Exam date" value={examDate || '—'} />
              <Row
                label="Days until exam"
                value={daysLeft !== null ? String(daysLeft) : '—'}
              />
              <Row
                label="Study hours / day"
                value={`${hoursPerDay} hr`}
              />
              <Row
                label="Rough weekly capacity"
                value={`~${weeklyHours} hr (${studyDaysPerWeek} study day${studyDaysPerWeek === 1 ? '' : 's'} / wk)`}
              />
              <Row label="Context" value={contextLabel} />
            </div>
          </Panel>

          <Panel title="Topics to prioritize">
            <p className="mt-2 text-sm leading-relaxed text-[#7a6e66]">
              Aim more content time at the sections you marked as shaky.
            </p>
            {weakSections.length === 0 ? (
              <p className="mt-4 text-sm text-[#9a8b7e]">No sections selected.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {weakSections.map((s) => (
                  <li
                    key={s}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="font-medium text-[#3d3835]">{s}</span>
                    <span className="text-[#5f7f6a]">
                      ~{share}% of section time
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {weeksLeft !== null ? (
          <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-[#7a6e66]">
            About {weeksLeft} week{weeksLeft === 1 ? '' : 's'} until test day —
            steady weekly hours beat last-minute cramming.
          </p>
        ) : null}

        <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => navigate('/diagnostics/test')}
            className="w-full rounded-full border-2 border-[#2c2825] bg-white px-6 py-3 text-sm font-semibold text-[#2c2825] shadow-sm transition hover:bg-[#faf9f7] sm:min-w-[10rem] sm:flex-1"
          >
            Take diagnostic
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-full border border-[#5f7f6a] bg-[#f0f6f2] px-6 py-3 text-sm font-semibold text-[#2c4a32] shadow-sm transition hover:bg-[#e4efe6] sm:min-w-[10rem] sm:flex-1"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="w-full rounded-full border border-[#d4c9be] bg-white px-6 py-3 text-sm font-semibold text-[#4a423c] shadow-sm transition hover:bg-[#faf9f7] sm:min-w-[10rem] sm:flex-1"
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="onboarding-diagnostics-modal-primary w-full rounded-full bg-[#2c2825] px-6 py-3 text-sm font-semibold shadow-sm transition hover:bg-[#1f1c1a] sm:min-w-[10rem] sm:flex-1"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
