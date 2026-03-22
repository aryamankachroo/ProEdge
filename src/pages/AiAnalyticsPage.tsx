import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  analyzePracticeReportWithGemini,
  isGeminiAnalyticsAvailable,
} from '../lib/geminiPdfAnalytics'
import { applyDemoScoresWhenGeminiUnavailable } from '../lib/analyticsDemoFallback'
import { analyzePracticeReportText } from '../lib/practicePdfAnalytics'
import type { AiAnalyticsSnapshot } from '../types/analytics'
import { useProfile } from '../context/useProfile'
import { extractPdfPlainText } from '../utils/mcatPdfScore'

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18V12" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  )
}

export function AiAnalyticsPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<AiAnalyticsSnapshot | null>(
    () => profile.lastAiAnalytics,
  )

  const processFile = async (file: File) => {
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('Please upload a PDF.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const text = await extractPdfPlainText(file)
      if (!text.trim()) {
        setError(
          'No text found in that PDF. It may be scanned images only — export a text-based report from your prep platform.',
        )
        setLoading(false)
        return
      }
      let usedGemini = false
      let base = analyzePracticeReportText(text)
      if (isGeminiAnalyticsAvailable()) {
        try {
          base = await analyzePracticeReportWithGemini(text)
          usedGemini = true
        } catch (err) {
          console.warn('[ProEdge] Gemini PDF analytics failed, using heuristics:', err)
          base = analyzePracticeReportText(text)
        }
      }
      if (!usedGemini) {
        base = applyDemoScoresWhenGeminiUnavailable(base)
      }
      const snap: AiAnalyticsSnapshot = {
        ...base,
        analyzedAt: new Date().toISOString(),
        sourceFileName: file.name,
      }
      setSnapshot(snap)
      setProfile({ lastAiAnalytics: snap })
    } catch {
      setError(
        'Could not read that PDF. It may be encrypted; try another export or download.',
      )
    } finally {
      setLoading(false)
    }
  }

  const onInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) await processFile(f)
    e.target.value = ''
  }

  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) await processFile(f)
  }

  return (
    <div className="onboarding-shell min-h-dvh pb-20">
      <header className="app-shell-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link to="/" className="app-shell-brand" aria-label="ProEdge home">
            ProEdge
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-[#5f7f6a]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="shell-nav-btn"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/calendar')}
              className="shell-nav-btn"
            >
              Calendar
            </button>
            <span className="shell-nav-btn-active">AI analytics</span>
            <button
              type="button"
              onClick={() => navigate('/journal')}
              className="shell-nav-btn"
            >
              AI journal
            </button>
            <button
              type="button"
              onClick={() => navigate('/study-plan')}
              className="shell-nav-btn"
            >
              Study plan
            </button>
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="shell-nav-btn"
            >
              Retake diagnostic
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] dark:text-[#f5f2ed] sm:text-4xl">
          AI analytics
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7a6e66] dark:text-[#c4bdb4] sm:text-base">
          Import a <strong>practice MCAT</strong> or score-report PDF. Text is
          extracted in the browser; with{' '}
          <code className="rounded bg-[#ebe5dc] px-1 py-0.5 text-[13px] dark:bg-[#383633] dark:text-[#e8e6e1]">
            VITE_GEMINI_API_KEY
          </code>{' '}
          we use <strong>Gemini</strong> to read section scores and strengths /
          gaps even when headings don&apos;t match fixed patterns. Without a key,
          we fall back to on-device heuristics.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-hidden
          onChange={onInput}
        />

        <button
          type="button"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-8 flex w-full max-w-xl flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 transition ${
            dragOver
              ? 'border-[#5f7f6a] bg-[#f0f6f2] dark:bg-[#243529]/55'
              : 'border-[#d4c9be] bg-white/80 hover:border-[#b8a99a] dark:border-[#5c5a56] dark:bg-[#2c2b29]/96 dark:hover:border-[#7a7268]'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <PdfIcon className="text-[#5f7f6a] dark:text-[#9bc4a8]" />
          <span className="mt-4 text-sm font-semibold text-[#2c2825] dark:text-[#f5f2ed]">
            {loading ? 'Analyzing PDF…' : 'Drop a report PDF here or click to browse'}
          </span>
          <span className="mt-2 text-center text-xs text-[#7a6e66] dark:text-[#b8b0a6]">
            Works best with text-based exports (AAMC, Blueprint, UWorld summaries,
            etc.)
          </span>
        </button>

        {error ? (
          <p className="mt-4 max-w-xl text-sm text-[#b91c1c] dark:text-[#fca5a5]" role="alert">
            {error}
          </p>
        ) : null}

        {snapshot ? (
          <div className="mt-12 space-y-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#ebe5dc] pb-4 dark:border-[#454440]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#c4bdb4]">
                  Last analysis
                  {snapshot.engine === 'gemini_v1' ? (
                    <span className="ml-2 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1a73e8] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
                      Gemini
                    </span>
                  ) : snapshot.engine === 'demo_v1' ? (
                    <span className="ml-2 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b45309]">
                      Demo scores
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-[#3d3835] dark:text-[#eae8e4]">
                  <span className="font-medium">{snapshot.sourceFileName}</span>
                  <span className="text-[#7a6e66] dark:text-[#b8b0a6]">
                    {' '}
                    ·{' '}
                    {new Date(snapshot.analyzedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </p>
              </div>
              {snapshot.totalScore != null ? (
                <p className="onboarding-serif text-2xl font-semibold text-[#3b82f6]">
                  Total {snapshot.totalScore}
                </p>
              ) : (
                <p className="text-sm text-[#9a8b7e]">Total score not detected</p>
              )}
            </div>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e]">
                Section estimates
              </h2>
                <p className="mt-1 text-xs text-[#7a6e66]">
                  {snapshot.engine === 'gemini_v1' ?
                    'Extracted with Gemini from report text (scores 118–132 per section, 472–528 total when present).'
                  : snapshot.engine === 'demo_v1' ?
                    'Illustrative section scores — Gemini was not available or failed; totals match your PDF when a total was detected.'
                  : 'Parsed from headings + nearby 118–132 numbers. May be wrong if the layout differs.'}
                </p>
              <ul className="mt-4 space-y-3">
                {snapshot.sections.map((row) => (
                  <li
                    key={row.label}
                    className="rounded-xl border border-[#ebe5dc] bg-white/90 px-4 py-3 dark:border-[#454440] dark:bg-[#2c2b29]/96"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#2c2825] dark:text-[#f5f2ed]">
                        {row.label}
                      </span>
                      <span className="onboarding-serif text-lg tabular-nums text-[#5f7f6a] dark:text-[#9bc4a8]">
                        {row.scaledScore ?? '—'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#7a6e66] dark:text-[#c4bdb4]">{row.detail}</p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#cfe5d6] bg-[#f4faf6] p-5 dark:border-[#3d5244]/90 dark:bg-[#2c2b29]/96 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#166534] dark:text-[#86efac]">
                  Where you showed strength
                </h2>
                <ul className="mt-4 space-y-4">
                  {snapshot.strengths.map((s) => (
                    <li key={s.title}>
                      <p className="font-semibold text-[#14532d] dark:text-[#bbf7d0]">{s.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#3d3835] dark:text-[#e8e6e1]">
                        {s.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-[#fecaca] bg-[#fff5f5] p-5 dark:border-[#6b3a3a]/90 dark:bg-[#2c2b29]/96 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#b91c1c] dark:text-[#fca5a5]">
                  Topics to tighten
                </h2>
                <ul className="mt-4 space-y-4">
                  {snapshot.weaknesses.map((s) => (
                    <li key={s.title}>
                      <p className="font-semibold text-[#7f1d1d] dark:text-[#fecaca]">{s.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#3d3835] dark:text-[#e8e6e1]">
                        {s.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <details className="rounded-xl border border-[#e8dfd4] bg-[#faf9f7] p-4 text-sm dark:border-[#454440] dark:bg-[#2c2b29]/96">
              <summary className="cursor-pointer font-semibold text-[#5c534c] dark:text-[#c4bdb4]">
                Extracted text preview (debug)
              </summary>
              <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-[#7a6e66] dark:text-[#9a928a]">
                {snapshot.excerpt}
                {snapshot.excerpt.length >= 720 ? '…' : ''}
              </p>
            </details>
          </div>
        ) : (
          <p className="mt-10 text-sm text-[#9a8b7e] dark:text-[#a89e94]">
            No report analyzed yet — upload a PDF to generate your first insight
            sheet.
          </p>
        )}
      </div>
    </div>
  )
}
