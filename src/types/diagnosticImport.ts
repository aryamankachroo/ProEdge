/** Gemini-parsed full diagnostic report (e.g. Blueprint PDF export). */
export type ImportedSectionRow = {
  key: string
  label: string
  scaledScore: number | null
  percentile: string | null
  /** Optional correct/total if present in report */
  correct?: number
  total?: number
}

export type ImportedSubjectBar = {
  name: string
  questionCount: number | null
  percentCorrect: number | null
}

export type ImportedPassageRow = {
  section: string
  label: string
  correct: number
  total: number
}

export type ImportedDiagnosticReport = {
  analyzedAt: string
  sourceFileName: string
  reportTitle: string
  totalScore: number | null
  totalPercentile: string | null
  sections: ImportedSectionRow[]
  subjectBreakdown: ImportedSubjectBar[]
  passageHighlights: ImportedPassageRow[]
  coachSummary: string
  strengths: string[]
  growthAreas: string[]
  studyPriorities: string[]
  /** First ~1500 chars of extracted PDF text for debugging */
  textExcerpt: string
}
