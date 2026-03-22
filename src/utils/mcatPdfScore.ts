import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let workerConfigured = false

function ensureWorker() {
  if (!workerConfigured) {
    GlobalWorkerOptions.workerSrc = pdfWorker
    workerConfigured = true
  }
}

export async function extractPdfPlainText(file: File): Promise<string> {
  const data = await file.arrayBuffer()
  return pdfToPlainText(data)
}

async function pdfToPlainText(data: ArrayBuffer): Promise<string> {
  ensureWorker()
  const pdf = await getDocument({ data: new Uint8Array(data) }).promise
  const parts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    for (const item of textContent.items) {
      if (item && typeof item === 'object' && 'str' in item) {
        const s = (item as { str: string }).str
        if (s) parts.push(s)
      }
    }
    parts.push('\n')
  }
  return parts.join(' ')
}

/** Heuristic: find MCAT total (scaled 472–528) from AAMC-style report text. */
export function parseMcatTotalScoreFromText(text: string): number | null {
  const normalized = text.replace(/\s+/g, ' ')
  const labeled = [
    /Total\s+Score\s*[:#]?\s*(\d{3})\b/i,
    /MCAT\s+Total\s*[:#]?\s*(\d{3})\b/i,
    /Total\s*MCAT\s+Score\s*[:#]?\s*(\d{3})\b/i,
    /Overall\s+Score\s*[:#]?\s*(\d{3})\b/i,
  ]
  for (const re of labeled) {
    const m = normalized.match(re)
    if (m) {
      const n = Number.parseInt(m[1], 10)
      if (n >= 472 && n <= 528) return n
    }
  }

  const lower = normalized.toLowerCase()
  const idx = lower.search(/\btotal\b/)
  if (idx >= 0) {
    const window = normalized.slice(idx, idx + 120)
    const m = window.match(/\b(47[2-9]|4[89]\d|5[01]\d|52[0-8])\b/)
    if (m) {
      const n = Number.parseInt(m[1], 10)
      if (n >= 472 && n <= 528) return n
    }
  }

  const candidates = normalized.match(
    /\b(47[2-9]|4[89]\d|5[01]\d|52[0-8])\b/g,
  )
  if (candidates?.length) {
    const scores = candidates
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => n >= 472 && n <= 528)
    if (scores.length === 1) return scores[0]
    if (scores.length > 1) {
      const counts = new Map<number, number>()
      for (const s of scores) counts.set(s, (counts.get(s) ?? 0) + 1)
      let best = scores[0]
      let bestC = 0
      for (const [v, c] of counts) {
        if (c > bestC || (c === bestC && v > best)) {
          best = v
          bestC = c
        }
      }
      return best
    }
  }

  return null
}

export type PdfScoreResult = {
  score: number | null
  /** Short excerpt for debugging / “couldn’t find score” */
  excerpt: string
}

export async function extractMcatTotalFromPdfFile(
  file: File,
): Promise<PdfScoreResult> {
  const text = await extractPdfPlainText(file)
  const excerpt = text.replace(/\s+/g, ' ').trim().slice(0, 800)
  const score = parseMcatTotalScoreFromText(text)
  return { score, excerpt }
}
