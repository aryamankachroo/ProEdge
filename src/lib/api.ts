/**
 * ProEdge API client — when enabled, calls proxy through Vite to http://localhost:3001
 *
 * Type conversions handled here:
 *   Frontend StudyStatus  (kebab)  →  Backend studyStatus  (snake_case)
 *   Frontend fullTimeStudying bool →  Backend studyLoad string
 */

import type { UserProfile, DiagnosticSummary } from '../types/profile'

/** When false, no `/api` requests are made (avoids Vite proxy ECONNREFUSED if the API is down). */
export function isBackendApiEnabled(): boolean {
  return import.meta.env.VITE_USE_BACKEND_API === 'true'
}

class BackendDisabledError extends Error {
  constructor() {
    super('Backend API disabled (set VITE_USE_BACKEND_API=true when the server is running)')
    this.name = 'BackendDisabledError'
  }
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** In dev: empty string (Vite proxy handles /api). In production: full backend URL e.g. https://proedge-backend.vercel.app */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  if (!isBackendApiEnabled()) {
    throw new BackendDisabledError()
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error ?? message
    } catch {
      /* ignore parse error */
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

// ─── Type adapters ─────────────────────────────────────────────────────────────

/** Convert frontend StudyStatus to the backend snake_case variant. */
function toBackendStudyStatus(
  s: UserProfile['studyStatus'],
): string {
  return s.replaceAll('-', '_')
}

/** Convert frontend profile to the shape expected by POST /api/profile */
export function toBackendProfile(p: UserProfile) {
  return {
    name: p.name,
    studyStatus: toBackendStudyStatus(p.studyStatus),
    hoursPerDay: p.hoursPerDay,
    studyLoad: p.fullTimeStudying ? 'full_time_focus' : 'around_school_work',
    targetScore: p.targetScore,
    baselineScore: p.baselineScore,
    examDate: p.examDate,
    studyDays: p.studyDays,
    resources: p.resources,
    ankiDecks: p.ankiDecks,
    weakSections: p.weakSections,
  }
}

// ─── Response types ────────────────────────────────────────────────────────────

export interface BackendProfile {
  profileId: string
  userId: string
  name: string
  studyStatus: string
  hoursPerDay: number
  studyLoad: string
  targetScore: number
  baselineScore: number
  examDate: string
  resources: string[]
  ankiDecks: string[]
  weakSections: string[]
  studyDays: number[]
  updatedAt: string
}

export interface BackendStudyPlan {
  planId: string
  generatedAt: string
  plan: GeneratedPlan
}

export interface GeneratedPlan {
  overview?: string
  totalWeeks?: number
  phases?: PlanPhase[]
  weeklySchedule?: PlanWeek[]
  milestones?: string[]
  tips?: string[]
  [key: string]: unknown
}

export interface PlanPhase {
  name: string
  weeks: string
  focus: string
  description?: string
}

export interface PlanWeek {
  week: number
  theme?: string
  days?: PlanDay[]
  [key: string]: unknown
}

export interface PlanDay {
  day: string
  tasks: string[]
  [key: string]: unknown
}

export interface DiagnosticScoreEntry {
  scoreId: string
  totalScore: number | null
  carsScore: number | null
  bioBiochemScore: number | null
  chemPhysScore: number | null
  psychSocScore: number | null
  percentile: number | null
  testDate: string
  source: string
  createdAt: string
}

export interface ScoreTrend {
  testDate: string
  totalScore: number
  carsScore: number | null
  bioBiochemScore: number | null
  chemPhysScore: number | null
  psychSocScore: number | null
  percentile: number | null
  source: string
}

export interface AnalyticsSummary {
  study: {
    totalSessions: number
    totalHours: number
    avgHoursPerSession: number
    totalAnkiCards: number
    lastStudyDate: string | null
    firstStudyDate: string | null
  }
  scores: {
    lowestScore: number | null
    highestScore: number | null
    avgScore: number | null
    totalTests: number
  }
  weeklyActivity: {
    weekStart: string
    hours: number
    sessions: number
    ankiCards: number
  }[]
  moodDistribution: Record<string, number>
}

export interface SectionBreakdown {
  averages: { cars: number | null; bioBiochem: number | null; chemPhys: number | null; psychSoc: number | null }
  bests: { cars: number | null; bioBiochem: number | null; chemPhys: number | null; psychSoc: number | null }
}

// ─── Profile endpoints ─────────────────────────────────────────────────────────

/** Save (upsert) the user's profile to Snowflake. No-op when API is disabled. */
export async function saveProfile(profile: UserProfile): Promise<void> {
  if (!isBackendApiEnabled()) return
  await req<{ message: string }>('/profile', {
    method: 'POST',
    body: JSON.stringify(toBackendProfile(profile)),
  })
}

/** Fetch the stored profile. Returns null if not found (404) or API disabled. */
export async function fetchProfile(): Promise<BackendProfile | null> {
  if (!isBackendApiEnabled()) return null
  try {
    const data = await req<{ profile: BackendProfile }>('/profile')
    return data.profile
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes('not found')) {
      return null
    }
    throw err
  }
}

// ─── Study plan endpoints ──────────────────────────────────────────────────────

/** Trigger Gemini to generate a new study plan and save it to Snowflake. */
export async function generatePlan(): Promise<GeneratedPlan> {
  const data = await req<{ plan: GeneratedPlan }>('/plan/generate', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return data.plan
}

/** Fetch the user's current active study plan. Returns null if none exists. */
export async function fetchActivePlan(): Promise<BackendStudyPlan | null> {
  if (!isBackendApiEnabled()) return null
  try {
    return await req<BackendStudyPlan>('/plan')
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes('not found')) {
      return null
    }
    throw err
  }
}

// ─── Diagnostics endpoints ────────────────────────────────────────────────────

/** Save diagnostic scores from the 10-question mini quiz. */
export async function saveDiagnosticScores(
  summary: DiagnosticSummary,
  baselineScore?: number,
): Promise<DiagnosticScoreEntry | null> {
  if (!isBackendApiEnabled()) return null
  const { sections } = summary
  const totalCorrect = summary.overallCorrect
  const totalPossible = summary.overallTotal

  // Map 0–100 section accuracy to a proportional MCAT sub-score (118–132 per section)
  const sectionToScore = (correct: number, total: number): number | null => {
    if (total === 0) return null
    const accuracy = correct / total
    return Math.round(118 + accuracy * (132 - 118))
  }

  const payload = {
    totalScore: baselineScore ?? null,
    carsScore: sectionToScore(sections.cars.correct, sections.cars.total),
    bioBiochemScore: sectionToScore(sections.bioBiochem.correct, sections.bioBiochem.total),
    chemPhysScore: sectionToScore(sections.chemPhys.correct, sections.chemPhys.total),
    psychSocScore: sectionToScore(sections.psychSoc.correct, sections.psychSoc.total),
    testDate: summary.completedAt.split('T')[0],
    source: 'mini_diagnostic',
    notes: `${totalCorrect}/${totalPossible} correct on 10-question preview`,
  }

  const data = await req<{ scores: DiagnosticScoreEntry }>('/diagnostics/scores', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.scores
}

/** Upload a PDF score report and have the server parse it. */
export async function uploadDiagnosticPdf(file: File): Promise<DiagnosticScoreEntry> {
  if (!isBackendApiEnabled()) {
    throw new BackendDisabledError()
  }
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/diagnostics/parse-pdf', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error ?? message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  const data = await res.json() as { scores: DiagnosticScoreEntry }
  return data.scores
}

/** Save a manual total score entry. */
export async function saveManualScore(
  totalScore: number,
  testDate?: string,
): Promise<DiagnosticScoreEntry | null> {
  if (!isBackendApiEnabled()) return null
  const data = await req<{ scores: DiagnosticScoreEntry }>('/diagnostics/scores', {
    method: 'POST',
    body: JSON.stringify({
      totalScore,
      testDate: testDate ?? new Date().toISOString().split('T')[0],
      source: 'manual',
    }),
  })
  return data.scores
}

/** Fetch diagnostic score history. */
export async function fetchDiagnosticScores(limit = 20): Promise<DiagnosticScoreEntry[]> {
  if (!isBackendApiEnabled()) return []
  const data = await req<{ scores: DiagnosticScoreEntry[] }>(`/diagnostics/scores?limit=${limit}`)
  return data.scores
}

// ─── Analytics endpoints ───────────────────────────────────────────────────────

/** Fetch score trend data for sparklines and trend charts. */
export async function fetchScoreTrend(): Promise<{ trend: ScoreTrend[]; improvement: number | null; dataPoints: number }> {
  return req('/analytics/scores')
}

/** Fetch aggregate study + score summary. */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return req('/analytics/summary')
}

/** Fetch per-section average and best scores. */
export async function fetchSectionBreakdown(): Promise<SectionBreakdown> {
  return req('/analytics/section-breakdown')
}

// ─── Progress endpoints ────────────────────────────────────────────────────────

export interface StudyStreak {
  streak: number
  lastStudyDate: string | null
}

export async function fetchStudyStreak(): Promise<StudyStreak> {
  return req('/progress/streak')
}

export async function logStudySession(data: {
  hoursStudied: number
  topicsCovered?: string[]
  ankiCardsReviewed?: number
  notes?: string
  mood?: 'great' | 'good' | 'okay' | 'rough'
}): Promise<void> {
  await req('/progress', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
