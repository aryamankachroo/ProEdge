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
  resources: string[]
  /** When "Other" is in resources, user-specified source name */
  resourceOtherDetail: string
  ankiDecks: string[]
  weakSections: string[]
  /** Set when user imports a diagnostic report PDF from onboarding */
  diagnosticReportPdfName: string
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
  resources: [],
  resourceOtherDetail: '',
  ankiDecks: [],
  weakSections: [],
  diagnosticReportPdfName: '',
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
