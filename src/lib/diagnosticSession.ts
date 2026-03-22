import { DIAGNOSTIC_QUESTIONS, type DiagnosticQuestion } from '../data/diagnosticQuestions'

function shuffleIndices(n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

function shuffleChoices(q: DiagnosticQuestion): {
  choices: [string, string, string, string]
  correctIndex: number
} {
  const order = shuffleIndices(4)
  const choices = order.map((i) => q.choices[i]) as [
    string,
    string,
    string,
    string,
  ]
  const correctIndex = order.indexOf(q.correctIndex)
  return { choices, correctIndex }
}

/** One question in display order — order and choice letters change each session. */
export type DiagnosticSessionQuestion = {
  sectionNumber: DiagnosticQuestion['sectionNumber']
  sectionShort: string
  sectionTitle: string
  questionInSection: number
  sectionQuestionCount: number
  prompt: string
  choices: [string, string, string, string]
  correctIndex: number
  explanation: string
}

/** New shuffled question order and per-question choice shuffle for each visit to the mini diagnostic. */
export function createDiagnosticSession(): DiagnosticSessionQuestion[] {
  const order = shuffleIndices(DIAGNOSTIC_QUESTIONS.length)
  return order.map((qi) => {
    const base = DIAGNOSTIC_QUESTIONS[qi]
    const { choices, correctIndex } = shuffleChoices(base)
    return {
      sectionNumber: base.sectionNumber,
      sectionShort: base.sectionShort,
      sectionTitle: base.sectionTitle,
      questionInSection: base.questionInSection,
      sectionQuestionCount: base.sectionQuestionCount,
      prompt: base.prompt,
      choices,
      correctIndex,
      explanation: base.explanation,
    }
  })
}
