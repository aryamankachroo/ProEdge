import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CARS_PRACTICE_TOTAL } from '../data/carsPracticeQuestions'
import { createCarsPracticeSession } from '../lib/carsPracticeSession'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export function CarsPracticePage() {
  const navigate = useNavigate()
  const [session] = useState(() => createCarsPracticeSession())
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array.from({ length: CARS_PRACTICE_TOTAL }, () => null),
  )
  const [done, setDone] = useState(false)

  const q = session[index]
  const selected = answers[index]
  const progressPct = ((index + 1) / CARS_PRACTICE_TOTAL) * 100
  const isLast = index === CARS_PRACTICE_TOTAL - 1
  const canNext = selected !== null

  const correctCount = done
    ? answers.reduce<number>(
        (n, a, i) => n + (a !== null && a === session[i]!.correctIndex ? 1 : 0),
        0,
      )
    : 0

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
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
  }

  const goBack = () => {
    if (done) {
      setDone(false)
      setIndex(CARS_PRACTICE_TOTAL - 1)
      return
    }
    if (index === 0) navigate(-1)
    else setIndex((i) => i - 1)
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-[#fdf9f3] font-[Nunito,'DM_Sans',system-ui,sans-serif] text-[#2c2825]">
        <header className="border-b border-[#e8dfd4]/90 bg-[#fdf9f3]/95 px-4 py-4 backdrop-blur-sm sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-[#5f7f6a] no-underline hover:text-[#2c2825]"
            >
              ← Dashboard
            </Link>
            <span className="text-lg font-bold tracking-tight text-[#1a1816]">
              ProEdge
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
          <h1 className="onboarding-serif text-2xl font-semibold text-[#1a1816]">
            CARS practice — results
          </h1>
          <p className="mt-2 text-sm text-[#7a6e66]">
            You got{' '}
            <span className="font-semibold text-[#2c2825]">
              {correctCount} / {CARS_PRACTICE_TOTAL}
            </span>{' '}
            correct.
          </p>
          <ul className="mt-8 space-y-6">
            {session.map((item, i) => {
              const a = answers[i]
              const ok = a !== null && a === item.correctIndex
              return (
                <li
                  key={i}
                  className="rounded-2xl border border-[#e8dfd4] bg-white/95 p-5 sm:p-6"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#9a8b7e]">
                    Question {i + 1}{' '}
                    <span
                      className={
                        ok ? 'text-[#166534]' : 'text-[#b91c1c]'
                      }
                    >
                      {ok ? '· Correct' : '· Incorrect'}
                    </span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#5c534c]">
                    {item.passage}
                  </p>
                  <p className="mt-3 text-[0.95rem] font-medium text-[#2c2825]">
                    {item.stem}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                    Explanation
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#3d3835]">
                    {item.explanation}
                  </p>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-10 rounded-full bg-[#5f7f6a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#536b5d]"
          >
            Back to dashboard
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#fdf9f3] font-[Nunito,'DM_Sans',system-ui,sans-serif] text-[#2c2825]">
      <header className="border-b border-[#e8dfd4]/90 bg-[#fdf9f3]/95 px-4 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-[#5f7f6a] no-underline hover:text-[#2c2825]"
          >
            ← Dashboard
          </Link>
          <span className="text-sm font-medium text-[#7a6e66]">
            CARS {index + 1} / {CARS_PRACTICE_TOTAL}
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
          Critical Analysis &amp; Reasoning Skills
        </p>
        <h1 className="onboarding-serif mt-2 text-xl font-semibold leading-tight tracking-tight text-[#1a1816] sm:text-2xl">
          Read the passage, then answer
        </h1>

        <div className="mt-8 rounded-[1.35rem] border border-white/80 bg-white p-6 shadow-[0_16px_48px_-20px_rgba(90,70,55,0.18)] sm:p-8">
          <p className="text-sm leading-relaxed text-[#3d3835] sm:text-[0.95rem]">
            {q.passage}
          </p>
          <p className="mt-6 text-[0.95rem] font-medium leading-relaxed text-[#2c2825] sm:text-base">
            {q.stem}
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
                    {LETTERS[i]}
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
            {isLast ? 'See results' : 'Next'}
          </button>
        </div>
      </footer>
    </div>
  )
}
