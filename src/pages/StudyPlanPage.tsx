import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile'
import { STUDY_STATUS_LABELS } from '../types/profile'

function daysUntilExam(examDate: string): number | null {
  if (!examDate) return null
  const end = new Date(examDate + 'T12:00:00')
  if (Number.isNaN(end.getTime())) return null
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function StudyPlanPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()

  const plan = useMemo(() => {
    const daysLeft = daysUntilExam(profile.examDate)
    const studyDaysPerWeek = profile.studyDays.length || 5
    const weeklyHours = Math.round(profile.hoursPerDay * studyDaysPerWeek * 10) / 10
    const weak = [...profile.weakSections]
    const topicShare = weak.length
      ? weak.map((t) => ({
          topic: t,
          pct: Math.round(100 / weak.length),
        }))
      : []

    const weeks =
      daysLeft != null && daysLeft > 0
        ? Math.max(1, Math.ceil(daysLeft / 7))
        : null

    return { daysLeft, studyDaysPerWeek, weeklyHours, topicShare, weeks }
  }, [profile])

  return (
    <div className="onboarding-shell relative min-h-dvh">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="absolute bottom-[10%] left-[15%] h-72 w-72 rounded-full bg-[#c9b8e8]/28 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-10 md:px-8 md:py-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 self-start text-sm font-semibold text-[#6b5f56] hover:text-[#2c2825]"
        >
          ← Back
        </button>

        <h1 className="onboarding-serif mb-2 text-3xl font-semibold text-[#2c2825] md:text-4xl">
          Your study plan
        </h1>
        <p className="mb-8 text-[0.95rem] leading-relaxed text-[#6b5f56]">
          Built from your questionnaire — hours, exam date, and sections you
          flagged. Adjust anytime as your diagnostic or FL scores come in.
        </p>

        <section className="mb-6 rounded-[1.75rem] border border-white/70 bg-white/65 p-6 shadow-[0_12px_48px_-16px_rgba(90,70,55,0.14)] backdrop-blur-md md:p-7">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9a8b7e]">
            Snapshot
          </h2>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-[#ebe3d9]/80 pb-3">
              <dt className="text-[#7a6e66]">Target score</dt>
              <dd className="onboarding-serif font-semibold tabular-nums text-[#2c2825]">
                {profile.targetScore}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#ebe3d9]/80 pb-3">
              <dt className="text-[#7a6e66]">Baseline / last FL</dt>
              <dd className="onboarding-serif font-semibold tabular-nums text-[#2c2825]">
                {profile.baselineScore}
              </dd>
            </div>
            {profile.examDate ? (
              <div className="flex justify-between gap-4 border-b border-[#ebe3d9]/80 pb-3">
                <dt className="text-[#7a6e66]">Exam date</dt>
                <dd className="font-semibold text-[#2c2825]">{profile.examDate}</dd>
              </div>
            ) : null}
            {plan.daysLeft != null ? (
              <div className="flex justify-between gap-4 border-b border-[#ebe3d9]/80 pb-3">
                <dt className="text-[#7a6e66]">Days until exam</dt>
                <dd className="font-semibold tabular-nums text-[#2c2825]">
                  {plan.daysLeft < 0 ? 'Past date' : plan.daysLeft}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-b border-[#ebe3d9]/80 pb-3">
              <dt className="text-[#7a6e66]">Study hours / day</dt>
              <dd className="font-semibold tabular-nums text-[#2c2825]">
                {profile.hoursPerDay} hr
              </dd>
            </div>
            <div className="flex justify-between gap-4 pb-1">
              <dt className="text-[#7a6e66]">Rough weekly capacity</dt>
              <dd className="font-semibold tabular-nums text-[#2c2825]">
                ~{plan.weeklyHours} hr ({plan.studyDaysPerWeek} study days / wk)
              </dd>
            </div>
            {profile.studyStatus ? (
              <div className="flex justify-between gap-4 pt-2">
                <dt className="text-[#7a6e66]">Context</dt>
                <dd className="text-right font-medium text-[#2c2825]">
                  {STUDY_STATUS_LABELS[profile.studyStatus]}
                  {profile.fullTimeStudying ? ' · full-time focus' : ' · around school/work'}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/65 p-6 shadow-[0_12px_48px_-16px_rgba(90,70,55,0.14)] backdrop-blur-md md:p-7">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#9a8b7e]">
            Topics to prioritize
          </h2>
          <p className="mb-4 text-sm text-[#6b5f56]">
            Split your content time across weak sections until your next
            full-length. If you only have one weak area, fold extra time into
            practice and review.
          </p>
          {plan.topicShare.length > 0 ? (
            <ul className="space-y-3">
              {plan.topicShare.map(({ topic, pct }) => (
                <li
                  key={topic}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#faf7f3] px-4 py-3"
                >
                  <span className="font-semibold text-[#2c2825]">{topic}</span>
                  <span className="text-sm tabular-nums text-[#5f7f6a]">
                    ~{pct}% of section time
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#8a7b70]">
              Add weak sections in the questionnaire to see a split here.
            </p>
          )}
        </section>

        {plan.weeks != null && plan.daysLeft != null && plan.daysLeft > 0 ? (
          <p className="mt-6 text-sm leading-relaxed text-[#8a7b70]">
            With about <strong className="text-[#5a4f47]">{plan.weeks} week(s)</strong>{' '}
            until test day, aim for steady weekly hours rather than cram spikes —
            your calendar events already mark when you can show up.
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => navigate('/diagnostic')}
            className="rounded-full border-2 border-[#e8dfd4] bg-white/90 px-6 py-2.5 text-sm font-semibold text-[#4a423c] shadow-sm transition hover:border-[#d4c8bc]"
          >
            Take diagnostic
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full bg-[#2c2825] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1c1a]"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
