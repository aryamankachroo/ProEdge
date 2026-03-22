import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile'
import { extractMcatTotalFromPdfFile } from '../utils/mcatPdfScore'
import { saveManualScore, uploadDiagnosticPdf } from '../lib/api'

function ImportPdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

export function PostQuestionnairePage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [extractedScore, setExtractedScore] = useState<number | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [manualScore, setManualScore] = useState(String(profile.baselineScore))
  const [dragOver, setDragOver] = useState(false)

  const onPickPdf = () => fileRef.current?.click()

  const processPdfFile = async (file: File) => {
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setParseError('Please choose a PDF file.')
      setExtractedScore(null)
      setPdfName(file.name)
      return
    }
    setLoading(true)
    setParseError(null)
    setExtractedScore(null)
    setPdfName(file.name)
    try {
      // Try server-side parsing first (saves all 4 section scores to Snowflake)
      let score: number | null = null
      try {
        const serverScores = await uploadDiagnosticPdf(file)
        score = serverScores.totalScore
      } catch {
        // Server unavailable — fall back to client-side PDF.js extraction
        const result = await extractMcatTotalFromPdfFile(file)
        score = result.score
      }

      if (score != null) {
        setExtractedScore(score)
        setManualScore(String(score))
      } else {
        setParseError(
          "We couldn't find a total score (472-528) in that PDF. Try another export, or enter your score below and continue.",
        )
      }
    } catch {
      setParseError(
        "Could not read that PDF. It may be encrypted or image-only; try a text-based export from AAMC.",
      )
    } finally {
      setLoading(false)
    }
  }

  const onFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processPdfFile(file)
    e.target.value = ''
  }

  const onDropPdf = async (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processPdfFile(file)
  }

  const applyBaseline = (score: number) => {
    const n = Math.min(528, Math.max(472, Math.round(score)))
    setProfile({ baselineScore: n })
    // Persist manual score to backend (fire-and-forget)
    saveManualScore(n).catch((err) =>
      console.warn('[ProEdge] Failed to save manual score:', err),
    )
  }

  const applyExtractedOrManual = () => {
    const n = Number.parseInt(manualScore, 10)
    if (Number.isFinite(n) && n >= 472 && n <= 528) {
      applyBaseline(n)
      navigate('/study-plan')
    }
  }

  const manualValid = (() => {
    const n = Number.parseInt(manualScore, 10)
    return Number.isFinite(n) && n >= 472 && n <= 528
  })()

  return (
    <div className="onboarding-shell relative min-h-dvh">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="absolute -left-20 top-[28%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
        <div className="absolute bottom-24 right-[-5%] h-56 w-56 rounded-full bg-[#f0d4c4]/50 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-28 pt-8 md:px-8 md:pb-16 md:pt-10">
        <header className="mb-2">
          <Link
            to="/"
            className="onboarding-serif inline-block text-lg font-semibold tracking-tight text-[#4a423c] no-underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f7f6a] focus-visible:ring-offset-2 rounded-sm"
            aria-label="ProEdge home"
          >
            ProEdge
          </Link>
        </header>

        <h1 className="onboarding-serif mb-3 text-[1.65rem] font-semibold leading-[1.2] text-[#2c2825] md:text-3xl">
          Score from your report
        </h1>
        <p className="mb-8 max-w-xl text-[0.95rem] leading-relaxed text-[#6b5f56]">
          Import an official score report PDF and we&apos;ll pull your total
          score when possible. If import doesn&apos;t work, continue with a
          diagnostic or your questionnaire-based study plan.
        </p>

        <SoftPanel className="mb-6">
          <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
            Import PDF report
          </p>
          <p className="mb-4 text-sm text-[#8a7b70]">
            AAMC PDFs with selectable text work best. Encrypted or scanned-only
            files may not parse.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={onFileInput}
          />
          <div
            onDragEnter={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOver(false)
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={onDropPdf}
            className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? 'border-[#5f7f6a] bg-[#f0f5f1]/90'
                : 'border-[#d4c8bc] bg-[#faf7f3]/50'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ebe3d9]/80 text-[#5f7f6a]">
              <ImportPdfIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#4a423c]">
                Import your score report
              </p>
              <p className="mt-1 text-sm text-[#8a7b70]">
                PDF from AAMC or your testing platform
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPickPdf()
              }}
              disabled={loading}
              aria-label="Import PDF score report"
              className="inline-flex items-center gap-2 rounded-full bg-[#2c2825] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1c1a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImportPdfIcon className="h-[18px] w-[18px]" />
              {loading ? 'Reading PDF…' : 'Import PDF'}
            </button>
            <p className="text-xs text-[#9a8b7e]">or drop a file here</p>
            {pdfName ? (
              <span className="max-w-full truncate text-sm font-medium text-[#5f7f6a]">
                {pdfName}
              </span>
            ) : null}
          </div>
          {extractedScore != null ? (
            <p className="mt-4 rounded-2xl bg-[#f0f5f1] px-4 py-3 text-sm font-semibold text-[#2d3f32]">
              Detected total score:{' '}
              <span className="onboarding-serif text-xl tabular-nums">
                {extractedScore}
              </span>
            </p>
          ) : null}
          {parseError ? (
            <p className="mt-4 text-sm leading-relaxed text-[#8a4a3a]">
              {parseError}
            </p>
          ) : null}
        </SoftPanel>

        <SoftPanel className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#5a4f47]">
            Baseline total (manual)
          </p>
          <p className="mb-4 text-sm text-[#8a7b70]">
            Use this if the PDF didn&apos;t parse or you already know your score.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="pq-baseline" className="sr-only">
                Baseline MCAT total
              </label>
              <input
                id="pq-baseline"
                type="number"
                min={472}
                max={528}
                className="onboarding-input w-32"
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
              />
              <p className="mt-1 text-xs text-[#9a8b7e]">472–528</p>
            </div>
            <button
              type="button"
              disabled={!manualValid}
              onClick={applyExtractedOrManual}
              className="rounded-full bg-[#5f7f6a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(95,127,106,0.45)] transition hover:bg-[#536b5d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save &amp; open study plan
            </button>
          </div>
        </SoftPanel>

        <div className="mb-3 text-sm font-semibold text-[#5a4f47]">
          Or continue without locking in a score yet
        </div>
        <p className="mb-5 text-sm text-[#8a7b70]">
          Take a diagnostic for a fresh baseline, or jump straight to the plan we
          generate from your hours, exam date, and weak sections.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/diagnostic')}
            className="rounded-full border-2 border-[#e8dfd4] bg-white/90 px-6 py-3 text-sm font-semibold text-[#4a423c] shadow-sm transition hover:border-[#d4c8bc]"
          >
            Continue to diagnostic exam
          </button>
          <button
            type="button"
            onClick={() => navigate('/study-plan')}
            className="rounded-full border-2 border-[#5f7f6a]/40 bg-[#f0f5f1] px-6 py-3 text-sm font-semibold text-[#2d3f32] shadow-sm transition hover:bg-[#e5ede7]"
          >
            Open study plan (questionnaire)
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-10 self-start text-sm font-semibold text-[#9a8b7e] hover:text-[#6b5f56]"
        >
          ← Home
        </button>
      </div>
    </div>
  )
}
