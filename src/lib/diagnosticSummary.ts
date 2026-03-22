import type { DiagnosticSessionQuestion } from './diagnosticSession'
import type {
  DiagnosticQuestionResult,
  DiagnosticSectionKey,
  DiagnosticSummary,
} from '../types/profile'

const SECTION_BY_NUMBER: Record<1 | 2 | 3 | 4, DiagnosticSectionKey> = {
  1: 'chemPhys',
  2: 'cars',
  3: 'bioBiochem',
  4: 'psychSoc',
}

function emptySections(): DiagnosticSummary['sections'] {
  return {
    chemPhys: { correct: 0, total: 0 },
    cars: { correct: 0, total: 0 },
    bioBiochem: { correct: 0, total: 0 },
    psychSoc: { correct: 0, total: 0 },
  }
}

/**
 * Score the mini diagnostic using the same question order the user saw
 * (`createDiagnosticSession()`), including shuffled answer choices.
 */
export function buildDiagnosticSummary(
  answers: number[],
  questions: DiagnosticSessionQuestion[],
): DiagnosticSummary {
  const sections = emptySections()
  let overallCorrect = 0
  const overallTotal = questions.length
  const questionResults: DiagnosticQuestionResult[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const key = SECTION_BY_NUMBER[q.sectionNumber]
    sections[key].total++
    const selectedIndex = answers[i]!
    const isCorrect = selectedIndex === q.correctIndex
    if (isCorrect) {
      sections[key].correct++
      overallCorrect++
    }
    questionResults.push({
      index: i + 1,
      sectionShort: q.sectionShort,
      sectionTitle: q.sectionTitle,
      prompt: q.prompt,
      choices: q.choices,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    })
  }

  return {
    completedAt: new Date().toISOString(),
    overallCorrect,
    overallTotal,
    sections,
    questionResults,
  }
}
