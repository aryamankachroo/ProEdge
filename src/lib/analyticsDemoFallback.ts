import type { PracticeAnalyticsReport } from '../types/analytics'
import { dedupeInsights, relativeSectionInsights } from './practicePdfAnalytics'

const DEMO_DETAIL =
  'Illustrative score — Gemini API key missing or request failed. Section splits match the detected total when possible; otherwise a balanced demo (500).'

/** Split a 472–528 total into four 118–132 section scores (deterministic). */
export function splitTotalAcrossFourSections(total: number): number[] {
  const t = Math.min(528, Math.max(472, Math.round(total)))
  const base = Math.floor(t / 4)
  const rem = t - base * 4
  const scores = [0, 1, 2, 3].map((i) => {
    const v = base + (i < rem ? 1 : 0)
    return Math.min(132, Math.max(118, v))
  })
  let sum = scores.reduce((a, b) => a + b, 0)
  let i = 0
  while (sum !== t && i < 48) {
    const diff = t - sum
    const idx = i % 4
    const delta = diff > 0 ? 1 : -1
    const nv = scores[idx]! + delta
    if (nv >= 118 && nv <= 132) {
      scores[idx] = nv
      sum += delta
    }
    i++
  }
  return scores
}

/**
 * When Gemini is unavailable or errors, heuristics often leave section scores blank.
 * Fill with plausible demo scores so the UI stays useful.
 */
export function applyDemoScoresWhenGeminiUnavailable(
  base: PracticeAnalyticsReport,
): PracticeAnalyticsReport {
  const targetTotal = base.totalScore ?? 500
  const parts = splitTotalAcrossFourSections(targetTotal)
  const labels = base.sections.map((s) => s.label)
  if (labels.length === 0) {
    return { ...base, engine: 'demo_v1' }
  }
  const sections = labels.map((label, i) => ({
    label,
    scaledScore: parts[i % parts.length]!,
    detail: DEMO_DETAIL,
  }))

  const rel = relativeSectionInsights(sections)
  let strengths = dedupeInsights([...rel.strengths, ...base.strengths])
  let weaknesses = dedupeInsights([...rel.weaknesses, ...base.weaknesses])
  if (strengths.length === 0) {
    strengths = [
      {
        title: 'Demo preview — strengths',
        description:
          'Connect a working Gemini API key in .env.local for real extraction from messy PDFs.',
      },
    ]
  }
  if (weaknesses.length === 0) {
    weaknesses = [
      {
        title: 'Demo preview — gaps',
        description:
          'These insights are placeholders until Gemini can read your report text.',
      },
    ]
  }

  const totalScore =
    base.totalScore ?? parts.reduce((a, b) => a + b, 0)

  return {
    ...base,
    totalScore,
    sections,
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    engine: 'demo_v1',
  }
}
