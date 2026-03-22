import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export function DiagnosticResultsPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const summary = profile.diagnosticSummary
  const rows = summary?.questionResults

  return (
    <div className="min-h-dvh bg-[#fdf9f3] font-[Nunito,'DM_Sans',system-ui,sans-serif] text-[#2c2825]">
      <header className="border-b border-[#e8dfd4]/90 bg-[#fdf9f3]/95 px-4 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-[#5f7f6a] hover:text-[#2c2825]"
          >
            ← Back
          </button>
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#1a1816] no-underline hover:opacity-80"
          >
            ProEdge
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-8">
        <h1 className="onboarding-serif text-2xl font-semibold tracking-tight text-[#1a1816] sm:text-3xl">
          Mini diagnostic — results
        </h1>
        {summary ? (
          <p className="mt-2 text-sm text-[#7a6e66]">
            {new Date(summary.completedAt).toLocaleDateString(undefined, {
              dateStyle: 'long',
            })}
            {' · '}
            {summary.overallCorrect} / {summary.overallTotal} correct
          </p>
        ) : null}

        {!summary ? (
          <p className="mt-8 text-sm text-[#7a6e66]">
            No diagnostic on file.{' '}
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="font-semibold text-[#5f7f6a] underline-offset-4 hover:underline"
            >
              Take the mini diagnostic
            </button>
          </p>
        ) : !rows?.length ? (
          <div className="mt-8 rounded-2xl border border-[#e8dfd4] bg-white/90 p-6">
            <p className="text-sm leading-relaxed text-[#3d3835]">
              Per-question breakdowns are available for attempts completed after this
              update. Retake once to see each question, your answer, the correct
              answer, and a short explanation.
            </p>
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="mt-4 rounded-full bg-[#5f7f6a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#536b5d]"
            >
              Retake mini diagnostic
            </button>
          </div>
        ) : (
          <ul className="mt-8 space-y-6">
            {rows.map((r) => (
              <li
                key={r.index}
                className="rounded-2xl border border-[#e8dfd4] bg-white/95 p-5 shadow-[0_8px_28px_-16px_rgba(90,70,55,0.12)] sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#9a8b7e]">
                    Q{r.index} · {r.sectionShort}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.isCorrect
                        ? 'bg-[#dcfce7] text-[#166534]'
                        : 'bg-[#fee2e2] text-[#b91c1c]'
                    }`}
                  >
                    {r.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-[#2c2825]">
                  {r.prompt}
                </p>
                <ul className="mt-4 space-y-2">
                  {r.choices.map((label, i) => {
                    const isCorrectChoice = i === r.correctIndex
                    const isSelected = i === r.selectedIndex
                    let rowClass =
                      'rounded-xl border px-3 py-2.5 text-sm leading-snug '
                    if (isCorrectChoice) {
                      rowClass +=
                        'border-[#86efac] bg-[#f0fdf4] text-[#14532d]'
                    } else if (isSelected && !r.isCorrect) {
                      rowClass +=
                        'border-[#fca5a5] bg-[#fef2f2] text-[#7f1d1d]'
                    } else {
                      rowClass += 'border-[#e8dfd4] bg-[#faf9f7] text-[#5c534c]'
                    }
                    return (
                      <li key={i} className={rowClass}>
                        <span className="font-semibold tabular-nums">
                          {LETTERS[i]}.{' '}
                        </span>
                        {label}
                        {isCorrectChoice ? (
                          <span className="ml-2 text-xs font-semibold text-[#166534]">
                            (correct)
                          </span>
                        ) : null}
                        {isSelected && !isCorrectChoice ? (
                          <span className="ml-2 text-xs font-semibold text-[#b91c1c]">
                            (your answer)
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-4 rounded-xl bg-[#faf7f3] px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#9a8b7e]">
                    Explanation
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#3d3835]">
                    {r.explanation}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
