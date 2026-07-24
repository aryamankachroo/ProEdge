import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useProfile } from '../context/useProfile'

export function DiagnosticsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const flow = params.get('flow')

  useEffect(() => {
    if (flow === 'take') {
      navigate('/diagnostics/test', { replace: true })
    }
  }, [flow, navigate])
  const { profile } = useProfile()
  const pdfName = profile.diagnosticReportPdfName

  if (flow === 'take') {
    return null
  }

  const blurb =
    flow === 'import'
      ? pdfName
        ? `We’ll use your report: ${pdfName}`
        : 'Choose a PDF report from your computer to import your diagnostic score.'
      : "Take a full-length diagnostic here, or import your score and report if you've already completed one elsewhere."

  return (
    <AppShell active="diagnostic">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-white/40 bg-white/25 p-6 shadow-[0_8px_32px_rgba(31,38,135,0.15)] backdrop-blur-xl sm:p-8">
          <h1 className="onboarding-serif text-2xl font-semibold tracking-tight text-[#2c2825] sm:text-3xl">
            Diagnostics
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#7a6e66]">{blurb}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-8 inline-flex w-fit text-sm font-semibold text-[#5f7f6a] underline-offset-4 hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </AppShell>
  )
}
