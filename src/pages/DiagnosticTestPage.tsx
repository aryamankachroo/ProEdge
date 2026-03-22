import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile'
import { buildDiagnosticSummary } from '../lib/diagnosticSummary'
import { createDiagnosticSession } from '../lib/diagnosticSession'
import { DIAGNOSTIC_TOTAL } from '../data/diagnosticQuestions'
import { saveDiagnosticScores } from '../lib/api'

export function DiagnosticTestPage() {
  const navigate = useNavigate()
  const { setProfile } = useProfile()
  const [session] = useState(() => createDiagnosticSession())
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array.from({ length: DIAGNOSTIC_TOTAL }, () => null),
  )

  const q = session[index]
  const selected = answers[index]
  const progressPct = ((index + 1) / DIAGNOSTIC_TOTAL) * 100
  const isLast = index === DIAGNOSTIC_TOTAL - 1

  const canNext = selected !== null

  const setChoice = (choiceIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = choiceIndex
      return next
    })
  }

  const goNext = () => {
    if (!canNext) return
    if (isLast) {
      const summary = buildDiagnosticSummary(answers as number[], session)
      setProfile((prev) => ({
        diagnosticSummary: summary,
        studyDayTodos: prev.studyDayTodos.filter(
          (t) =>
            t.fillSource !== 'diagnostic' && t.fillSource !== 'questionnaire',
        ),
      }))

      // Persist scores to backend (fire-and-forget)
      saveDiagnosticScores(summary).catch((err) =>
        console.warn('[ProEdge] Failed to save diagnostic scores:', err),
      )

      navigate('/dashboard', { replace: true })
      return
    }
    setIndex((i) => i + 1)
  }

  const goBack = () => {
    if (index === 0) navigate(-1)
    else setIndex((i) => i - 1)
  }

  return (
    <div className="min-h-dvh bg-[#fdf9f3] font-[Nunito,'DM_Sans',system-ui,sans-serif] text-[#2c2825]">
      <header className="border-b border-[#e8dfd4]/90 bg-[#fdf9f3]/95 px-4 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-lg font-bold tracking-tight text-[#1a1816]">
            ProEdge
          </span>
          <span className="text-sm font-medium text-[#7a6e66]">
            Question {index + 1} of {DIAGNOSTIC_TOTAL}
          </span>
        </div>
        <div className="mx-auto mt-3 h-1 max-w-3xl overflow-hidden rounded-full bg-[#e8dfd4]">
          <div
            className="h-full rounded-full bg-[#5f7f6a] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-8 sm:py-10 sm:pb-32">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#9a8b7e]">
          Section {q.sectionNumber} of 4 · {q.sectionShort}
        </p>
        <h1 className="onboarding-serif mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#1a1816] sm:text-[1.65rem]">
          {q.sectionTitle}
        </h1>
        <p className="mt-2 text-sm text-[#7a6e66]">
          Question {q.questionInSection} of {q.sectionQuestionCount} in this
          section
        </p>

        <div className="mt-8 rounded-[1.35rem] border border-white/80 bg-white p-6 shadow-[0_16px_48px_-20px_rgba(90,70,55,0.18)] sm:p-8">
          <p className="text-[0.95rem] leading-relaxed text-[#3d3835] sm:text-base">
            {q.prompt}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {q.choices.map((label, i) => {
              const isOn = selected === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setChoice(i)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm leading-snug transition sm:gap-4 sm:py-4 ${
                    isOn
                      ? 'border-[#5f7f6a] bg-[#f0f6f2] ring-1 ring-[#5f7f6a]/35'
                      : 'border-[#e0d6cc] bg-[#faf9f7] hover:border-[#c9bfb4]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      isOn
                        ? 'border-[#5f7f6a] bg-[#5f7f6a] text-white'
                        : 'border-[#c9bfb4] bg-white text-[#5c534c]'
                    }`}
                  >
                    {(['A', 'B', 'C', 'D'] as const)[i]}
                  </span>
                  <span className="pt-1 text-[#2c2825]">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#e8dfd4]/80 bg-[#fdf9f3]/92 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="py-2 text-sm font-semibold text-[#5c534c] hover:text-[#2c2825]"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={goNext}
            className="rounded-full bg-[#5f7f6a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#536b5d] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLast ? 'View dashboard' : 'Next'}
          </button>
        </div>
      </footer>
    </div>
  )
}
