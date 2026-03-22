export type PracticeInsight = {
  title: string
  description: string
}

export type PracticeSectionRow = {
  label: string
  scaledScore: number | null
  detail: string
}

/** Output of the PDF analyzer (heuristics and/or Gemini). */
export type PracticeAnalyticsReport = {
  totalScore: number | null
  sections: PracticeSectionRow[]
  strengths: PracticeInsight[]
  weaknesses: PracticeInsight[]
  excerpt: string
  engine: 'heuristic_v1' | 'gemini_v1'
}

export type AiAnalyticsSnapshot = PracticeAnalyticsReport & {
  analyzedAt: string
  sourceFileName: string
}
