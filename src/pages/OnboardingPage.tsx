import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingMonthCalendar } from '../components/OnboardingMonthCalendar'
import { OnboardingSideStepper } from '../components/OnboardingSideStepper'
import { useProfile } from '../context/useProfile'
import {
  STUDY_STATUS_LABELS,
  studyDaysFromCalendarEvents,
  type StudyStatus,
  type UserProfile,
} from '../types/profile'
import { saveProfile } from '../lib/api'

const STUDY_STATUSES: StudyStatus[] = [
  'full-time-student',
  'part-time-student',
  'gap-year',
  'working-full-time',
]

const RESOURCE_OPTIONS = [
  'Kaplan',
  'Princeton Review',
  'UWorld',
  'Blueprint',
  'Examkrackers',
  'Other',
] as const

const ANKI_OPTIONS = [
  'AnKing',
  'Jacksparrow',
  'Dirty Medicine',
  'Custom',
] as const

const WEAK_OPTIONS = ['Bio/Biochem', 'Chem/Phys', 'CARS', 'Psych/Soc'] as const

const STEP_META = [
  { title: 'A little about you', subtitle: 'We’ll match intensity to your real life — not an idealized version of it.' },
  { title: 'Your North Star', subtitle: 'Targets and dates help us keep blocks small and your nervous system in the loop.' },
  { title: 'What you already use', subtitle: 'We layer on top of Kaplan, UWorld, Anki — whatever you trust today.' },
]

const STEPPER_STEPS = [
  {
    title: 'About you',
    description: 'Name, schedule, and how you study day to day.',
  },
  {
    title: 'Your goals',
    description: 'Scores, exam date, and the days you can show up.',
  },
  {
    title: 'Your setup',
    description: 'Resources, Anki decks, and sections that feel shaky.',
  },
]

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function McatScoreTrack({ value }: { value: number }) {
  const pct = Math.min(
    100,
    Math.max(0, ((value - 472) / (528 - 472)) * 100),
  )
  return (
    <div
      className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e8dfd4]"
      aria-hidden
    >
      <div
        className="h-full rounded-full bg-[#5f7f6a] transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function SoftPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-white/70 bg-white/65 p-6 shadow-[0_12px_48px_-16px_rgba(90,70,55,0.14)] backdrop-blur-md md:p-7 ${className}`}
    >
      {children}
    </section>
  )
}

function ArrowLeftSm({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ArrowRightSm({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function DiagnosticsChoiceModal({
  open,
  onClose,
  onChooseTake,
  onChooseImport,
  onChooseSkipStudyPlan,
  importFileError,
}: {
  open: boolean
  onClose: () => void
  onChooseTake: () => void
  onChooseImport: () => void
  onChooseSkipStudyPlan: () => void
  importFileError: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#2c2825]/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostics-choice-title"
        className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-white/80 bg-[#faf7f3] p-6 shadow-[0_24px_64px_-20px_rgba(44,40,37,0.35)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="diagnostics-choice-title"
          className="onboarding-serif text-xl font-semibold tracking-tight text-[#2c2825] sm:text-2xl"
        >
          Diagnostics next
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#7a6e66]">
          Ten-question preview (four sections), import a score, or go straight to
          your plan from the questionnaire.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onChooseTake}
            className="onboarding-diagnostics-modal-primary w-full rounded-full bg-[#2c2825] px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-[#1f1c1a]"
          >
            Take a diagnostics test
          </button>
          <button
            type="button"
            onClick={onChooseImport}
            className="w-full rounded-full border border-[#d4c9be] bg-white/80 px-5 py-3 text-sm font-semibold text-[#2c2825] shadow-sm transition hover:bg-white"
          >
            Import diagnostics test score
          </button>
          <button
            type="button"
            onClick={onChooseSkipStudyPlan}
            className="w-full rounded-full border border-[#b8d4be] bg-[#e8f2ea] px-5 py-3 text-sm font-semibold text-[#2c2825] shadow-sm transition hover:bg-[#ddece0]"
          >
            Skip to study plan
          </button>
          <button
            type="button"
            onClick={onClose}
            className="onboarding-diagnostics-modal-muted mt-1 py-2 text-center text-sm font-semibold underline-offset-4 hover:underline"
          >
            Not now — stay on this step
          </button>
          {importFileError ? (
            <p className="mt-2 text-center text-xs text-[#9d4e36]" role="alert">
              {importFileError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useProfile()
  const [step, setStep] = useState(0)
  const [local, setLocal] = useState<UserProfile>(profile)
  const [diagnosticsChoiceOpen, setDiagnosticsChoiceOpen] = useState(false)
  const [importPdfError, setImportPdfError] = useState('')
  const diagnosticPdfInputRef = useRef<HTMLInputElement>(null)

  const update = (p: Partial<UserProfile>) =>
    setLocal((prev) => ({ ...prev, ...p }))

  const canNext =
    step === 0
      ? Boolean(local.name.trim() && local.studyStatus)
      : step === 1
        ? Boolean(
            local.examDate &&
              local.targetScore >= 472 &&
              local.targetScore <= 528 &&
              local.baselineScore >= 472 &&
              local.baselineScore <= 528 &&
              local.studyCalendarEvents.length > 0,
          )
        : local.resources.length > 0 &&
          local.ankiDecks.length > 0 &&
          local.weakSections.length > 0 &&
          (!local.resources.includes('Other') ||
            local.resourceOtherDetail.trim().length > 0)

  const commitProfileAndNavigate = (
    to: string,
    extraProfile?: Partial<UserProfile>,
  ) => {
    const synced: UserProfile = {
      ...local,
      studyDays: studyDaysFromCalendarEvents(local.studyCalendarEvents),
      ...extraProfile,
    }
    setProfile(synced)
    setDiagnosticsChoiceOpen(false)
    setImportPdfError('')

    // Persist to backend (fire-and-forget — don't block navigation on network)
    saveProfile(synced).catch((err) =>
      console.warn('[ProEdge] Failed to save profile to backend:', err),
    )

    navigate(to, { replace: true })
  }

  const openDiagnosticPdfPicker = () => {
    setImportPdfError('')
    const el = diagnosticPdfInputRef.current
    if (el) el.value = ''
    el?.click()
  }

  const onDiagnosticPdfSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setImportPdfError('Please choose a PDF file.')
      e.target.value = ''
      return
    }
    commitProfileAndNavigate('/diagnostics?flow=import', {
      diagnosticReportPdfName: file.name,
    })
  }

  const goBack = () => {
    if (step === 0) navigate('/')
    else setStep((s) => Math.max(0, s - 1))
  }

  const meta = STEP_META[step]

  return (
    <div className="onboarding-shell relative min-h-dvh">
      <input
        ref={diagnosticPdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onDiagnosticPdfSelected}
      />
      <DiagnosticsChoiceModal
        open={diagnosticsChoiceOpen}
        importFileError={importPdfError}
        onClose={() => {
          setImportPdfError('')
          setDiagnosticsChoiceOpen(false)
        }}
        onChooseTake={() =>
          commitProfileAndNavigate('/diagnostics/test', {
            diagnosticReportPdfName: '',
          })
        }
        onChooseImport={openDiagnosticPdfPicker}
        onChooseSkipStudyPlan={() => commitProfileAndNavigate('/study-plan')}
      />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="absolute -left-20 top-[28%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-96 w-96 rounded-full bg-[#c9b8e8]/30 blur-[90px]" />
        <div className="absolute bottom-24 right-[-5%] h-56 w-56 rounded-full bg-[#f0d4c4]/50 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-36 pt-5 md:px-8 md:pb-16 md:pt-8 lg:px-10">
        <header className="mb-6 flex justify-center lg:mb-8">
          <span className="onboarding-serif text-lg font-semibold tracking-tight text-[#4a423c]">
            ProEdge
          </span>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
          <aside className="shrink-0 lg:sticky lg:top-8 lg:w-72 xl:w-80">
            <OnboardingSideStepper
              steps={STEPPER_STEPS}
              currentStep={step}
              onStepSelect={(i) => setStep(i)}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <h1 className="onboarding-serif mb-3 text-left text-[1.65rem] font-semibold leading-[1.2] text-[#2c2825] md:text-3xl lg:text-4xl">
              {meta.title}
            </h1>
            <p className="mb-10 max-w-xl text-left text-[0.95rem] leading-relaxed text-[#6b5f56] md:text-base">
              {meta.subtitle}
            </p>

            <div className="flex flex-col gap-6">
          {step === 0 && (
            <>
              <SoftPanel>
                <p className="mb-3 text-sm font-semibold text-[#5a4f47]">
                  What should we call you?
                </p>
                <label htmlFor="ob-name" className="sr-only">
                  Preferred name
                </label>
                <input
                  id="ob-name"
                  className="onboarding-input"
                  value={local.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="First name is perfect"
                  autoComplete="given-name"
                />
              </SoftPanel>

              <SoftPanel>
                <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
                  Where are you right now?
                </p>
                <p className="mb-4 text-sm text-[#8a7b70]">
                  Tap the option that fits — no wrong answers.
                </p>
                <div className="flex flex-col gap-3">
                  {STUDY_STATUSES.map((s) => {
                    const on = local.studyStatus === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update({ studyStatus: s })}
                        className={`flex w-full items-center rounded-2xl border-2 px-5 py-4 text-left text-[0.95rem] font-semibold transition-all duration-200 ${
                          on
                            ? 'border-[#5f7f6a] bg-[#f0f5f1] text-[#2d3f32] shadow-[0_4px_20px_-8px_rgba(95,127,106,0.35)]'
                            : 'border-transparent bg-white/90 text-[#4a423c] shadow-sm hover:border-[#e8dfd4] hover:shadow-md'
                        }`}
                      >
                        <span
                          className={`mr-4 flex h-5 w-5 shrink-0 rounded-full border-2 ${
                            on
                              ? 'border-[#5f7f6a] bg-[#5f7f6a]'
                              : 'border-[#d4c8bc] bg-white'
                          }`}
                        >
                          {on ? (
                            <span className="m-auto block h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        {STUDY_STATUS_LABELS[s]}
                      </button>
                    )
                  })}
                </div>
              </SoftPanel>

              <SoftPanel>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[#5a4f47]">
                    Realistic study hours / day
                  </p>
                  <span className="onboarding-serif text-2xl font-semibold text-[#5f7f6a]">
                    {local.hoursPerDay}
                  </span>
                </div>
                <p className="mb-4 text-sm text-[#8a7b70]">
                  Slide to what you can repeat without burning out.
                </p>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  className="onboarding-range"
                  value={local.hoursPerDay}
                  onChange={(e) =>
                    update({ hoursPerDay: Number(e.target.value) })
                  }
                  aria-valuemin={1}
                  aria-valuemax={12}
                  aria-valuenow={local.hoursPerDay}
                  aria-label="Hours available per day"
                />
                <div className="mt-2 flex justify-between text-xs text-[#a8988c]">
                  <span>1 hr</span>
                  <span>12 hr</span>
                </div>
              </SoftPanel>

              <SoftPanel>
                <p className="mb-3 text-sm font-semibold text-[#5a4f47]">
                  Study load shape
                </p>
                <div className="flex rounded-2xl bg-[#ebe3d9]/80 p-1.5">
                  <button
                    type="button"
                    className={`flex-1 rounded-xl py-3.5 text-sm font-semibold transition-all ${
                      local.fullTimeStudying
                        ? 'bg-white shadow-md'
                        : 'onboarding-segment-muted'
                    }`}
                    onClick={() => update({ fullTimeStudying: true })}
                  >
                    Full-time focus
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-xl py-3.5 text-sm font-semibold transition-all ${
                      !local.fullTimeStudying
                        ? 'bg-white shadow-md'
                        : 'onboarding-segment-muted'
                    }`}
                    onClick={() => update({ fullTimeStudying: false })}
                  >
                    Around school / work
                  </button>
                </div>
              </SoftPanel>
            </>
          )}

          {step === 1 && (
            <>
              <SoftPanel>
                <p className="mb-4 text-sm font-semibold text-[#5a4f47]">
                  Score snapshot
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9a8b7e]">
                      Target score
                    </p>
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#faf7f3] px-2 py-2">
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-medium text-[#5a4f47] shadow-sm hover:bg-[#f0ebe5]"
                        onClick={() =>
                          update({
                            targetScore: Math.max(472, local.targetScore - 1),
                          })
                        }
                        aria-label="Decrease target score"
                      >
                        −
                      </button>
                      <span className="onboarding-serif text-3xl font-semibold tabular-nums text-[#2c2825]">
                        {local.targetScore}
                      </span>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-medium text-[#5a4f47] shadow-sm hover:bg-[#f0ebe5]"
                        onClick={() =>
                          update({
                            targetScore: Math.min(528, local.targetScore + 1),
                          })
                        }
                        aria-label="Increase target score"
                      >
                        +
                      </button>
                    </div>
                    <McatScoreTrack value={local.targetScore} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9a8b7e]">
                      Baseline / last FL
                    </p>
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#faf7f3] px-2 py-2">
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-medium text-[#5a4f47] shadow-sm hover:bg-[#f0ebe5]"
                        onClick={() =>
                          update({
                            baselineScore: Math.max(
                              472,
                              local.baselineScore - 1,
                            ),
                          })
                        }
                        aria-label="Decrease baseline score"
                      >
                        −
                      </button>
                      <span className="onboarding-serif text-3xl font-semibold tabular-nums text-[#2c2825]">
                        {local.baselineScore}
                      </span>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-medium text-[#5a4f47] shadow-sm hover:bg-[#f0ebe5]"
                        onClick={() =>
                          update({
                            baselineScore: Math.min(
                              528,
                              local.baselineScore + 1,
                            ),
                          })
                        }
                        aria-label="Increase baseline score"
                      >
                        +
                      </button>
                    </div>
                    <McatScoreTrack value={local.baselineScore} />
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-[#9a8b7e]">
                  Scale 472–528 · MCAT total
                </p>
              </SoftPanel>

              <SoftPanel>
                <p className="mb-3 text-sm font-semibold text-[#5a4f47]">
                  Exam date
                </p>
                <label htmlFor="ob-exam" className="sr-only">
                  Exam date
                </label>
                <input
                  id="ob-exam"
                  type="date"
                  className="onboarding-input"
                  value={local.examDate}
                  onChange={(e) => update({ examDate: e.target.value })}
                />
              </SoftPanel>

              <SoftPanel>
                <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
                  When can you show up?
                </p>
                <p className="mb-4 text-sm text-[#8a7b70]">
                  Tap a day to add a to-do. It appears on your calendar like iOS —
                  even &quot;Anki 45m&quot; counts.
                </p>
                <OnboardingMonthCalendar
                  events={local.studyCalendarEvents}
                  onChange={(studyCalendarEvents) =>
                    update({ studyCalendarEvents })
                  }
                />
              </SoftPanel>
            </>
          )}

          {step === 2 && (
            <>
              <SoftPanel>
                <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
                  Resources in rotation
                </p>
                <p className="mb-4 text-sm text-[#8a7b70]">
                  Select all that apply.
                </p>
                <div className="flex flex-wrap gap-2">
                  {RESOURCE_OPTIONS.map((r) => {
                    const on = local.resources.includes(r)
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          const next = toggleInList(local.resources, r)
                          update({
                            resources: next,
                            ...(r === 'Other' && !next.includes('Other')
                              ? { resourceOtherDetail: '' }
                              : {}),
                          })
                        }}
                        className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                          on
                            ? 'onboarding-chip-sage-on border-2'
                            : 'border-[#e8dfd4] bg-white/90 hover:border-[#d4c8bc]'
                        }`}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
                {local.resources.includes('Other') ? (
                  <div className="mt-4">
                    <label
                      htmlFor="ob-resource-other"
                      className="mb-2 block text-sm font-semibold text-[#5a4f47]"
                    >
                      Add other source
                    </label>
                    <input
                      id="ob-resource-other"
                      className="onboarding-input"
                      value={local.resourceOtherDetail}
                      onChange={(e) =>
                        update({ resourceOtherDetail: e.target.value })
                      }
                      placeholder="e.g. Jack Westin daily passages, private tutor PDFs…"
                      autoComplete="off"
                    />
                  </div>
                ) : null}
              </SoftPanel>

              <SoftPanel>
                <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
                  Anki decks
                </p>
                <p className="mb-4 text-sm text-[#8a7b70]">
                  We’ll phrase reviews to match your deck names.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ANKI_OPTIONS.map((r) => {
                    const on = local.ankiDecks.includes(r)
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          update({
                            ankiDecks: toggleInList(local.ankiDecks, r),
                          })
                        }
                        className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                          on
                            ? 'onboarding-chip-sage-on border-2'
                            : 'border-[#e8dfd4] bg-white/90 hover:border-[#d4c8bc]'
                        }`}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </SoftPanel>

              <SoftPanel>
                <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
                  Sections that feel shaky
                </p>
                <p className="mb-4 text-sm text-[#8a7b70]">
                  Honesty here protects your time later.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {WEAK_OPTIONS.map((r) => {
                    const on = local.weakSections.includes(r)
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          update({
                            weakSections: toggleInList(local.weakSections, r),
                          })
                        }
                        className={`rounded-2xl border-2 px-4 py-4 text-left text-sm font-semibold transition-all ${
                          on
                            ? 'onboarding-chip-terra-on border-2'
                            : 'border-transparent bg-white/90 shadow-sm hover:border-[#e8dfd4]'
                        }`}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </SoftPanel>

              <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#9a8b7e] sm:text-sm">
                <span className="font-semibold text-[#7a6e66]">Disclaimer:</span>{' '}
                After completing the questionnaire, take a diagnostics test — or,
                if you&apos;ve already taken one, import your diagnostics test
                score and report.
              </p>
            </>
          )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#e8dfd4]/80 bg-[#faf7f3]/85 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-lg md:static md:mt-12 md:border-0 md:bg-transparent md:p-0 md:pb-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-6xl justify-end px-0 lg:px-10">
            <div className="flex items-center gap-5 sm:gap-7">
              <button
                type="button"
                onClick={goBack}
                className="onboarding-nav-back inline-flex items-center gap-2 py-2 text-sm font-semibold"
              >
                <ArrowLeftSm />
                Back
              </button>
              {step < 2 ? (
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                  className="onboarding-nav-next inline-flex items-center gap-2 rounded-full bg-[#2c2825] px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-[#1f1c1a] disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRightSm />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => {
                    setImportPdfError('')
                    setDiagnosticsChoiceOpen(true)
                  }}
                  className="onboarding-nav-next inline-flex items-center gap-2 rounded-full bg-[#2c2825] px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-[#1f1c1a] disabled:cursor-not-allowed"
                >
                  Start my plan
                  <ArrowRightSm />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
