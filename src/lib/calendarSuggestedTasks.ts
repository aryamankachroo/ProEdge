import {
  DIAGNOSTIC_SECTION_LABELS,
  DIAGNOSTIC_SECTION_SHORT,
  DIAGNOSTIC_WEAK_HINTS,
  type DiagnosticSectionKey,
  type DiagnosticSummary,
  type UserProfile,
} from '../types/profile'

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
  return { best, worst, bestP, worstP }
}

/** Generic placeholder day — used when no diagnostic or weak sections. */
const GENERIC_PLACEHOLDER_TASKS: string[] = [
  'Anki — new & review cards',
  'CARS — 1–2 timed passages',
  'Science question block (timed)',
  'Weak-topic notes or video',
  'Equation / flashcard drill',
  'Evening recap — plan tomorrow',
]

function tasksFromDiagnostic(summary: DiagnosticSummary): string[] {
  const { best, worst } = strongestWeakest(summary)
  const wShort = DIAGNOSTIC_SECTION_SHORT[worst]
  const wLong = DIAGNOSTIC_SECTION_LABELS[worst]
  const bShort = DIAGNOSTIC_SECTION_SHORT[best]
  const hint = DIAGNOSTIC_WEAK_HINTS[worst]
  const hintFirst = hint.split(',')[0]?.trim() ?? hint

  const carsLine =
    worst === 'cars'
      ? 'CARS — 2 passages, strict timing (diagnostic focus)'
      : 'CARS — 1 passage + review every answer'

  return [
    `${wShort} — 20 timed questions (priority from diagnostic)`,
    `${wLong}: review ${hintFirst}`,
    `Anki — drill misses; tag deck: ${wShort}`,
    carsLine,
    `Mixed block — 15 Q including ${wShort} + other sciences`,
    `Recap — log ${wShort} errors; maintain ${bShort} with 5 Q warm-up`,
  ]
}

function tasksFromQuestionnaireWeak(weakSections: string[], hoursPerDay: number): string[] {
  const primary = weakSections[0] ?? 'Weakest section'
  const secondary = weakSections[1] ?? 'Second focus area'
  const h = Math.max(1, Math.min(12, hoursPerDay))

  return [
    `${primary} — ${h * 3} min timed practice (placeholder)`,
    `${primary} — review one chapter / video set (placeholder)`,
    `${secondary} — light practice block (placeholder)`,
    'CARS — 1 passage under test conditions',
    'Anki — catch up on due cards',
    'Evening recap — adjust tomorrow’s focus (placeholder)',
  ]
}

/**
 * Suggested copy for the calendar (client-only until backend).
 * Order: diagnostic summary → questionnaire weak sections → generic dummy list.
 */
export function getSuggestedDailyTaskTitles(profile: UserProfile): string[] {
  if (profile.diagnosticSummary) {
    return tasksFromDiagnostic(profile.diagnosticSummary)
  }
  if (profile.weakSections.length > 0) {
    return tasksFromQuestionnaireWeak(profile.weakSections, profile.hoursPerDay)
  }
  return [...GENERIC_PLACEHOLDER_TASKS]
}

export function suggestedTasksAreFromDiagnostic(profile: UserProfile): boolean {
  return profile.diagnosticSummary !== null
}

export function suggestedTasksAreFromQuestionnaire(profile: UserProfile): boolean {
  return !profile.diagnosticSummary && profile.weakSections.length > 0
}
