import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ImportedDiagnosticReport } from '../types/diagnosticImport'

const MODEL = 'gemini-2.5-flash'
const MAX_TEXT_CHARS = 120_000

function excerpt(text: string, max = 1500) {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

function clampScaled(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  const r = Math.round(n)
  if (r >= 118 && r <= 132) return r
  if (r >= 472 && r <= 528) return null
  return null
}

function asStr(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

function asNum(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  return v
}

/**
 * Parse PDF plain text with Gemini into a structured report (Blueprint-style when possible).
 */
export async function analyzeDiagnosticPdfText(
  rawText: string,
  sourceFileName: string,
): Promise<ImportedDiagnosticReport> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add it to .env.local and restart dev.',
    )
  }

  const text =
    rawText.length > MAX_TEXT_CHARS ?
      rawText.slice(0, MAX_TEXT_CHARS)
    : rawText

  if (!text.trim()) {
    throw new Error(
      'No text found in that PDF. Try a text-based export (not a scan).',
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.25,
    },
  })

  const prompt = `You are an MCAT prep analyst. The following is plain text extracted from a student's DIAGNOSTIC score report PDF (may be Blueprint, AAMC, or similar). The text may be noisy or out of order.

Extract everything you can and output ONLY valid JSON (no markdown) with this exact shape:
{
  "reportTitle": "short title, e.g. Blueprint MCAT Diagnostic Score Report",
  "totalScore": number or null (472-528 scaled total if clearly stated, else null),
  "totalPercentile": "e.g. 17th percentile" or null,
  "sections": [
    {
      "key": "chem_phys",
      "label": "Human-readable section name",
      "scaledScore": 118-132 or null,
      "percentile": "e.g. 3rd percentile" or null,
      "correct": number optional,
      "total": number optional
    }
  ],
  "subjectBreakdown": [
    { "name": "Biochemistry", "questionCount": 16, "percentCorrect": 31.3 }
  ],
  "passageHighlights": [
    { "section": "CARS", "label": "Passage 1", "correct": 4, "total": 5 }
  ],
  "coachSummary": "2-4 short paragraphs: overall performance, timing vs accuracy if mentioned, and tone supportive.",
  "strengths": ["bullet strings"],
  "growthAreas": ["bullet strings"],
  "studyPriorities": ["ordered concrete next steps for MCAT prep"]
}

Rules:
- Include up to 4 main MCAT sections in "sections" when present (Chem/Phys, CARS, Bio/Biochem, Psych/Soc). Map keys: chem_phys, cars, bio_biochem, psych_soc.
- If only percentages appear for subjects, still fill subjectBreakdown.
- If passage/discrete rows appear (e.g. "Passage 2: 1/4 Correct"), add to passageHighlights (cap at 40 rows).
- Never invent numeric scores; use null if unclear.
- If the document is not an MCAT diagnostic, set reportTitle accordingly and explain in coachSummary.

PDF file name hint: ${sourceFileName}

--- BEGIN EXTRACTED TEXT ---
${text}
--- END ---`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  if (!raw?.trim()) throw new Error('Empty response from Gemini')

  let data: unknown
  try {
    const slice = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    data = JSON.parse(slice)
  } catch {
    throw new Error('Could not parse AI response. Try again or use another PDF export.')
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid AI response shape')
  }

  const o = data as Record<string, unknown>

  const sectionsRaw = Array.isArray(o.sections) ? o.sections : []
  const sections = sectionsRaw
    .filter((x) => x && typeof x === 'object')
    .map((x) => {
      const r = x as Record<string, unknown>
      return {
        key: asStr(r.key) ?? 'unknown',
        label: asStr(r.label) ?? 'Section',
        scaledScore: clampScaled(r.scaledScore),
        percentile: asStr(r.percentile),
        correct: asNum(r.correct) ?? undefined,
        total: asNum(r.total) ?? undefined,
      }
    })
    .slice(0, 8)

  const subRaw = Array.isArray(o.subjectBreakdown) ? o.subjectBreakdown : []
  const subjectBreakdown = subRaw
    .filter((x) => x && typeof x === 'object')
    .map((x) => {
      const r = x as Record<string, unknown>
      return {
        name: asStr(r.name) ?? 'Subject',
        questionCount: asNum(r.questionCount),
        percentCorrect: asNum(r.percentCorrect),
      }
    })
    .slice(0, 24)

  const passRaw = Array.isArray(o.passageHighlights) ? o.passageHighlights : []
  const passageHighlights = passRaw
    .filter((x) => x && typeof x === 'object')
    .map((x) => {
      const r = x as Record<string, unknown>
      const c = asNum(r.correct) ?? 0
      const t = asNum(r.total) ?? 0
      return {
        section: asStr(r.section) ?? '',
        label: asStr(r.label) ?? '',
        correct: c,
        total: t,
      }
    })
    .filter((p) => p.label && p.total > 0)
    .slice(0, 40)

  const strArr = (k: string) => {
    const v = o[k]
    if (!Array.isArray(v)) return []
    return v
      .filter((x) => typeof x === 'string' && x.trim())
      .map((x) => (x as string).trim())
      .slice(0, 20)
  }

  const totalScore = asNum(o.totalScore)
  const totalOk =
    totalScore !== null && totalScore >= 472 && totalScore <= 528 ?
      totalScore
    : null

  const report: ImportedDiagnosticReport = {
    analyzedAt: new Date().toISOString(),
    sourceFileName,
    reportTitle: asStr(o.reportTitle) ?? 'Diagnostic score report',
    totalScore: totalOk,
    totalPercentile: asStr(o.totalPercentile),
    sections,
    subjectBreakdown,
    passageHighlights,
    coachSummary: asStr(o.coachSummary) ?? 'No summary returned.',
    strengths: strArr('strengths'),
    growthAreas: strArr('growthAreas'),
    studyPriorities: strArr('studyPriorities'),
    textExcerpt: excerpt(rawText),
  }

  return report
}
