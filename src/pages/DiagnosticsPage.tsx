import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DiagnosticImportedReportView } from '../components/DiagnosticImportedReportView'
import { useProfile } from '../context/useProfile'
import { analyzeDiagnosticPdfText } from '../lib/geminiDiagnosticReport'
import { extractPdfPlainText } from '../utils/mcatPdfScore'

export function DiagnosticsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const flow = params.get('flow')
  const { profile, setProfile } = useProfile()
  const pdfName = profile.diagnosticReportPdfName
  const report = profile.importedDiagnosticReport

  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (flow === 'take') {
      navigate('/diagnostics/test', { replace: true })
    }
  }, [flow, navigate])

  const analyzeFile = async (file: File) => {
    setBusy(true)
    setErr(null)
    try {
      const text = await extractPdfPlainText(file)
      const next = await analyzeDiagnosticPdfText(text, file.name)
      setProfile({
        diagnosticReportPdfName: file.name,
        importedDiagnosticReport: next,
        ...(next.totalScore != null ? { baselineScore: next.totalScore } : {}),
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Analysis failed.')
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const ok =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    if (!ok) {
      setErr('Please choose a PDF file.')
      return
    }
    await analyzeFile(file)
  }

  if (flow === 'take') {
    return null
  }

  const importFlow = flow === 'import'

  return (
    <div className="onboarding-shell relative min-h-dvh">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-hidden
        onChange={onFile}
      />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="absolute -left-20 top-[32%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-sm font-semibold text-[#5f7f6a] no-underline hover:text-[#2c2825] dark:text-[#c8edd4] dark:hover:text-[#fcfcfb]"
          >
            ← Home
          </Link>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="shell-nav-btn text-sm font-semibold"
          >
            Dashboard
          </button>
        </div>

        {!importFlow ? (
          <>
            <h1 className="onboarding-serif text-2xl font-semibold tracking-tight text-[#2c2825] dark:text-[#fafaf8] sm:text-3xl">
              Diagnostics
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#7a6e66] dark:text-[#ebe7e0]">
              Take a full-length diagnostic here, or import your score and
              report if you&apos;ve already completed one elsewhere.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/diagnostics/test')}
                className="rounded-full bg-[#2c2825] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1f1c1a]"
              >
                Mini diagnostic (10 Q)
              </button>
              <button
                type="button"
                onClick={() => navigate('/diagnostics?flow=import')}
                className="rounded-full border border-[#d4c9be] bg-white px-6 py-2.5 text-sm font-semibold text-[#2c2825] hover:bg-[#faf9f7]"
              >
                Import score PDF
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="onboarding-serif text-2xl font-semibold tracking-tight text-[#2c2825] dark:text-[#fafaf8] sm:text-3xl">
              Imported diagnostic report
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#7a6e66] dark:text-[#ebe7e0]">
              {pdfName ?
                <>File: <strong className="text-[#3d3835] dark:text-[#f6f5f3]">{pdfName}</strong></>
              : 'Upload a text-based score report PDF (Blueprint, AAMC, etc.).'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-[#5f7f6a] bg-[#f0f6f2] px-5 py-2.5 text-sm font-semibold text-[#1a3d2e] hover:bg-[#e4efe6] disabled:opacity-50"
              >
                {report ? 'Replace PDF & re-analyze' : 'Choose PDF to analyze'}
              </button>
              {busy ? (
                <span className="text-sm text-[#7a6e66] dark:text-[#e3dfd8]">Analyzing with Gemini…</span>
              ) : null}
            </div>

            {err ? (
              <p className="mt-4 text-sm text-[#b91c1c]" role="alert">
                {err}
              </p>
            ) : null}

            {report ? (
              <div className="mt-10 rounded-2xl border border-[#e8dfd4] bg-white/90 p-5 shadow-sm dark:border-[#454440] dark:bg-[#262523]/95 sm:p-8">
                <DiagnosticImportedReportView report={report} />
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-[#d4c9be] bg-white/60 p-8 text-center dark:border-[#5c5a56] dark:bg-[#262523]/70">
                <p className="text-sm text-[#7a6e66] dark:text-[#ebe7e0]">
                  No analysis yet. Choose a PDF above — we&apos;ll extract text
                  on your device and send it to Gemini to build a Blueprint-style
                  summary (sections, subjects, passages, and study priorities).
                </p>
                <p className="mt-3 text-xs text-[#9a8b7e] dark:text-[#d2cdc4]">
                  Requires{' '}
                  <code className="rounded bg-[#f5f0eb] px-1 dark:bg-[#3a3836] dark:text-[#f6f5f3]">
                    VITE_GEMINI_API_KEY
                  </code>{' '}
                  in{' '}
                  <code className="rounded bg-[#f5f0eb] px-1 dark:bg-[#3a3836] dark:text-[#f6f5f3]">
                    .env.local
                  </code>
                  .
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
