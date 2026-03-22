import {
  DIAGNOSTIC_SECTION_LABELS,
  DIAGNOSTIC_SECTION_SHORT,
  DIAGNOSTIC_WEAK_HINTS,
  type CalendarRecommendationKind,
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

export type SuggestedTask = {
  title: string
  kind: CalendarRecommendationKind
}

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

function sectionToScienceKind(k: DiagnosticSectionKey): CalendarRecommendationKind {
  if (k === 'cars') return 'cars'
  return 'science'
}

/** Sections where the learner missed at least one question, weakest first. */
function missedSectionsOrdered(summary: DiagnosticSummary): DiagnosticSectionKey[] {
  const missed = SECTION_ORDER.filter(
    (k) => summary.sections[k].correct < summary.sections[k].total,
  )
  if (missed.length === 0) {
    return [...SECTION_ORDER].sort(
      (a, b) =>
        pct(summary.sections[a].correct, summary.sections[a].total) -
        pct(summary.sections[b].correct, summary.sections[b].total),
    )
  }
  return missed.sort(
    (a, b) =>
      pct(summary.sections[a].correct, summary.sections[a].total) -
      pct(summary.sections[b].correct, summary.sections[b].total),
  )
}

function tasksFromDiagnostic(summary: DiagnosticSummary): SuggestedTask[] {
  const { best } = strongestWeakest(summary)
  const ordered = missedSectionsOrdered(summary)
  const worst = ordered[0]!
  const second = ordered[1] ?? best
  const wShort = DIAGNOSTIC_SECTION_SHORT[worst]
  const wLong = DIAGNOSTIC_SECTION_LABELS[worst]
  const bShort = DIAGNOSTIC_SECTION_SHORT[best]
  const sShort = DIAGNOSTIC_SECTION_SHORT[second]
  const hint = DIAGNOSTIC_WEAK_HINTS[worst]
  const hintFirst = hint.split(',')[0]?.trim() ?? hint
  const hadMisses = SECTION_ORDER.some(
    (k) => summary.sections[k].correct < summary.sections[k].total,
  )
  const missLabel = hadMisses ? 'topics you missed' : 'lowest section this run'

  const carsLine: SuggestedTask =
    worst === 'cars' ?
      {
        title: 'CARS — 2 passages, strict timing (diagnostic focus)',
        kind: 'cars',
      }
    : {
        title: 'CARS — 1 passage + review every answer',
        kind: 'cars',
      }

  return [
    {
      title: `${wShort} — 20 timed questions (${missLabel})`,
      kind: sectionToScienceKind(worst),
    },
    {
      title: `${wLong}: review ${hintFirst}`,
      kind: 'weak_section',
    },
    {
      title: `Anki — drill misses; tag deck: ${wShort}`,
      kind: 'anki',
    },
    carsLine,
    {
      title:
        second !== worst ?
          `Mixed block — 15 Q (${wShort} + ${sShort})`
        : `Mixed block — 15 Q including ${wShort} + other sciences`,
      kind: 'mixed',
    },
    {
      title: `Recap — log ${wShort} errors; maintain ${bShort} with 5 Q warm-up`,
      kind: 'recap',
    },
  ]
}

/** Questionnaire-driven mix: weak sections, CARS, Anki, named resources, recap. */
function tasksFromQuestionnaire(
  profile: UserProfile,
  hoursPerDay: number,
): SuggestedTask[] {
  const weak = profile.weakSections
  const primary = weak[0] ?? 'Weakest section'
  const secondary = weak[1] ?? primary
  const h = Math.max(1, Math.min(12, hoursPerDay))
  const namedResources = profile.resources.filter((r) => r !== 'Other')
  const resourceLabel =
    namedResources[0] ??
    (profile.resourceOtherDetail.trim() || 'your main prep resource')
  const ankiLabel = profile.ankiDecks[0] ?? 'Anki'

  return [
    {
      title: `${primary} — ${h * 3} min timed practice (questionnaire focus)`,
      kind: 'weak_section',
    },
    {
      title: `${secondary} — review one chapter / video set + notes`,
      kind: 'weak_section',
    },
    {
      title: 'CARS — 1 passage under test conditions',
      kind: 'cars',
    },
    {
      title: `${ankiLabel} — due cards + 20 new (keep streak)`,
      kind: 'anki',
    },
    {
      title: `${resourceLabel} — reading + practice set aligned to weak sections`,
      kind: 'resource',
    },
    {
      title:
        profile.fullTimeStudying ?
          'Evening recap — error log + preview tomorrow (full-time pace)'
        : 'Light recap — adjust tomorrow around school/work blocks',
      kind: 'recap',
    },
  ]
}

function genericPlaceholderTasks(): SuggestedTask[] {
  return [
    { title: 'Anki — new & review cards', kind: 'anki' },
    { title: 'CARS — 1–2 timed passages', kind: 'cars' },
    { title: 'Science question block (timed)', kind: 'science' },
    { title: 'Weak-topic notes or video', kind: 'weak_section' },
    { title: 'Equation / flashcard drill', kind: 'science' },
    { title: 'Evening recap — plan tomorrow', kind: 'recap' },
  ]
}

/**
 * Typed recommendations from diagnostic → questionnaire weak sections → generic template.
 */
export function getSuggestedDailyTasks(profile: UserProfile): SuggestedTask[] {
  if (profile.diagnosticSummary) {
    return tasksFromDiagnostic(profile.diagnosticSummary)
  }
  if (profile.weakSections.length > 0) {
    return tasksFromQuestionnaire(profile, profile.hoursPerDay)
  }
  return genericPlaceholderTasks()
}

/** @deprecated Use getSuggestedDailyTasks for `kind`; kept for callers that only need titles. */
export function getSuggestedDailyTaskTitles(profile: UserProfile): string[] {
  return getSuggestedDailyTasks(profile).map((s) => s.title)
}

export function suggestedTasksAreFromDiagnostic(profile: UserProfile): boolean {
  return profile.diagnosticSummary !== null
}

export function suggestedTasksAreFromQuestionnaire(profile: UserProfile): boolean {
  return !profile.diagnosticSummary && profile.weakSections.length > 0
}
