export type JournalMode =
  | 'session-debrief'
  | 'brain-dump'
  | 'weekly-reflection'

export type BurnoutCategory =
  | 'physical'
  | 'mental'
  | 'behavioral'
  | 'emotional'

export type DayQuality = 'good' | 'ok' | 'rough'

/** One journal save — used for pattern detection, not a burnout score. */
export interface AiJournalEntry {
  id: string
  createdAt: string
  mode: JournalMode
  /** Signals the student marked as showing up for this entry */
  activeSignalIds: string[]
  /** Structured answers (prompt id → text) */
  responses: Record<string, string>
  freeText?: string
  dayQuality: DayQuality
  /** Self-report: skipped what they meant to study */
  skippedStudySelfReport?: boolean
  feltTerrible?: boolean
}
