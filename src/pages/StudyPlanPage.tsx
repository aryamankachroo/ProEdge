import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { STUDY_STATUS_LABELS } from '../types/profile'
import { useProfile } from '../context/useProfile'
import {
  fetchActivePlan,
  generatePlan,
  isBackendApiEnabled,
  type GeneratedPlan,
  type PlanPhase,
  type PlanWeek,
} from '../lib/api'
import {
  generateStudyPlanWithGemini,
  isGeminiStudyPlanAvailable,
} from '../lib/geminiStudyPlan'

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
        <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#9a8b7e]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  )
}

function PhaseCard({ phase }: { phase: PlanPhase }) {
  return (
    <div className="rounded-xl border border-[#e8dfd4] bg-[#faf7f3] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-[#2c2825]">{phase.name}</span>
        <span className="text-xs text-[#9a8b7e]">{phase.weeks}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-[#5f7f6a]">{phase.focus}</p>
      {phase.description ? (
        <p className="mt-1 text-xs leading-relaxed text-[#7a6e66]">
          {phase.description}
        </p>
      ) : null}
    </div>
  )
}

function WeekCard({ week }: { week: PlanWeek }) {
  return (
    <div className="rounded-xl border border-[#e8dfd4] bg-white/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#9a8b7e]">
        Week {week.week}
        {week.theme ? ` · ${week.theme}` : ''}
      </p>
      {week.days && week.days.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {week.days.slice(0, 4).map((day, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium text-[#3d3835]">{day.day}:</span>{' '}
              <span className="text-[#5a4f47]">{day.tasks.join(', ')}</span>
            </li>
          ))}
          {week.days.length > 4 ? (
            <li className="text-xs text-[#9a8b7e]">
              +{week.days.length - 4} more days…
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
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

  const [aiPlan, setAiPlan] = useState<GeneratedPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  // On mount: load saved plan from backend when API is enabled
  useEffect(() => {
    if (!isBackendApiEnabled()) return
    fetchActivePlan()
      .then((saved) => {
        if (saved) {
          setAiPlan(saved.plan)
          setGeneratedAt(saved.generatedAt)
        }
      })
      .catch(() => {
        // Backend unavailable
      })
  }, [])

  const handleGeneratePlan = async () => {
    setPlanLoading(true)
    setPlanError(null)
    try {
      if (isGeminiStudyPlanAvailable()) {
        const plan = await generateStudyPlanWithGemini(profile)
        setAiPlan(plan)
        setGeneratedAt(new Date().toISOString())
        return
      }
      if (isBackendApiEnabled()) {
        const plan = await generatePlan()
        setAiPlan(plan)
        setGeneratedAt(new Date().toISOString())
        return
      }
      setPlanError(
        'Add VITE_GEMINI_API_KEY to .env.local and restart the dev server, or set VITE_USE_BACKEND_API=true with the ProEdge API running.',
      )
    } catch (err) {
      setPlanError(
        err instanceof Error ? err.message : 'Failed to generate plan. Please try again.',
      )
    } finally {
      setPlanLoading(false)
    }
  }

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

  const phases = aiPlan?.phases ?? []
  const weeks = aiPlan?.weeklySchedule ?? []
  const tips = aiPlan?.tips ?? []

  return (
    <div className="onboarding-shell relative min-h-dvh pb-32 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/35 blur-[80px]" />
        <div className="absolute -left-20 top-[28%] h-72 w-72 rounded-full bg-[#a8c5b4]/40 blur-[72px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10">
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

          {/* AI Plan section */}
          <Panel title="AI-generated plan">
            {aiPlan ? (
              <div className="mt-2 space-y-4">
                {generatedAt ? (
                  <p className="text-xs text-[#9a8b7e]">
                    Generated {new Date(generatedAt).toLocaleDateString()}
                  </p>
                ) : null}

                {aiPlan.overview ? (
                  <p className="text-sm leading-relaxed text-[#3d3835]">
                    {aiPlan.overview}
                  </p>
                ) : null}

                {phases.length > 0 ? (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                      Study phases
                    </p>
                    <div className="space-y-3">
                      {phases.map((phase, i) => (
                        <PhaseCard key={i} phase={phase} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {weeks.length > 0 ? (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                      Weekly schedule (first {Math.min(weeks.length, 4)} weeks)
                    </p>
                    <div className="space-y-3">
                      {weeks.slice(0, 4).map((week, i) => (
                        <WeekCard key={i} week={week} />
                      ))}
                      {weeks.length > 4 ? (
                        <p className="text-xs text-[#9a8b7e]">
                          +{weeks.length - 4} more weeks in your full plan.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {tips.length > 0 ? (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                      Tips
                    </p>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[#3d3835]">
                          <span className="mt-0.5 text-[#5f7f6a]">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={planLoading}
                  className="mt-2 w-full rounded-full border border-[#d4c9be] bg-white px-5 py-2.5 text-sm font-semibold text-[#2c2825] transition hover:bg-[#faf7f3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {planLoading ? 'Regenerating…' : 'Regenerate plan'}
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-[#7a6e66]">
                  Let Gemini build a week-by-week plan from your questionnaire:
                  goals, daily hours, exam date, study days, weak sections,
                  resources, and Anki decks (and your mini-diagnostic if you took
                  it). Uses{' '}
                  <code className="rounded bg-[#ebe5dc] px-1 py-0.5 text-[13px]">
                    VITE_GEMINI_API_KEY
                  </code>{' '}
                  in the browser for demos.
                </p>
                {planError ? (
                  <p className="mt-3 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#9d4e36]">
                    {planError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={planLoading}
                  className="mt-4 w-full rounded-full bg-[#2c2825] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1c1a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {planLoading ? 'Generating your plan…' : 'Generate AI study plan'}
                </button>
                {planLoading ? (
                  <p className="mt-2 text-center text-xs text-[#9a8b7e]">
                    This takes about 10–15 seconds — Gemini is mapping your full
                    schedule.
                  </p>
                ) : null}
              </div>
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
            onClick={() => navigate('/analytics')}
            className="w-full rounded-full border border-[#c5d9f5] bg-[#eef4fc] px-6 py-3 text-sm font-semibold text-[#1e3a5f] shadow-sm transition hover:bg-[#e2ebf9] sm:min-w-[10rem] sm:flex-1"
          >
            AI analytics
          </button>
          <button
            type="button"
            onClick={() => navigate('/journal')}
            className="w-full rounded-full border border-[#cfe5d6] bg-[#f4faf6] px-6 py-3 text-sm font-semibold text-[#1a3d2e] shadow-sm transition hover:bg-[#e8f2ec] sm:min-w-[10rem] sm:flex-1"
          >
            AI journal
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
