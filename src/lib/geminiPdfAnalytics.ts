import { GoogleGenerativeAI } from '@google/generative-ai'
import type { PracticeAnalyticsReport, PracticeInsight, PracticeSectionRow } from '../types/analytics'

const MODEL = 'gemini-2.5-flash'

/** Keep prompt within practical context limits for long exports. */
const MAX_TEXT_CHARS = 48_000

const SECTION_LABELS = [
  'Chemistry & Physics',
  'CARS',
  'Biology & Biochemistry',
  'Psychology & Sociology',
] as const

function canonicalSectionLabel(raw: string): (typeof SECTION_LABELS)[number] | null {
  const s = raw.toLowerCase()
  if (
    /chemical|chem\/?phys|c\/p|physical\s+foundations|foundations\s+of\s+biological\s+systems/i.test(
      s,
    ) &&
    !/bio|psych|social|cars|reasoning/i.test(s)
  ) {
    return 'Chemistry & Physics'
  }
  if (/cars|critical\s+analysis|reasoning\s+skills/i.test(s)) return 'CARS'
  if (
    /bio|biochem|biological\s+and\s+biochemical|b\/?b/i.test(s) &&
    !/psych|social|behavior/i.test(s)
  ) {
    return 'Biology & Biochemistry'
  }
  if (/psych|social|p\/?s|behavior/i.test(s) && !/bio|chem|cars/i.test(s)) {
    return 'Psychology & Sociology'
  }
  return null
}

function clampScore118_132(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  const r = Math.round(n)
  if (r < 118 || r > 132) return null
  return r
}

function clampTotal472_528(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  const r = Math.round(n)
  if (r < 472 || r > 528) return null
  return r
}

function parseInsight(x: unknown): PracticeInsight | null {
  if (!x || typeof x !== 'object') return null
  const title = (x as { title?: unknown }).title
  const description = (x as { description?: unknown }).description
  if (typeof title !== 'string' || typeof description !== 'string') return null
  const t = title.trim().slice(0, 120)
  const d = description.trim().slice(0, 600)
  if (!t || !d) return null
  return { title: t, description: d }
}

function normalizeGeminiJson(raw: string): PracticeAnalyticsReport {
  const trimmed = raw.trim()
  const jsonSlice =
    trimmed.startsWith('```') ?
      trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    : trimmed

  const data = JSON.parse(jsonSlice) as {
    totalScore?: unknown
    sections?: unknown
    strengths?: unknown
    weaknesses?: unknown
  }

  const totalScore = clampTotal472_528(data.totalScore)

  const rawSections = Array.isArray(data.sections) ? data.sections : []
  const byLabel = new Map<string, PracticeSectionRow>()
  for (const row of rawSections) {
    if (!row || typeof row !== 'object') continue
    const labelRaw = (row as { label?: unknown }).label
    if (typeof labelRaw !== 'string') continue
    const labelTrim = labelRaw.trim()
    const canonical =
      SECTION_LABELS.find((L) => L === labelTrim) ??
      canonicalSectionLabel(labelTrim) ??
      null
    if (!canonical) continue
    const scaledScore = clampScore118_132((row as { scaledScore?: unknown }).scaledScore)
    const detailRaw = (row as { detail?: unknown }).detail
    const detail =
      typeof detailRaw === 'string' && detailRaw.trim()
        ? detailRaw.trim().slice(0, 400)
        : scaledScore != null
          ? `Scaled score ${scaledScore} (Gemini extraction).`
          : 'Score not found in this section of the report.'
    byLabel.set(canonical, {
      label: canonical,
      scaledScore,
      detail,
    })
  }

  const sections: PracticeSectionRow[] = SECTION_LABELS.map((label) => {
    const exact = byLabel.get(label)
    if (exact) return exact
    const ci = [...byLabel.entries()].find(
      ([k]) => k.toLowerCase() === label.toLowerCase(),
    )
    if (ci) return { ...ci[1], label }
    return {
      label,
      scaledScore: null,
      detail: 'Not matched in model output — try re-upload or check PDF text export.',
    }
  })

  const strengths: PracticeInsight[] = []
  if (Array.isArray(data.strengths)) {
    for (const s of data.strengths) {
      const p = parseInsight(s)
      if (p) strengths.push(p)
    }
  }

  const weaknesses: PracticeInsight[] = []
  if (Array.isArray(data.weaknesses)) {
    for (const s of data.weaknesses) {
      const p = parseInsight(s)
      if (p) weaknesses.push(p)
    }
  }

  return {
    totalScore,
    sections,
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    excerpt: '',
    engine: 'gemini_v1' as const,
  }
}

/**
 * Use Gemini Flash to read MCAT-style report text and return section scores + insights.
 * Requires `VITE_GEMINI_API_KEY` (browser — demos only).
 */
export async function analyzePracticeReportWithGemini(
  rawText: string,
): Promise<PracticeAnalyticsReport> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }

  const excerpt = rawText.replace(/\s+/g, ' ').trim().slice(0, 720)
  const body =
    rawText.length > MAX_TEXT_CHARS ?
      `${rawText.slice(0, MAX_TEXT_CHARS)}\n\n[... truncated for analysis; scores usually appear in the first pages ...]`
    : rawText

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.15,
    },
  })

  const prompt = `You extract MCAT practice or official score report data from plain text (OCR/PDF text dump).

TASK:
1. Find the **total scaled score** (472–528) if present. Use null if unclear.
2. Find each **section scaled score** (118–132) for the four MCAT sections. Section titles in the PDF may use abbreviations or long names, e.g.:
   - Chem/Phys / Chemical and Physical Foundations → label "Chemistry & Physics"
   - CARS / Critical Analysis and Reasoning → label "CARS"
   - Bio/Biochem / Biological and Biochemical Foundations → label "Biology & Biochemistry"
   - Psych/Soc / Psychological, Social, and Biological Foundations → label "Psychology & Sociology"
3. Return **exactly four** objects in sections[], in this order, with these exact "label" strings:
   "Chemistry & Physics", "CARS", "Biology & Biochemistry", "Psychology & Sociology"
4. For each section, set "detail" to a short sentence (how you found the score, or why null).
5. strengths: 2–4 items with concrete titles (topics or skills) and 1–2 sentence descriptions based on the report (accuracy, passages, content areas praised).
6. weaknesses: 2–4 items with actionable titles and descriptions (what to drill, not generic fluff).

Rules:
- Prefer numbers explicitly tied to section summaries in the text.
- If multiple totals appear, prefer the official "Total Score" / composite 472–528.
- Output **only** valid JSON, no markdown.

Schema:
{
  "totalScore": number | null,
  "sections": [
    { "label": "Chemistry & Physics", "scaledScore": number | null, "detail": "string" },
    { "label": "CARS", "scaledScore": number | null, "detail": "string" },
    { "label": "Biology & Biochemistry", "scaledScore": number | null, "detail": "string" },
    { "label": "Psychology & Sociology", "scaledScore": number | null, "detail": "string" }
  ],
  "strengths": [{ "title": "string", "description": "string" }],
  "weaknesses": [{ "title": "string", "description": "string" }]
}

REPORT TEXT:
---
${body}
---`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  if (!text?.trim()) throw new Error('Empty response from Gemini')

  const report = normalizeGeminiJson(text)
  return {
    ...report,
    excerpt,
    engine: 'gemini_v1',
  }
}

export function isGeminiAnalyticsAvailable(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim())
}
