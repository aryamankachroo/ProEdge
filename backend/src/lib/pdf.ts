import pdfParse from 'pdf-parse'
import { DiagnosticScores } from '../types'

function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const val = parseInt(match[1], 10)
      if (!isNaN(val)) return val
    }
  }
  return null
}

function extractDate(text: string): string | null {
  const patterns = [
    /test date[:\s]*([a-z]+ \d{1,2},?\s*\d{4})/i,
    /date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const parsed = new Date(match[1])
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    }
  }
  return null
}

export async function parseDiagnosticPdf(buffer: Buffer): Promise<DiagnosticScores> {
  const data = await pdfParse(buffer)
  const text = data.text

  const totalScore = extractNumber(text, [
    /total score[:\s]*(\d{3})/i,
    /composite score[:\s]*(\d{3})/i,
    /mcat total[:\s]*(\d{3})/i,
    /scaled score[:\s]*(\d{3})\s*\/\s*528/i,
    /\btotal\b[^\d]*(\d{3})\s*(?:\/\s*528)?/i,
  ])

  const carsScore = extractNumber(text, [
    /critical analysis and reasoning[:\s]*(\d{3})/i,
    /cars[:\s]*(\d{3})/i,
    /critical analysis[:\s]*(\d{3})/i,
    /reasoning skills[:\s]*(\d{3})/i,
  ])

  const bioBiochemScore = extractNumber(text, [
    /biological and biochemical[:\s]*(\d{3})/i,
    /bio(?:logical)?[\/\s&,]+biochem(?:ical)?[:\s]*(\d{3})/i,
    /bio\/biochem[:\s]*(\d{3})/i,
    /biological foundations[:\s]*(\d{3})/i,
  ])

  const chemPhysScore = extractNumber(text, [
    /chemical and physical[:\s]*(\d{3})/i,
    /chem(?:ical)?[\/\s&,]+phys(?:ical)?[:\s]*(\d{3})/i,
    /chem\/phys[:\s]*(\d{3})/i,
    /physical foundations[:\s]*(\d{3})/i,
  ])

  const psychSocScore = extractNumber(text, [
    /psychological[,\s]+social[:\s]*(\d{3})/i,
    /psych(?:ological)?[\/\s&,]+soc(?:ial)?[:\s]*(\d{3})/i,
    /psych\/soc[:\s]*(\d{3})/i,
    /behavioral foundations[:\s]*(\d{3})/i,
  ])

  const percentile = extractNumber(text, [
    /percentile[:\s]*(\d{1,3}(?:\.\d+)?)/i,
    /(\d{1,3})(?:st|nd|rd|th)?\s*percentile/i,
  ])

  const testDate = extractDate(text)

  return {
    totalScore,
    carsScore,
    bioBiochemScore,
    chemPhysScore,
    psychSocScore,
    percentile,
    testDate,
    source: 'pdf_import',
    rawPdfText: text.substring(0, 5000),
  }
}
