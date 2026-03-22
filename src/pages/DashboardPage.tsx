import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  DIAGNOSTIC_SECTION_LABELS,
  DIAGNOSTIC_SECTION_SHORT,
  DIAGNOSTIC_WEAK_HINTS,
  STUDY_STATUS_LABELS,
  type DiagnosticSectionKey,
  type DiagnosticSummary,
} from '../types/profile'
import { useProfile } from '../context/useProfile'
import {
  fetchAnalyticsSummary,
  fetchSectionBreakdown,
  fetchScoreTrend,
  fetchStudyStreak,
  type AnalyticsSummary,
  type SectionBreakdown,
  type ScoreTrend,
  type StudyStreak,
} from '../lib/api'

const SECTION_ORDER: DiagnosticSectionKey[] = [
  'chemPhys',
  'cars',
  'bioBiochem',
  'psychSoc',
]

function pct(correct: number, total: number) {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

function daysUntilExam(examDateIso: string): number | null {
  if (!examDateIso) return null
  const exam = new Date(`${examDateIso}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((exam.getTime() - today.getTime()) / 86_400_000)
}

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 120
  const h = 36
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w
    const y = h - ((v - min) / span) * (h - 4) - 2
    return `${x},${y}`
  })
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 overflow-visible"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(' ')}
      />
    </svg>
  )
}

function DonutRing({
  pctValue,
  size = 120,
}: {
  pctValue: number
  size?: number
}) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (pctValue / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e8dfd4"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

function SectionRadar({ summary }: { summary: DiagnosticSummary }) {
  const n = SECTION_ORDER.length
  const pcts = SECTION_ORDER.map((k) =>
    pct(summary.sections[k].correct, summary.sections[k].total),
  )
  const cx = 50
  const cy = 50
  const rMax = 38
  const points = pcts
    .map((p, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
      const rr = (p / 100) * rMax
      return `${cx + rr * Math.cos(ang)},${cy + rr * Math.sin(ang)}`
    })
    .join(' ')

  const ring = Array.from({ length: 4 }, (_, ri) => {
    const rr = ((ri + 1) / 4) * rMax
    return (
      <circle
        key={ri}
        cx={cx}
        cy={cy}
        r={rr}
        fill="none"
        stroke="#e8dfd4"
        strokeWidth="0.35"
      />
    )
  })

  const axes = SECTION_ORDER.map((_, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const x2 = cx + rMax * Math.cos(ang)
    const y2 = cy + rMax * Math.sin(ang)
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke="#e8dfd4"
        strokeWidth="0.4"
      />
    )
  })

  const labels = SECTION_ORDER.map((k, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const lr = rMax + 8
    const x = cx + lr * Math.cos(ang)
    const y = cy + lr * Math.sin(ang)
    return (
      <text
        key={k}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-[#7a6e66] text-[2.8px] font-medium"
        style={{ fontSize: '2.8px' }}
      >
        {DIAGNOSTIC_SECTION_SHORT[k]}
      </text>
    )
  })

  return (
    <svg viewBox="0 0 100 100" className="h-44 w-full max-w-[200px] sm:h-52">
      {ring}
      {axes}
      <polygon
        points={points}
        fill="rgba(59, 130, 246, 0.18)"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {labels}
    </svg>
  )
}

function strongestWeakest(summary: DiagnosticSummary) {
  let best: DiagnosticSectionKey = 'chemPhys'
  let worst: DiagnosticSectionKey = 'chemPhys'
  let bestP = -1
  let worstP = 101
  for (const k of SECTION_ORDER) {
    const p = pct(summary.sections[k].correct, summary.sections[k].total)
    if (p > bestP) {
      bestP = p
      best = k
    }
    if (p < worstP) {
      worstP = p
      worst = k
    }
  }
  return { best, bestP, worst, worstP }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const {
    name,
    targetScore,
    examDate,
    studyStatus,
    diagnosticSummary,
    hoursPerDay,
  } = profile

  // Backend analytics state — fetched on mount, used to enrich the dashboard
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null)
  const [sectionBreakdown, setSectionBreakdown] = useState<SectionBreakdown | null>(null)
  const [scoreTrend, setScoreTrend] = useState<ScoreTrend[]>([])
  const [streak, setStreak] = useState<StudyStreak | null>(null)

  useEffect(() => {
    // Fetch all analytics in parallel; failures are non-fatal (dashboard works from localStorage too)
    fetchAnalyticsSummary().then(setAnalyticsSummary).catch(() => {})
    fetchSectionBreakdown().then(setSectionBreakdown).catch(() => {})
    fetchScoreTrend().then((r) => setScoreTrend(r.trend)).catch(() => {})
    fetchStudyStreak().then(setStreak).catch(() => {})
  }, [])

  const daysLeft = daysUntilExam(examDate)
  const overallPct = diagnosticSummary
    ? pct(
        diagnosticSummary.overallCorrect,
        diagnosticSummary.overallTotal,
      )
    : null

  const studyLabel =
    studyStatus && studyStatus in STUDY_STATUS_LABELS
      ? STUDY_STATUS_LABELS[studyStatus as keyof typeof STUDY_STATUS_LABELS]
      : 'Not set'

  const { best, bestP, worst, worstP } = diagnosticSummary
    ? strongestWeakest(diagnosticSummary)
    : {
        best: 'chemPhys' as const,
        bestP: 0,
        worst: 'chemPhys' as const,
        worstP: 0,
      }

  const sparkBase = overallPct ?? 35
  const sparkQuestions = [
    Math.max(10, sparkBase - 24),
    Math.max(12, sparkBase - 16),
    Math.max(15, sparkBase - 8),
    Math.max(18, sparkBase - 4),
    sparkBase,
  ]
  const sparkScore = [
    Math.max(40, sparkBase - 20),
    Math.max(45, sparkBase - 12),
    sparkBase - 4,
    sparkBase + 2,
    sparkBase,
  ]

  const displayName = name.trim() || 'there'

  return (
    <div className="onboarding-shell min-h-dvh pb-16">
      <header className="sticky top-0 z-10 border-b border-[#e8dfd4]/80 bg-[#faf7f3]/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#1a1816] no-underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f7f6a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f3] rounded-sm"
            aria-label="ProEdge home"
          >
            ProEdge
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-[#5f7f6a]">
            <span className="text-[#2c2825]">Dashboard</span>
            <button
              type="button"
              onClick={() => navigate('/calendar')}
              className="hover:text-[#2c2825]"
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="hover:text-[#2c2825]"
            >
              AI analytics
            </button>
            <button
              type="button"
              onClick={() => navigate('/journal')}
              className="hover:text-[#2c2825]"
            >
              AI journal
            </button>
            <button
              type="button"
              onClick={() => navigate('/study-plan')}
              className="hover:text-[#2c2825]"
            >
              Study plan
            </button>
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="hover:text-[#2c2825]"
            >
              Retake diagnostic
            </button>
            <Link to="/" className="hover:text-[#2c2825]">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] sm:text-4xl">
          Welcome back, {displayName}
        </h1>
        <p className="mt-2 text-sm text-[#7a6e66] sm:text-base">
          Here&apos;s your MCAT prep dashboard — goals, diagnostic snapshot, and
          where to focus next.
        </p>

        {/* Hero banner */}
        <section className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#c5d9f5] via-[#d4e4f9] to-[#e8d4f0] p-6 shadow-[0_16px_48px_-24px_rgba(80,100,140,0.35)] sm:p-8">
          <p className="text-lg font-semibold text-[#1e3a5f] sm:text-xl">
            {timeGreeting()}!{' '}
            {diagnosticSummary
              ? `Your last diagnostic was ${overallPct}% — stack short review blocks on weak topics.`
              : 'Take the mini diagnostic to unlock section-level insights.'}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#2c4a6e]/90">
            {diagnosticSummary
              ? `Aim for ${hoursPerDay} hr study days and steady weekly volume — small sessions beat rare marathons.`
              : 'Complete the 10-question preview to see strongest and weakest sections on this dashboard.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#3b82f6] px-3 py-1 text-xs font-semibold text-white">
              Daily practice
            </span>
            <span className="rounded-full bg-[#ea8c55] px-3 py-1 text-xs font-semibold text-white">
              Target focus
            </span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#1e3a5f]/75">
            Tip: tie each study block to one weak topic from your diagnostic —
            specificity beats vague &quot;review science.&quot;
          </p>
        </section>

        {/* KPI row */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                Goal score
              </span>
              <span className="text-lg text-[#3b82f6]" aria-hidden>
                ◎
              </span>
            </div>
            <p className="onboarding-serif mt-2 text-2xl font-semibold text-[#3b82f6]">
              {targetScore >= 472 ? targetScore : 'Not set'}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">MCAT target</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                Days until exam
              </span>
              <span className="text-lg text-[#3b82f6]" aria-hidden>
                ◷
              </span>
            </div>
            <p className="onboarding-serif mt-2 text-2xl font-semibold text-[#3b82f6]">
              {daysLeft !== null && daysLeft > 0 ? daysLeft : 'Not set'}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">
              {examDate ? `Exam ${examDate}` : 'Add a date in onboarding'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                Study streak
              </span>
              <span className="text-lg text-[#7c6bcf]" aria-hidden>
                🔥
              </span>
            </div>
            <p className="onboarding-serif mt-2 text-xl font-semibold leading-snug text-[#7c6bcf]">
              {streak ? `${streak.streak} day${streak.streak === 1 ? '' : 's'}` : studyLabel}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">
              {streak
                ? streak.lastStudyDate
                  ? `Last: ${streak.lastStudyDate}`
                  : 'No sessions logged yet'
                : 'From questionnaire'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8b7e]">
                Diagnostic accuracy
              </span>
              <span className="text-lg text-[#db2777]" aria-hidden>
                ↗
              </span>
            </div>
            <p className="onboarding-serif mt-2 text-2xl font-semibold text-[#db2777]">
              {analyticsSummary?.scores.totalTests
                ? `${Math.round((analyticsSummary.scores.avgScore ?? 0))} avg`
                : overallPct !== null
                  ? `${overallPct}%`
                  : '—'}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">
              {analyticsSummary?.scores.totalTests
                ? `${analyticsSummary.scores.totalTests} test${analyticsSummary.scores.totalTests === 1 ? '' : 's'} · high ${analyticsSummary.scores.highestScore ?? '—'}`
                : diagnosticSummary
                  ? `${diagnosticSummary.overallCorrect}/${diagnosticSummary.overallTotal} mini quiz`
                  : 'No run yet'}
            </p>
            <Sparkline
              values={
                scoreTrend.length >= 2
                  ? scoreTrend.map((t) => t.totalScore)
                  : sparkScore
              }
              color={overallPct !== null ? '#db2777' : '#cbd5e1'}
            />
          </div>
        </div>

        {/* Second row: performance + CTA */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_12px_40px_-16px_rgba(90,70,55,0.14)] sm:p-7">
            <h2 className="text-sm font-semibold text-[#2c2825]">
              Performance overview
            </h2>
            <p className="mt-1 text-xs text-[#7a6e66]">
              Overall accuracy and balance across sections.
            </p>
            {diagnosticSummary ? (
              <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
                <div className="flex flex-col items-center">
                  <div className="relative h-[120px] w-[120px] shrink-0">
                    <DonutRing pctValue={overallPct ?? 0} />
                    <span className="onboarding-serif absolute inset-0 flex items-center justify-center text-xl font-semibold text-[#1a1816]">
                      {overallPct}%
                    </span>
                  </div>
                  <p className="mt-2 text-center text-sm font-medium text-[#3b82f6]">
                    Target: {targetScore >= 472 ? `${targetScore}+` : 'set goal'}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <SectionRadar summary={diagnosticSummary} />
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-[#d4c9be] bg-[#faf9f7] p-8 text-center text-sm text-[#7a6e66]">
                Run the mini diagnostic to see your donut and radar charts.
                <button
                  type="button"
                  onClick={() => navigate('/diagnostics/test')}
                  className="mt-4 block w-full rounded-full bg-[#5f7f6a] py-2.5 text-sm font-semibold text-white"
                >
                  Start diagnostic
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_12px_40px_-16px_rgba(90,70,55,0.14)] sm:p-7">
            <div>
              <h2 className="text-sm font-semibold text-[#2c2825]">
                Recommended next step
              </h2>
              <p className="mt-1 text-xs text-[#7a6e66]">
                Short quiz-style review for your lowest section.
              </p>
              <div className="mt-8 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#cfe5d6] text-3xl text-[#2d5a40]">
                  ▶
                </div>
                <p className="mt-5 text-sm leading-relaxed text-[#3d3835]">
                  {diagnosticSummary ? (
                    <>
                      Focus on{' '}
                      <span className="font-semibold">
                        {DIAGNOSTIC_SECTION_LABELS[worst]}
                      </span>{' '}
                      — your lowest section ({worstP}% on the preview).
                    </>
                  ) : (
                    'Take the diagnostic so we can recommend a section to drill first.'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b82f6] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2563eb]"
            >
              <span aria-hidden>▶</span>
              {diagnosticSummary
                ? `Practice ${DIAGNOSTIC_SECTION_SHORT[worst]}`
                : 'Take mini diagnostic'}
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>

        {/* KPI-style questions card (matches reference dashboard) */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex justify-between">
              <span className="text-xs font-semibold uppercase text-[#9a8b7e]">
                Total sessions
              </span>
              <span className="text-[#3b82f6]">◇</span>
            </div>
            <p className="onboarding-serif mt-2 text-2xl font-semibold text-[#1a1816]">
              {analyticsSummary ? analyticsSummary.study.totalSessions : (diagnosticSummary?.overallTotal ?? 0)}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">
              {analyticsSummary
                ? `${Math.round((analyticsSummary.study.totalHours ?? 0) * 10) / 10} hrs total`
                : diagnosticSummary
                  ? `${diagnosticSummary.overallCorrect} correct`
                  : '—'}
            </p>
            <Sparkline
              values={
                analyticsSummary?.weeklyActivity.length
                  ? analyticsSummary.weeklyActivity.map((w) => w.sessions)
                  : sparkQuestions
              }
              color="#3b82f6"
            />
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex justify-between">
              <span className="text-xs font-semibold uppercase text-[#9a8b7e]">
                Average score
              </span>
              <span className="text-[#5f7f6a]">◇</span>
            </div>
            <p className="onboarding-serif mt-2 text-2xl font-semibold text-[#1a1816]">
              {analyticsSummary?.scores.avgScore
                ? Math.round(analyticsSummary.scores.avgScore)
                : overallPct !== null
                  ? `${overallPct}%`
                  : '—'}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">
              {analyticsSummary?.scores.totalTests
                ? `Across ${analyticsSummary.scores.totalTests} test${analyticsSummary.scores.totalTests === 1 ? '' : 's'}`
                : 'Mini diagnostic'}
            </p>
            <Sparkline
              values={
                scoreTrend.length >= 2
                  ? scoreTrend.map((t) => t.totalScore)
                  : sparkScore
              }
              color="#5f7f6a"
            />
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex justify-between">
              <span className="text-xs font-semibold uppercase text-[#9a8b7e]">
                Anki cards
              </span>
              <span className="text-[#ea8c55]">◇</span>
            </div>
            <p className="onboarding-serif mt-2 text-2xl font-semibold text-[#1a1816]">
              {analyticsSummary?.study.totalAnkiCards ?? (diagnosticSummary ? 'Complete' : '—')}
            </p>
            <p className="mt-1 text-xs text-[#7a6e66]">
              {analyticsSummary
                ? analyticsSummary.study.lastStudyDate
                  ? `Last: ${analyticsSummary.study.lastStudyDate}`
                  : 'No sessions yet'
                : diagnosticSummary
                  ? new Date(diagnosticSummary.completedAt).toLocaleString()
                  : 'No session yet'}
            </p>
            <p className="mt-3 text-xs italic text-[#9a8b7e]">
              {analyticsSummary
                ? 'Logged via progress tracker'
                : 'Trend lines are illustrative until more sessions exist.'}
            </p>
          </div>
        </div>

        {/* Diagnostic breakdown */}
        <section className="mt-10 rounded-2xl border border-[#e8dfd4] bg-[rgba(44,40,37,0.03)] p-6 sm:p-8">
          <h2 className="onboarding-serif text-xl font-semibold text-[#2c2825]">
            Diagnostic results summary
          </h2>
          <p className="mt-1 text-sm text-[#7a6e66]">
            {sectionBreakdown
              ? 'Average scores across all your diagnostics.'
              : 'Baseline performance from your last mini diagnostic.'}
          </p>
          {diagnosticSummary || sectionBreakdown ? (
            <ul className="mt-6 space-y-5">
              {SECTION_ORDER.map((key) => {
                // Use Snowflake averages when available, fall back to local mini-quiz
                const backendAvg =
                  key === 'cars'
                    ? sectionBreakdown?.averages.cars
                    : key === 'bioBiochem'
                      ? sectionBreakdown?.averages.bioBiochem
                      : key === 'chemPhys'
                        ? sectionBreakdown?.averages.chemPhys
                        : sectionBreakdown?.averages.psychSoc

                const localPct = diagnosticSummary
                  ? pct(
                      diagnosticSummary.sections[key].correct,
                      diagnosticSummary.sections[key].total,
                    )
                  : null

                const displayPct =
                  backendAvg != null
                    ? Math.round(((backendAvg - 118) / (132 - 118)) * 100)
                    : localPct

                const correct = diagnosticSummary?.sections[key].correct
                const total = diagnosticSummary?.sections[key].total
                const weak = displayPct !== null && displayPct < 50

                return (
                  <li key={key}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-[#2c2825]">
                        {DIAGNOSTIC_SECTION_LABELS[key]}
                      </span>
                      <span className="text-sm font-semibold text-[#5c534c]">
                        {backendAvg != null
                          ? `avg ${Math.round(backendAvg)} scaled`
                          : correct !== undefined && total !== undefined
                            ? `${correct}/${total} (${displayPct}%)`
                            : '—'}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8dfd4]">
                      <div
                        className="h-full rounded-full bg-[#5f7f6a] transition-[width]"
                        style={{ width: `${displayPct ?? 0}%` }}
                      />
                    </div>
                    {weak ? (
                      <p className="mt-2 text-xs text-[#b91c1c]">
                        Weak topics: {DIAGNOSTIC_WEAK_HINTS[key]}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-[#7a6e66]">
              No diagnostic yet — your section breakdown will appear here.
            </p>
          )}
        </section>

        {/* Strongest / weakest */}
        {diagnosticSummary ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#cfe5d6] bg-[#f4faf6] p-6">
              <div className="flex items-center gap-2 text-[#166534]">
                <span aria-hidden>↗</span>
                <span className="text-xs font-bold uppercase tracking-wide">
                  Strongest section
                </span>
              </div>
              <p className="mt-1 text-xs text-[#3d3835]/80">Based on accuracy</p>
              <p className="onboarding-serif mt-4 text-xl font-semibold text-[#14532d]">
                {DIAGNOSTIC_SECTION_LABELS[best].replace(
                  'Critical Analysis & Reasoning (CARS)',
                  'CARS',
                )}
              </p>
              <p className="mt-3 text-sm text-[#166534]">
                Accuracy: {bestP}% · Attempted:{' '}
                {diagnosticSummary.sections[best].total}
              </p>
            </div>
            <div className="rounded-2xl border border-[#fecaca] bg-[#fff5f5] p-6">
              <div className="flex items-center gap-2 text-[#b91c1c]">
                <span aria-hidden>↘</span>
                <span className="text-xs font-bold uppercase tracking-wide">
                  Weakest section
                </span>
              </div>
              <p className="mt-1 text-xs text-[#3d3835]/80">
                Needs improvement
              </p>
              <p className="onboarding-serif mt-4 text-xl font-semibold text-[#7f1d1d]">
                {DIAGNOSTIC_SECTION_LABELS[worst].replace(
                  'Critical Analysis & Reasoning (CARS)',
                  'CARS',
                )}
              </p>
              <p className="mt-3 text-sm text-[#b91c1c]">
                Accuracy: {worstP}% · Attempted:{' '}
                {diagnosticSummary.sections[worst].total}
              </p>
            </div>
          </div>
        ) : null}

        {/* Last session strip */}
        {diagnosticSummary ? (
          <div className="mt-8 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_32px_-12px_rgba(90,70,55,0.12)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#2c2825]">
                  Last session takeaway
                </h3>
                <p className="mt-1 font-mono text-xs text-[#7a6e66]">
                  {diagnosticSummary.completedAt.slice(0, 10)} · mini diagnostic
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/diagnostics/test')}
                className="text-sm font-semibold text-[#5f7f6a] underline-offset-4 hover:underline"
              >
                View results ↗
              </button>
            </div>
            <p className="mt-3 text-sm text-[#3d3835]">
              Questions: {diagnosticSummary.overallCorrect} /{' '}
              {diagnosticSummary.overallTotal} correct
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
