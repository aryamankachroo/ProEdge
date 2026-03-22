export type PracticeInsight = {
  title: string
  description: string
}

export type PracticeSectionRow = {
  label: string
  scaledScore: number | null
  detail: string
}

/** Output of the on-device “AI-style” analyzer (heuristics until a model API is wired). */
export type PracticeAnalyticsReport = {
  totalScore: number | null
  sections: PracticeSectionRow[]
  strengths: PracticeInsight[]
  weaknesses: PracticeInsight[]
  excerpt: string
  engine: 'heuristic_v1'
}

export type AiAnalyticsSnapshot = PracticeAnalyticsReport & {
  analyzedAt: string
  sourceFileName: string
}
