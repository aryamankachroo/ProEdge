export interface UserProfile {
  userId: string
  name: string
  studyStatus: 'full_time_student' | 'part_time_student' | 'gap_year' | 'working_full_time'
  hoursPerDay: number
  studyLoad: 'full_time_focus' | 'around_school_work'
  targetScore: number
  baselineScore: number
  examDate: string
  resources: string[]
  ankiDecks: string[]
  weakSections: string[]
  studyDays: number[]
  email?: string
}

export interface DiagnosticScores {
  totalScore: number | null
  carsScore: number | null
  bioBiochemScore: number | null
  chemPhysScore: number | null
  psychSocScore: number | null
  percentile: number | null
  testDate: string | null
  source: 'manual' | 'pdf_import' | 'diagnostic_test'
  rawPdfText?: string
}

export interface ProgressLog {
  logDate: string
  hoursStudied: number
  topicsCovered: string[]
  ankiCardsReviewed: number
  notes?: string
  mood: 'great' | 'good' | 'okay' | 'rough'
}

export interface StudyPlanDay {
  tasks: Array<{
    resource: string
    section: string
    durationMins: number
    topic: string
  }>
}

export interface StudyPlanWeek {
  weekNumber: number
  phase: string
  theme: string
  focusSections: string[]
  dailySchedule: Record<string, StudyPlanDay['tasks']>
  weeklyGoals: string[]
  ankiTarget: number
}

export interface StudyPlan {
  totalWeeks: number
  phaseBreakdown: Array<{ phase: string; weeks: string; goal: string }>
  weeks: StudyPlanWeek[]
  milestones: Array<{ week: number; milestone: string }>
  studyTips: string[]
  scoreProgressionTargets: Array<{ week: number; targetScore: number }>
}
