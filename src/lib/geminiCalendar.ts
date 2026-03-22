import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  CalendarRecommendationKind,
  DiagnosticSectionKey,
  StudyDayTodo,
  UserProfile,
} from '../types/profile'
import { isCalendarRecommendationKind } from './calendarRecommendationMeta'

const MODEL = 'gemini-2.5-flash'

const MON_FRI = [1, 2, 3, 4, 5] as const

/**
 * Weekdays used when placing Gemini tasks. If onboarding only recorded **one** study
 * day (e.g. a single Saturday tap), we fall back to Mon–Fri so the calendar is not
 * empty on all other days.
 */
export function studyDaysForGeminiSchedule(profile: UserProfile): number[] {
  const d = profile.studyDays
  if (d.length === 0) return [...MON_FRI]
  if (d.length === 1) return [...MON_FRI]
  return d
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Next `numDays` calendar days (from today) whose weekday is in `studyDays` (0=Sun … 6=Sat). */
export function eligibleStudyDates(
  studyDays: number[],
  numDays: number,
): string[] {
  const days = studyDays.length > 0 ? new Set(studyDays) : new Set([1, 2, 3, 4, 5])
  const out: string[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = 0; i < numDays && out.length < 28; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    if (days.has(d.getDay())) out.push(isoDate(d))
  }
  return out
}

/** Every date in `month` (0–11) that falls on a configured study weekday. */
export function studyDayDatesInMonth(
  studyDays: number[],
  year: number,
  month: number,
): string[] {
  const days = studyDays.length > 0 ? new Set(studyDays) : new Set([1, 2, 3, 4, 5])
  const out: string[] = []
  const last = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= last; d++) {
    const dt = new Date(year, month, d)
    if (days.has(dt.getDay())) out.push(isoDate(dt))
  }
  return out
}

/** Dates to schedule: upcoming study days plus all study days in the visible calendar month. */
export function allowedGenerationDates(
  profile: UserProfile,
  viewYear: number,
  viewMonth: number,
): string[] {
  const scheduleDays = studyDaysForGeminiSchedule(profile)
  const forward = eligibleStudyDates(scheduleDays, 70)
  const inMonth = studyDayDatesInMonth(scheduleDays, viewYear, viewMonth)
  const set = new Set([...forward, ...inMonth])
  return [...set].sort()
}

function diagnosticDetailForPrompt(p: UserProfile): Record<string, unknown> | null {
  const s = p.diagnosticSummary
  if (!s) return null
  const keys: DiagnosticSectionKey[] = [
    'chemPhys',
    'cars',
    'bioBiochem',
    'psychSoc',
  ]
  const sections: Record<string, { correct: number; total: number; pct: number; missed: boolean }> =
    {}
  for (const k of keys) {
    const c = s.sections[k].correct
    const t = s.sections[k].total
    const pct = t > 0 ? Math.round((c / t) * 100) : 0
    sections[k] = { correct: c, total: t, pct, missed: c < t }
  }
  return {
    completedAt: s.completedAt,
    overall: `${s.overallCorrect}/${s.overallTotal}`,
    sections,
    prioritizeMissedSections: keys.filter((k) => sections[k].missed),
  }
}

function profileContext(p: UserProfile): string {
  return JSON.stringify(
    {
      name: p.name,
      studyStatus: p.studyStatus,
      hoursPerDay: p.hoursPerDay,
      fullTimeStudying: p.fullTimeStudying,
      targetScore: p.targetScore,
      baselineScore: p.baselineScore,
      examDate: p.examDate,
      studyDays: p.studyDays,
      geminiScheduleWeekdays:
        'Use these weekdays for task dates (0=Sun … 6=Sat): ' +
        studyDaysForGeminiSchedule(p).join(', '),
      resources: p.resources,
      resourceOtherDetail: p.resourceOtherDetail,
      ankiDecks: p.ankiDecks,
      weakSections: p.weakSections,
      questionnaireNote:
        'Use weakSections as self-reported weak areas; tie tasks to named resources and Anki decks when present.',
      diagnosticDetail: diagnosticDetailForPrompt(p),
    },
    null,
    2,
  )
}

export type GeminiTodoRow = {
  date: string
  title: string
  kind: CalendarRecommendationKind
}

function parseTodosJson(raw: string): GeminiTodoRow[] {
  const trimmed = raw.trim()
  const jsonSlice =
    trimmed.startsWith('```') ?
      trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    : trimmed
  const data = JSON.parse(jsonSlice) as { todos?: unknown }
  if (!data.todos || !Array.isArray(data.todos)) {
    throw new Error('Gemini response missing "todos" array')
  }
  const rows: GeminiTodoRow[] = []
  for (const item of data.todos) {
    if (!item || typeof item !== 'object') continue
    const date = (item as { date?: string }).date
    const title = (item as { title?: string }).title
    const kindRaw = (item as { kind?: string }).kind
    const kind: CalendarRecommendationKind =
      typeof kindRaw === 'string' && isCalendarRecommendationKind(kindRaw) ?
        kindRaw
      : 'general'
    if (
      typeof date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      typeof title === 'string' &&
      title.trim()
    ) {
      rows.push({ date, title: title.trim().slice(0, 220), kind })
    }
  }
  return rows
}

export type GenerateCalendarOptions = {
  /** Calendar month the user is viewing (so that month gets distinct daily plans). */
  viewYear: number
  viewMonth: number
}

/**
 * Ask Gemini for dated MCAT study to-dos from the questionnaire and diagnostic (when present).
 * Requires `import.meta.env.VITE_GEMINI_API_KEY` (exposed in browser — use only for demos).
 */
export async function generateCalendarTodosFromProfile(
  profile: UserProfile,
  options: GenerateCalendarOptions,
): Promise<GeminiTodoRow[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add it to .env.local in the ProEdge folder and restart dev.',
    )
  }

  const allowedDates = allowedGenerationDates(
    profile,
    options.viewYear,
    options.viewMonth,
  )
  const allowedSet = new Set(allowedDates)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.75,
    },
  })

  const prompt = `You are an MCAT study coach. Build a VARIED multi-day study plan from the student profile (JSON) below.

${profileContext(profile)}

SCHEDULING DATES (YYYY-MM-DD) — you may ONLY use these dates:
${allowedDates.join(', ')}

CRITICAL — variety:
- Do NOT repeat the same task title (or same wording) on different days. Each date must have DISTINCT titles that reflect different topics, subtopics, or modalities.
- Rotate emphasis across MCAT areas: Chemical/Physical Foundations, CARS, Biological/Biochemical Foundations, Psychological/Social — guided by questionnaire weakSections AND diagnosticDetail.prioritizeMissedSections (if diagnostic was taken). If no diagnostic, rely on weakSections and baseline.
- Across the week, mix: weak_section, science, cars, anki, resource, mixed, recap — not the same six labels every day.
- Per day: up to 6 concise tasks; vary count 4–6 when possible.
- Reference specific resources (Kaplan, UWorld, named decks) when profile lists them; otherwise use generic but SPECIFIC titles (e.g. "Psych/Soc: research methods — 15 discrete, timed" not "science block").

For EVERY task, assign "kind":
- weak_section: targeted work on a named weak area
- science: Chem/Phys, Bio/Biochem, or Psych/Soc (not CARS)
- cars: CARS passages / reasoning
- anki: spaced repetition / flashcards
- resource: named prep book / Q-bank work
- mixed: mixed passages or interleaved blocks
- recap: error log, review, plan next day
- general: other

Output ONLY valid JSON, no markdown. Shape:
{ "todos": [ { "date": "YYYY-MM-DD", "title": "...", "kind": "weak_section" } ] }
Each "kind" must be one of: weak_section, science, cars, anki, resource, mixed, recap, general
Max 140 todos total. Use ONLY dates from the allowed list above.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  if (!text) throw new Error('Empty response from Gemini')

  const rows = parseTodosJson(text)
  const filtered = rows.filter((r) => allowedSet.has(r.date))

  if (filtered.length === 0) {
    throw new Error('No valid to-dos returned for your study days. Try again.')
  }

  const byDate = new Map<string, GeminiTodoRow[]>()
  for (const r of filtered) {
    const list = byDate.get(r.date) ?? []
    if (list.length < 6) list.push(r)
    byDate.set(r.date, list)
  }

  const capped: GeminiTodoRow[] = []
  for (const list of byDate.values()) {
    capped.push(...list)
  }
  return capped
}

export function newTodoId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  )
}

/** Replace existing todos on dates touched by Gemini, keep other dates as-is. */
export function mergeGeminiTodosIntoProfile(
  existing: StudyDayTodo[],
  generated: GeminiTodoRow[],
): StudyDayTodo[] {
  const dates = new Set(generated.map((g) => g.date))
  const base = existing.filter((t) => !dates.has(t.date))
  const additions: StudyDayTodo[] = generated.map((g) => ({
    id: newTodoId(),
    date: g.date,
    title: g.title,
    completed: false,
    kind: g.kind,
  }))
  return [...base, ...additions]
}
