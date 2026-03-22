import type { AiAnalyticsSnapshot } from './analytics'
import type { AiJournalEntry } from './journal'

export type StudyStatus =
  | 'full-time-student'
  | 'part-time-student'
  | 'gap-year'
  | 'working-full-time'

export const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  'full-time-student': 'Full-time student',
  'part-time-student': 'Part-time student',
  'gap-year': 'Gap year',
  'working-full-time': 'Working full-time',
}

export type StudyCalendarEvent = {
  id: string
  /** Local calendar date yyyy-mm-dd */
  date: string
  title: string
}

/**
 * Where a calendar task came from — drives colors/labels in the UI.
 * Questionnaire weak sections → `weak_section`; prep books → `resource`; etc.
 */
export type CalendarRecommendationKind =
  | 'weak_section'
  | 'cars'
  | 'science'
  | 'anki'
  | 'resource'
  | 'mixed'
  | 'recap'
  | 'general'

/** Auto-filled rows from suggestion templates (not manual or Gemini merge). */
export type StudyDayTodoFillSource = 'diagnostic' | 'questionnaire'

/** Checkable daily tasks on the study calendar (max ~6 per day in UI). */
export type StudyDayTodo = {
  id: string
  /** Local calendar date yyyy-mm-dd */
  date: string
  title: string
  completed: boolean
  /** From questionnaire/Gemini heuristics; omit on older saved data */
  kind?: CalendarRecommendationKind
  /** Present when this row came from calendar suggestion auto-fill */
  fillSource?: StudyDayTodoFillSource
}

export type DiagnosticSectionKey =
  | 'chemPhys'
  | 'cars'
  | 'bioBiochem'
  | 'psychSoc'

export const DIAGNOSTIC_SECTION_LABELS: Record<DiagnosticSectionKey, string> = {
  chemPhys: 'Chemistry & Physics',
  cars: 'Critical Analysis & Reasoning (CARS)',
  bioBiochem: 'Biology & Biochemistry',
  psychSoc: 'Psychology & Sociology',
}

export const DIAGNOSTIC_SECTION_SHORT: Record<DiagnosticSectionKey, string> = {
  chemPhys: 'Chem / Phys',
  cars: 'CARS',
  bioBiochem: 'Bio / Biochem',
  psychSoc: 'Psych / Soc',
}

/** Optional hints when a section scores low (UI copy only). */
export const DIAGNOSTIC_WEAK_HINTS: Record<DiagnosticSectionKey, string> = {
  chemPhys: 'Thermodynamics, kinetics, electrochemistry',
  cars: 'Author reasoning, inference from the passage',
  bioBiochem: 'Metabolism, genetics, lab techniques',
  psychSoc: 'Research methods, theories, data interpretation',
}

export interface DiagnosticSummary {
  completedAt: string
  overallCorrect: number
  overallTotal: number
  sections: Record<
    DiagnosticSectionKey,
    { correct: number; total: number }
  >
}

export interface UserProfile {
  name: string
  studyStatus: StudyStatus | ''
  hoursPerDay: number
  fullTimeStudying: boolean
  targetScore: number
  baselineScore: number
  examDate: string
  /** Derived from studyCalendarEvents when present; kept for older data */
  studyDays: number[]
  /** iOS-style calendar to-dos marking days you can study */
  studyCalendarEvents: StudyCalendarEvent[]
  /** Dashboard calendar — daily MCAT tasks with checkboxes */
  studyDayTodos: StudyDayTodo[]
  resources: string[]
  /** When "Other" is in resources, user-specified source name */
  resourceOtherDetail: string
  ankiDecks: string[]
  weakSections: string[]
  /** Set when user imports a diagnostic report PDF from onboarding */
  diagnosticReportPdfName: string
  /** Latest mini-diagnostic results (10 Q), if completed */
  diagnosticSummary: DiagnosticSummary | null
  /** Last practice PDF “AI analytics” run (heuristic until backend model) */
  lastAiAnalytics: AiAnalyticsSnapshot | null
  /** Burnout signals this student chose to track (ids from BURNOUT_SIGNALS) */
  trackedBurnoutSignalIds: string[]
  /** AI journal entries — local only; used for pattern notes, not a score */
  aiJournalEntries: AiJournalEntry[]
}

export const defaultProfile: UserProfile = {
  name: '',
  studyStatus: '',
  hoursPerDay: 4,
  fullTimeStudying: true,
  targetScore: 515,
  baselineScore: 502,
  examDate: '',
  studyDays: [1, 2, 3, 4, 5],
  studyCalendarEvents: [],
  studyDayTodos: [],
  resources: [],
  resourceOtherDetail: '',
  ankiDecks: [],
  weakSections: [],
  diagnosticReportPdfName: '',
  diagnosticSummary: null,
  lastAiAnalytics: null,
  trackedBurnoutSignalIds: [],
  aiJournalEntries: [],
}

export function studyDaysFromCalendarEvents(
  events: StudyCalendarEvent[],
): number[] {
  const s = new Set<number>()
  for (const e of events) {
    const [y, mo, d] = e.date.split('-').map(Number)
    if (!y || !mo || !d) continue
    s.add(new Date(y, mo - 1, d).getDay())
  }
  return [...s].sort((a, b) => a - b)
}
