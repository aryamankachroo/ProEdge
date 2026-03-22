import type { ImportedDiagnosticReport } from '../types/diagnosticImport'

function scoreColor(pct: number | null) {
  if (pct === null) return 'bg-[#e8dfd4]'
  if (pct >= 70) return 'bg-[#5f7f6a]'
  if (pct >= 50) return 'bg-[#c4a882]'
  return 'bg-[#d97757]'
}

function BarStack({ pctCorrect }: { pctCorrect: number | null }) {
  if (pctCorrect === null) {
    return (
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#f0ebe4] transition-colors duration-200 ease-out group-hover:bg-[#ebe6df] dark:bg-[#3a3634] dark:group-hover:bg-[#454240]">
        <div className="h-full w-full bg-[#e8dfd4] dark:bg-[#4a4845]" />
      </div>
    )
  }
  const p = Math.min(100, Math.max(0, pctCorrect))
  const wrong = 100 - p
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#fecaca] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[box-shadow] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-safe:group-hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#5c2d2d]/80 dark:motion-safe:group-hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.2)]">
      <div className="h-full bg-[#5f7f6a]" style={{ width: `${p}%` }} />
      <div className="h-full bg-[#f87171]" style={{ width: `${wrong}%` }} />
    </div>
  )
}

export function DiagnosticImportedReportView({
  report,
}: {
  report: ImportedDiagnosticReport
}) {
  return (
    <div className="space-y-10">
      <header className="border-b border-[#ebe5dc] pb-6 dark:border-[#454440]">
        <p className="text-xs font-bold uppercase tracking-wide text-[#9a8b7e] dark:text-[#9a928a]">
          AI-analyzed diagnostic
        </p>
        <h2 className="onboarding-serif mt-1 text-2xl font-semibold text-[#2c2825] dark:text-[#f5f2ed] sm:text-3xl">
          {report.reportTitle}
        </h2>
        <p className="mt-2 text-sm text-[#7a6e66] dark:text-[#c4bdb4]">
          <span className="font-medium text-[#3d3835] dark:text-[#eae8e4]">{report.sourceFileName}</span>
          <span className="text-[#9a8b7e] dark:text-[#9a928a]">
            {' '}
            ·{' '}
            {new Date(report.analyzedAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-start">
        <div className="flex flex-col items-center rounded-2xl border border-[#ebe5dc] bg-white/90 p-6 shadow-sm dark:border-[#454440] dark:bg-[#2c2b29]/96">
          <div
            className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-[#5f7f6a]/35"
            style={{
              background:
                'conic-gradient(from 0deg, #5f7f6a 0% 42%, #e8dfd4 42% 100%)',
            }}
          >
            <div className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full bg-[#faf7f3] dark:bg-[#1f1e1c]">
              {report.totalScore != null ? (
                <>
                  <span className="onboarding-serif text-3xl font-bold tabular-nums text-[#2c2825] dark:text-[#f5f2ed]">
                    {report.totalScore}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7a6e66] dark:text-[#b8b0a6]">
                    Total
                  </span>
                </>
              ) : (
                <span className="px-2 text-center text-xs font-medium text-[#7a6e66] dark:text-[#b8b0a6]">
                  Total not detected in PDF
                </span>
              )}
            </div>
          </div>
          {report.totalPercentile ? (
            <p className="mt-4 text-center text-sm font-semibold text-[#5f7f6a] dark:text-[#9bc4a8]">
              {report.totalPercentile}
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#9a928a]">
            Section scores
          </h3>
          <ul className="mt-4 space-y-4">
            {report.sections.length === 0 ? (
              <li className="text-sm text-[#9a8b7e] dark:text-[#9a928a]">
                No section scores extracted — try a text-based PDF export.
              </li>
            ) : (
              report.sections.map((s) => {
                const pct =
                  s.scaledScore != null ?
                    Math.round(((s.scaledScore - 118) / (132 - 118)) * 100)
                  : null
                return (
                  <li
                    key={`${s.key}-${s.label}`}
                    className="group cursor-default rounded-xl border border-[#ebe5dc] bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-safe:hover:-translate-y-px motion-safe:hover:border-[#e0d8ce] motion-safe:hover:bg-[#fdfcfa] motion-safe:hover:shadow-[0_0_0_0.5px_rgba(60,42,30,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_-6px_rgba(62,47,35,0.09)] dark:border-[#454440] dark:bg-[#2c2b29]/96 dark:motion-safe:hover:border-[#5c5a56] dark:motion-safe:hover:bg-[#383633] dark:motion-safe:hover:shadow-[0_6px_20px_-6px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#2c2825] dark:text-[#eae8e4]">
                        {s.label}
                      </span>
                      <div className="flex items-baseline gap-2">
                        {s.scaledScore != null ? (
                          <span className="onboarding-serif text-xl font-semibold tabular-nums text-[#2c2825] dark:text-[#f5f2ed]">
                            {s.scaledScore}
                          </span>
                        ) : (
                          <span className="text-sm text-[#9a8b7e] dark:text-[#9a928a]">—</span>
                        )}
                        {s.percentile ? (
                          <span className="text-xs text-[#7a6e66] dark:text-[#c4bdb4]">
                            {s.percentile}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {s.correct != null && s.total != null ? (
                      <p className="mt-1 text-xs text-[#7a6e66] dark:text-[#c4bdb4]">
                        {s.correct}/{s.total} correct
                      </p>
                    ) : null}
                    {pct !== null ? (
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-[10px] text-[#9a8b7e] dark:text-[#9a928a]">
                          <span>118</span>
                          <span>132 scale</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0ebe4] transition-colors duration-200 ease-out group-hover:bg-[#ebe8e3] dark:bg-[#3a3634] dark:group-hover:bg-[#454240]">
                          <div
                            className={`h-full rounded-full ${scoreColor(pct)}`}
                            style={{
                              width: `${Math.min(100, Math.max(4, pct))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </section>

      {report.subjectBreakdown.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#9a928a]">
            By subject (from report)
          </h3>
          <ul className="mt-4 space-y-3">
            {report.subjectBreakdown.map((row) => (
              <li
                key={row.name}
                className="group cursor-default rounded-xl border border-transparent px-3 py-2.5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-safe:hover:-translate-y-px motion-safe:hover:border-[#e8e4dd] motion-safe:hover:bg-white/85 motion-safe:hover:shadow-[0_0_0_0.5px_rgba(60,42,30,0.06),0_1px_2px_rgba(0,0,0,0.03),0_5px_18px_-5px_rgba(62,47,35,0.08)] dark:motion-safe:hover:border-[#454440] dark:motion-safe:hover:bg-[#353432]/90 dark:motion-safe:hover:shadow-[0_5px_18px_-5px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-[#3d3835] dark:text-[#eae8e4]">
                    {row.name}
                    {row.questionCount != null ?
                      ` (${row.questionCount})`
                    : ''}
                  </span>
                  {row.percentCorrect != null ? (
                    <span className="tabular-nums text-[#5f7f6a] dark:text-[#9bc4a8]">
                      {row.percentCorrect.toFixed(1)}% correct
                    </span>
                  ) : (
                    <span className="text-[#9a8b7e] dark:text-[#9a928a]">—</span>
                  )}
                </div>
                <div className="mt-1.5">
                  <BarStack pctCorrect={row.percentCorrect} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.passageHighlights.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#9a928a]">
            Passage & discrete highlights
          </h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {report.passageHighlights.map((p, i) => (
              <li
                key={`${p.section}-${p.label}-${i}`}
                className="rounded-lg border border-[#ebe5dc] bg-[#faf9f7] px-3 py-2 text-sm dark:border-[#454440] dark:bg-[#2c2b29]/96"
              >
                <span className="text-xs font-semibold text-[#5f7f6a] dark:text-[#9bc4a8]">
                  {p.section}
                </span>
                <div className="mt-0.5 flex justify-between gap-2 text-[#3d3835] dark:text-[#eae8e4]">
                  <span>{p.label}</span>
                  <span className="tabular-nums font-semibold">
                    {p.correct}/{p.total}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#d4e4f9] bg-[#f4f8fd] p-5 dark:border-[#2a3f5c] dark:bg-[#1a2436] sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a5f] dark:text-[#93c5fd]">
          Coach summary
        </h3>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#2c2825] dark:text-[#e2e8f0]">
          {report.coachSummary}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#cfe5d6] bg-[#f4faf6] p-5 dark:border-[#3d5244]/90 dark:bg-[#2c2b29]/96">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#166534] dark:text-[#86efac]">
            Strengths
          </h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#14532d] dark:text-[#bbf7d0]">
            {report.strengths.length ?
              report.strengths.map((s) => <li key={s}>{s}</li>)
            : <li className="list-none text-[#7a6e66] dark:text-[#9a928a]">—</li>}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#fecaca] bg-[#fff5f5] p-5 dark:border-[#6b3a3a]/90 dark:bg-[#2c2b29]/96">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#b91c1c] dark:text-[#fca5a5]">
            Growth areas
          </h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#7f1d1d] dark:text-[#fecaca]">
            {report.growthAreas.length ?
              report.growthAreas.map((s) => <li key={s}>{s}</li>)
            : <li className="list-none text-[#7a6e66] dark:text-[#9a928a]">—</li>}
          </ul>
        </section>
      </div>

      {report.studyPriorities.length > 0 ? (
        <section className="rounded-2xl border border-[#e8dfd4] bg-white/90 p-5 dark:border-[#454440] dark:bg-[#2c2b29]/96">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#9a928a]">
            Suggested study priorities
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#3d3835] dark:text-[#eae8e4]">
            {report.studyPriorities.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <details className="rounded-xl border border-[#e8dfd4] bg-[#faf9f7] p-4 text-xs dark:border-[#454440] dark:bg-[#2c2b29]/96">
        <summary className="cursor-pointer font-semibold text-[#7a6e66] dark:text-[#c4bdb4]">
          Extracted text preview (debug)
        </summary>
        <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-[#9a8b7e] dark:text-[#9a928a]">
          {report.textExcerpt}
        </p>
      </details>
    </div>
  )
}
