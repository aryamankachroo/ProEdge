import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CalendarRecommendationKind, StudyDayTodo, UserProfile } from '../types/profile'
import { isCalendarRecommendationKind } from './calendarRecommendationMeta'

const MODEL = 'gemini-2.5-flash'

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
      resources: p.resources,
      resourceOtherDetail: p.resourceOtherDetail,
      ankiDecks: p.ankiDecks,
      weakSections: p.weakSections,
      diagnosticSummary: p.diagnosticSummary
        ? {
            overall: `${p.diagnosticSummary.overallCorrect}/${p.diagnosticSummary.overallTotal}`,
            sections: p.diagnosticSummary.sections,
          }
        : null,
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

/**
 * Ask Gemini for dated MCAT study to-dos from the questionnaire (and diagnostic if present).
 * Requires `import.meta.env.VITE_GEMINI_API_KEY` (exposed in browser — use only for demos).
 */
export async function generateCalendarTodosFromProfile(
  profile: UserProfile,
): Promise<GeminiTodoRow[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add it to .env.local in the ProEdge folder and restart dev.',
    )
  }

  const allowedDates = eligibleStudyDates(profile.studyDays, 56)
  const allowedSet = new Set(allowedDates)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.6,
    },
  })

  const prompt = `You are an MCAT study coach. The student profile (JSON) is:

${profileContext(profile)}

You MUST schedule tasks only on these dates (YYYY-MM-DD), in order — use each date at least once if possible, up to 5 concise tasks per day:
${allowedDates.join(', ')}

For EVERY task, assign a "kind" so the UI can color-code recommendations:
- weak_section: extra work on questionnaire weakSections or diagnostic weak areas
- science: Chem/Phys, Bio/Biochem, or Psych/Soc practice blocks (not CARS)
- cars: CARS passages / reasoning
- anki: spaced repetition / flashcards
- resource: work tied to their prep books (Kaplan, UWorld, etc.)
- mixed: mixed passages or full-length style blocks
- recap: journaling, error logs, planning tomorrow
- general: anything else

Rules:
- Tailor tasks to weakSections, hoursPerDay, resources, and ankiDecks when provided.
- If diagnosticSummary is present, weight weaker sections slightly more.
- Tasks are short imperative lines (e.g. "UWorld: 20 bio/biochem timed").
- Only output JSON, no markdown. Shape:
{ "todos": [ { "date": "YYYY-MM-DD", "title": "...", "kind": "weak_section" } ] }
  where each "kind" is one of: weak_section, science, cars, anki, resource, mixed, recap, general
- Use ONLY dates from the allowed list above. Max 120 total todos.
- Vary kinds across the week so different recommendation types appear.`

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
