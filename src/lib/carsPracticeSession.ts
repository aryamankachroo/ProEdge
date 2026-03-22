import {
  CARS_PRACTICE_QUESTIONS,
  type CarsPracticeQuestion,
} from '../data/carsPracticeQuestions'

function shuffleIndices(n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

function shuffleChoices(q: CarsPracticeQuestion): {
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

export type CarsPracticeSessionItem = {
  passage: string
  stem: string
  choices: [string, string, string, string]
  correctIndex: number
  explanation: string
}

/** Random order of all five items and shuffled answer choices per item. */
export function createCarsPracticeSession(): CarsPracticeSessionItem[] {
  const order = shuffleIndices(CARS_PRACTICE_QUESTIONS.length)
  return order.map((qi) => {
    const base = CARS_PRACTICE_QUESTIONS[qi]
    const { choices, correctIndex } = shuffleChoices(base)
    return {
      passage: base.passage,
      stem: base.stem,
      choices,
      correctIndex,
      explanation: base.explanation,
    }
  })
}
