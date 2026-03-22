import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
    <div className="onboarding-shell relative min-h-dvh">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e8b4a2]/40 blur-[80px]" />
        <div className="absolute -left-20 top-[32%] h-72 w-72 rounded-full bg-[#a8c5b4]/45 blur-[72px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <h1 className="onboarding-serif text-2xl font-semibold tracking-tight text-[#2c2825] sm:text-3xl">
          Diagnostics
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#7a6e66]">{blurb}</p>
        <Link
          to="/"
          className="mt-8 inline-flex w-fit text-sm font-semibold text-[#5f7f6a] underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
