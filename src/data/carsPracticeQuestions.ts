export type CarsPracticeQuestion = {
  id: number
  passage: string
  stem: string
  choices: [string, string, string, string]
  correctIndex: number
  explanation: string
}

/** Fixed bank of five CARS-style items (passage + discrete question). */
export const CARS_PRACTICE_QUESTIONS: CarsPracticeQuestion[] = [
  {
    id: 1,
    passage:
      'Policy debates often treat compromise as weakness. Yet many durable reforms emerge only when opposing camps accept partial gains rather than total victory.',
    stem: 'The author’s stance toward compromise is best characterized as:',
    choices: [
      'dismissive, because compromise avoids core issues',
      'skeptical, because reforms are rarely durable',
      'qualified approval, as a path to lasting change',
      'neutral, because no normative claim is offered',
    ],
    correctIndex: 2,
    explanation:
      'The author contrasts the idea that compromise is weakness with the claim that durable reforms often require partial gains—so the view of compromise is positive but bounded (qualified approval), not dismissive or purely neutral.',
  },
  {
    id: 2,
    passage:
      'Historians who rely solely on official archives risk mistaking administrative convenience for social reality. Unofficial records can reveal voices the state never meant to preserve.',
    stem: 'Which inference is most supported?',
    choices: [
      'Official archives are always misleading.',
      'Unofficial sources can correct gaps in dominant narratives.',
      'Administrative records should be discarded.',
      'Social reality is fully captured by state documents.',
    ],
    correctIndex: 1,
    explanation:
      'The passage argues official archives are incomplete for social reality and that unofficial records surface omitted perspectives—best supported by the idea that those sources can fill gaps, not that archives are always wrong or useless.',
  },
  {
    id: 3,
    passage:
      'Translating clinical trial results into public health advice requires more than statistical significance. Effect sizes, harms, and who was actually studied all determine whether a finding should change behavior at the population level.',
    stem: 'The author is primarily concerned with:',
    choices: [
      'replacing statistics with expert opinion',
      'what conditions must hold before broad recommendations follow from research',
      'proving that most trials are poorly designed',
      'avoiding replication of published studies',
    ],
    correctIndex: 1,
    explanation:
      'The passage lists factors beyond p-values (effect size, harms, sample relevance) that govern whether results warrant population-level advice—i.e., conditions for responsible translation to recommendations.',
  },
  {
    id: 4,
    passage:
      'Critics of merit-based admissions sometimes assume that merit can be measured without context. Defenders reply that ignoring context can reward advantages that masquerade as raw talent.',
    stem: 'The “defenders” in this exchange would most likely agree that:',
    choices: [
      'merit is impossible to define',
      'seemingly neutral metrics can encode prior advantage',
      'admissions should ignore academic performance',
      'context should never influence evaluation',
    ],
    correctIndex: 1,
    explanation:
      'Defenders argue that context-free “merit” can credit advantages that look like talent—aligned with the idea that neutral-seeming metrics may still reflect inequality.',
  },
  {
    id: 5,
    passage:
      'A museum director writes that accessibility is not dilution: when exhibits meet visitors where they are, engagement deepens and critical questions multiply rather than vanish.',
    stem: 'Which statement best reflects the director’s claim?',
    choices: [
      'Simpler language always replaces analysis.',
      'Accessibility can support richer participation and inquiry.',
      'Critics of accessibility value elitism over truth.',
      'Museums should prioritize popularity over accuracy.',
    ],
    correctIndex: 1,
    explanation:
      'The director links accessibility to deeper engagement and more questions, not fewer—so accessibility supports participation and inquiry rather than watering content down by definition.',
  },
]

export const CARS_PRACTICE_TOTAL = CARS_PRACTICE_QUESTIONS.length
