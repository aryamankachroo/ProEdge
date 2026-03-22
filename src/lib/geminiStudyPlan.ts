import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from '@google/generative-ai'
import type { UserProfile } from '../types/profile'
import { STUDY_STATUS_LABELS } from '../types/profile'
import type { GeneratedPlan, PlanDay, PlanPhase, PlanWeek } from './api'

const MODEL = 'gemini-2.5-flash'

/** Forces syntactically valid JSON from Gemini (avoids unterminated strings from long free-form JSON). */
const STUDY_PLAN_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    overview: {
      type: SchemaType.STRING,
      description: '2–4 sentences summarizing the overall MCAT prep strategy.',
    },
    totalWeeks: { type: SchemaType.INTEGER },
    phases: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          weeks: { type: SchemaType.STRING },
          focus: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ['name', 'weeks', 'focus'],
      },
    },
    weeklySchedule: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          week: { type: SchemaType.INTEGER },
          theme: { type: SchemaType.STRING },
          days: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                day: { type: SchemaType.STRING },
                tasks: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: ['day', 'tasks'],
            },
          },
        },
        required: ['week', 'days'],
      },
    },
    milestones: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    tips: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['overview', 'phases', 'weeklySchedule', 'milestones', 'tips'],
} satisfies ResponseSchema as ResponseSchema

const WEEK_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

function weeksUntilExam(examDateIso: string): number {
  if (!examDateIso) return 12
  const exam = new Date(`${examDateIso}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(
    1,
    Math.round((exam.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)),
  )
}

function profileJson(p: UserProfile): string {
  const status =
    p.studyStatus && p.studyStatus in STUDY_STATUS_LABELS
      ? STUDY_STATUS_LABELS[p.studyStatus as keyof typeof STUDY_STATUS_LABELS]
      : p.studyStatus || 'Not set'

  const studyDayNames =
    p.studyDays.length > 0
      ? p.studyDays.map((d) => WEEK_NAMES[d] ?? String(d)).join(', ')
      : 'Monday–Friday (default)'

  const diag =
    p.diagnosticSummary ?
      {
        overall: `${p.diagnosticSummary.overallCorrect}/${p.diagnosticSummary.overallTotal}`,
        sections: p.diagnosticSummary.sections,
      }
    : null

  return JSON.stringify(
    {
      name: p.name,
      studyStatus: status,
      hoursPerDay: p.hoursPerDay,
      fullTimeStudying: p.fullTimeStudying,
      targetScore: p.targetScore,
      baselineScore: p.baselineScore,
      examDate: p.examDate,
      studyDays: studyDayNames,
      resources: p.resources,
      resourceOtherDetail: p.resourceOtherDetail,
      ankiDecks: p.ankiDecks,
      weakSections: p.weakSections,
      diagnosticSummary: diag,
    },
    null,
    2,
  )
}

function stripCodeFence(s: string): string {
  const t = s.trim()
  if (t.startsWith('```')) {
    return t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }
  return t
}

/** Best-effort parse if the model ever returns non-schema text (fallback). */
function tryParseJsonObject(text: string): unknown {
  const s = stripCodeFence(text)
  try {
    return JSON.parse(s)
  } catch {
    const start = s.indexOf('{')
    if (start < 0) throw new Error('No JSON object in response')
    let depth = 0
    for (let i = start; i < s.length; i++) {
      const c = s[i]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) return JSON.parse(s.slice(start, i + 1))
      }
    }
    throw new Error('Could not parse study plan JSON')
  }
}

function normalizePlan(raw: unknown): GeneratedPlan {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid plan payload')
  }
  const o = raw as Record<string, unknown>

  const overview =
    typeof o.overview === 'string' ? o.overview : 'Personalized MCAT study plan.'

  const totalWeeks =
    typeof o.totalWeeks === 'number' && o.totalWeeks > 0 ?
      Math.round(o.totalWeeks)
    : undefined

  let phases: PlanPhase[] = []
  if (Array.isArray(o.phases)) {
    phases = o.phases
      .map((p): PlanPhase | null => {
        if (!p || typeof p !== 'object') return null
        const x = p as Record<string, unknown>
        const name = typeof x.name === 'string' ? x.name : ''
        const weeks = typeof x.weeks === 'string' ? x.weeks : ''
        const focus = typeof x.focus === 'string' ? x.focus : ''
        const description =
          typeof x.description === 'string' ? x.description : undefined
        if (!name || !weeks) return null
        return { name, weeks, focus: focus || 'See weekly themes below.', description }
      })
      .filter((x): x is PlanPhase => x != null)
  }

  let weeklySchedule: PlanWeek[] = []
  if (Array.isArray(o.weeklySchedule)) {
    weeklySchedule = o.weeklySchedule
      .map((w): PlanWeek | null => {
        if (!w || typeof w !== 'object') return null
        const x = w as Record<string, unknown>
        const week = typeof x.week === 'number' ? x.week : Number(x.week)
        if (!Number.isFinite(week)) return null
        const theme = typeof x.theme === 'string' ? x.theme : undefined
        const days: PlanDay[] = []
        if (Array.isArray(x.days)) {
          for (const d of x.days) {
            if (!d || typeof d !== 'object') continue
            const dd = d as Record<string, unknown>
            const day = typeof dd.day === 'string' ? dd.day : 'Day'
            const tasks: string[] = []
            if (Array.isArray(dd.tasks)) {
              for (const t of dd.tasks) {
                if (typeof t === 'string' && t.trim()) tasks.push(t.trim())
              }
            }
            if (tasks.length) days.push({ day, tasks })
          }
        }
        return { week, theme, days }
      })
      .filter((x): x is PlanWeek => x != null)
  }

  let milestones: string[] = []
  if (Array.isArray(o.milestones)) {
    milestones = o.milestones.filter((m): m is string => typeof m === 'string')
  }

  let tips: string[] = []
  if (Array.isArray(o.tips)) {
    tips = o.tips.filter((t): t is string => typeof t === 'string')
  }

  return {
    overview,
    totalWeeks,
    phases,
    weeklySchedule,
    milestones,
    tips,
  }
}

/**
 * Build a study plan from the questionnaire profile using Gemini in the browser.
 * Requires `VITE_GEMINI_API_KEY`.
 */
export async function generateStudyPlanWithGemini(
  profile: UserProfile,
): Promise<GeneratedPlan> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY')

  const w = weeksUntilExam(profile.examDate)
  const gap = profile.targetScore - profile.baselineScore

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: STUDY_PLAN_RESPONSE_SCHEMA,
      temperature: 0.55,
      maxOutputTokens: 16_384,
    },
  })

  const prompt = `You are an expert MCAT tutor. Create a personalized study plan from this student profile (JSON):

${profileJson(profile)}

Rules:
- Weeks until exam ≈ ${w}. Put about ${Math.min(Math.min(w, 24), 8)} entries in weeklySchedule (weeks 1…N, N ≤ 8) so each week stays detailed but concise.
- Score gap ≈ ${gap} points (baseline ${profile.baselineScore} → target ${profile.targetScore}).
- Schedule only on: ${profile.studyDays.length > 0 ? profile.studyDays.map((d) => WEEK_NAMES[d]).join(', ') : 'weekdays (Mon–Fri)'}.
- Max ${Math.max(4, profile.hoursPerDay)} hours of tasks per study day across task lines (sum implied time).
- Prioritize weakSections; use diagnosticSummary if present.
- Mention named resources and Anki decks from the profile when relevant.
- CARS: spread across weeks. Suggest full-length practice every 2–3 weeks in task text.
- Each task string: one line, ≤ 120 characters, no quotation marks inside the task text (use semicolons or apostrophes if needed).

Fill phases (3 items), milestones (3–5 strings), tips (4–6 strings). weeklySchedule must have at least 4 weeks with concrete tasks per day.`

  let text: string
  try {
    const result = await model.generateContent(prompt)
    text = result.response.text()
  } catch (e) {
    const modelLoose = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.55,
        maxOutputTokens: 16_384,
      },
    })
    const result = await modelLoose.generateContent(
      `${prompt}\n\nOutput only one JSON object, no markdown.`,
    )
    text = result.response.text()
  }

  if (!text?.trim()) throw new Error('Empty response from Gemini')

  const parsed = tryParseJsonObject(text) as unknown
  return normalizePlan(parsed)
}

export function isGeminiStudyPlanAvailable(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim())
}
