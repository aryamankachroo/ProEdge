import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DIAGNOSTIC_SECTIONS,
  totalDiagnosticQuestions,
  type DiagnosticQuestion,
} from '../data/diagnosticExam'

type Phase = 'exam' | 'results'

export function DiagnosticExamPage() {
  const navigate = useNavigate()
  const totalQ = totalDiagnosticQuestions()

  const [phase, setPhase] = useState<Phase>('exam')
  const [sectionIdx, setSectionIdx] = useState(0)
  const [qInSection, setQInSection] = useState(0)
  /** questionId -> selected choice index */
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const section = DIAGNOSTIC_SECTIONS[sectionIdx]
  const question: DiagnosticQuestion | undefined =
    section?.questions[qInSection]

  const overallIndex = useMemo(() => {
    let n = 0
    for (let s = 0; s < sectionIdx; s++) {
      n += DIAGNOSTIC_SECTIONS[s].questions.length
    }
    return n + qInSection + 1
  }, [sectionIdx, qInSection])

  const selected = question ? answers[question.id] : undefined

  const setChoice = (choiceIndex: number) => {
    if (!question) return
    setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }))
  }

  const score = useCallback(() => {
    let correct = 0
    for (const sec of DIAGNOSTIC_SECTIONS) {
      for (const q of sec.questions) {
        if (answers[q.id] === q.correctIndex) correct += 1
      }
    }
    return { correct, total: totalQ }
  }, [answers, totalQ])

  const goNext = () => {
    if (!section || !question) return
    const lastInSection = qInSection >= section.questions.length - 1
    const lastSection = sectionIdx >= DIAGNOSTIC_SECTIONS.length - 1
    if (!lastInSection) {
      setQInSection((q) => q + 1)
      return
    }
    if (!lastSection) {
      setSectionIdx((s) => s + 1)
      setQInSection(0)
      return
    }
    setPhase('results')
  }

  const goBack = () => {
    if (sectionIdx === 0 && qInSection === 0) {
      navigate('/diagnostic')
      return
    }
    if (qInSection > 0) {
      setQInSection((q) => q - 1)
      return
    }
    const prevSec = sectionIdx - 1
    const prevLen = DIAGNOSTIC_SECTIONS[prevSec].questions.length
    setSectionIdx(prevSec)
    setQInSection(prevLen - 1)
  }

  if (phase === 'results') {
    const { correct, total } = score()
    const pct = total ? Math.round((correct / total) * 100) : 0

    return (
      <div className="onboarding-shell relative min-h-dvh">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
          <div className="absolute bottom-[10%] left-[15%] h-72 w-72 rounded-full bg-[#a8c5b4]/35 blur-[72px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-10 md:px-8 md:py-14">
          <h1 className="onboarding-serif mb-2 text-3xl font-semibold text-[#2c2825] dark:text-[#f5f2ed] md:text-4xl">
            Diagnostic complete
          </h1>
          <p className="mb-8 text-[0.95rem] leading-relaxed text-[#6b5f56] dark:text-[#c4bdb4]">
            Full-length structure (four sections) with a couple of practice
            items per section — use this as a pulse check, not a scaled MCAT
            prediction.
          </p>

          <section className="mb-8 rounded-[1.75rem] border border-white/70 bg-white/65 p-8 text-center shadow-[0_12px_48px_-16px_rgba(90,70,55,0.14)] backdrop-blur-md dark:border-[#454440] dark:bg-[#2c2b29]/96 dark:shadow-[0_12px_48px_-16px_rgba(0,0,0,0.4)] md:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#c4bdb4]">
              Raw score
            </p>
            <p className="onboarding-serif mt-2 text-5xl font-semibold tabular-nums text-[#2c2825] dark:text-[#f5f2ed] md:text-6xl">
              {correct}
              <span className="text-2xl font-medium text-[#9a8b7e] dark:text-[#9a928a]">
                {' '}
                / {total}
              </span>
            </p>
            <p className="mt-2 text-sm text-[#6b5f56] dark:text-[#b8b0a6]">{pct}% correct</p>
          </section>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/post-questionnaire')}
              className="rounded-full bg-[#5f7f6a] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(95,127,106,0.45)] transition hover:bg-[#536b5d]"
            >
              Enter score (PDF / manual)
            </button>
            <button
              type="button"
              onClick={() => navigate('/study-plan')}
              className="rounded-full border-2 border-[#e8dfd4] bg-white/90 px-6 py-2.5 text-sm font-semibold text-[#4a423c] shadow-sm transition hover:border-[#d4c8bc]"
            >
              Study plan
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full border-2 border-transparent px-6 py-2.5 text-sm font-semibold text-[#6b5f56] hover:text-[#2c2825]"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!section || !question) return null

  const canAdvance = selected !== undefined

  return (
    <div className="onboarding-shell relative min-h-dvh">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/35 blur-[80px]" />
        <div className="absolute -left-20 top-[22%] h-72 w-72 rounded-full bg-[#a8c5b4]/40 blur-[72px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-28 pt-6 md:px-8 md:pb-16 md:pt-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="onboarding-serif text-lg font-semibold tracking-tight text-[#4a423c] no-underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f7f6a] focus-visible:ring-offset-2 dark:text-[#eae8e4] dark:focus-visible:ring-offset-[#121211] rounded-sm"
            aria-label="ProEdge home"
          >
            ProEdge
          </Link>
          <span className="text-sm font-medium tabular-nums text-[#6b5f56] dark:text-[#b8b0a6]">
            Question {overallIndex} of {totalQ}
          </span>
        </header>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-[#e8dfd4] dark:bg-[#3a3936]">
          <div
            className="h-full rounded-full bg-[#5f7f6a] transition-[width] duration-300 ease-out"
            style={{ width: `${(overallIndex / totalQ) * 100}%` }}
            aria-hidden
          />
        </div>

        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#9a928a]">
          Section {sectionIdx + 1} of {DIAGNOSTIC_SECTIONS.length} ·{' '}
          {section.shortName}
        </p>
        <h1 className="onboarding-serif mb-2 text-xl font-semibold leading-snug text-[#2c2825] dark:text-[#f5f2ed] md:text-2xl">
          {section.fullName}
        </h1>
        <p className="mb-8 text-sm text-[#8a7b70] dark:text-[#b8b0a6]">
          Question {qInSection + 1} of {section.questions.length} in this
          section
        </p>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/65 p-6 shadow-[0_12px_48px_-16px_rgba(90,70,55,0.14)] backdrop-blur-md dark:border-[#3d3c38]/90 dark:bg-[#262523] dark:shadow-[0_12px_48px_-16px_rgba(0,0,0,0.45)] md:p-8">
          {question.passage ? (
            <div className="mb-6 rounded-2xl border border-[#ebe3d9] bg-[#faf7f3]/80 p-5 text-sm leading-relaxed text-[#4a423c] dark:border-[#454440] dark:bg-[#32312f]/90 dark:text-[#e8e6e1]">
              {question.passage}
            </div>
          ) : null}
          <p className="text-base font-medium leading-relaxed text-[#2c2825] dark:text-[#f0ebe4] md:text-[1.05rem]">
            {question.stem}
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {question.choices.map((c, i) => {
              const on = selected === i
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setChoice(i)}
                    className={`diagnostic-mcq-option flex w-full rounded-2xl border-2 px-4 py-4 text-left text-sm font-semibold leading-snug transition-all md:px-5 md:py-4 md:text-[0.95rem] ${
                      on
                        ? 'diagnostic-mcq-option--selected border-[#5f7f6a] bg-[#f0f5f1] text-[#2d3f32] shadow-[0_4px_20px_-8px_rgba(95,127,106,0.3)] dark:bg-[#243d30] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.35)]'
                        : 'border-transparent bg-white/90 text-[#4a423c] shadow-sm hover:border-[#e8dfd4] dark:border-[#454440] dark:bg-[#32312f] dark:hover:border-[#5f7f6a]/45'
                    }`}
                  >
                    <span
                      className={`mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs tabular-nums ${
                        on
                          ? 'border-[#5f7f6a] bg-[#5f7f6a] text-white'
                          : 'border-[#d4c8bc] bg-white text-[#6b5f56] dark:border-[#5c5a56] dark:bg-[#454440] dark:text-[#f5f2ed]'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {c}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#e8dfd4]/80 bg-[#faf7f3]/90 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-lg dark:border-[#3a3836]/85 dark:bg-[#1f1f1d]/95 md:static md:mt-10 md:border-0 md:bg-transparent md:p-0 md:pb-0 md:backdrop-blur-none dark:md:border-0 dark:md:bg-transparent">
          <div className="mx-auto flex max-w-3xl justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              className="py-2.5 text-sm font-semibold text-[#6b5f56] hover:text-[#2c2825] dark:text-[#a89e94] dark:hover:text-[#f0ebe4]"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canAdvance}
              onClick={goNext}
              className="journal-btn-on-dark rounded-full bg-[#2c2825] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1c1a] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sectionIdx === DIAGNOSTIC_SECTIONS.length - 1 &&
              qInSection === section.questions.length - 1
                ? 'Finish'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
