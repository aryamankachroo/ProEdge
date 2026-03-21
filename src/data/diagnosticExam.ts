/** Mini full-length structure: all four MCAT sections, a few items each. */
export const QUESTIONS_PER_SECTION = 2

export type DiagnosticQuestion = {
  id: string
  passage?: string
  stem: string
  choices: readonly string[]
  correctIndex: number
}

export type DiagnosticSection = {
  id: string
  shortName: string
  fullName: string
  questions: readonly DiagnosticQuestion[]
}

export const DIAGNOSTIC_SECTIONS: readonly DiagnosticSection[] = [
  {
    id: 'cp',
    shortName: 'Chem / Phys',
    fullName: 'Chemical and Physical Foundations of Biological Systems',
    questions: [
      {
        id: 'cp-1',
        stem: 'A gas expands isothermally against a constant external pressure. Which statement best describes the work done by the system on the surroundings?',
        choices: [
          'Work is zero because temperature is constant.',
          'Work is positive if the gas expands.',
          'Work is always negative for any expansion.',
          'Work depends only on the change in internal energy.',
        ],
        correctIndex: 1,
      },
      {
        id: 'cp-2',
        stem: 'In a simple circuit, a 12 V battery is connected in series with a 4 Ω resistor. What is the current through the resistor?',
        choices: ['0.25 A', '3 A', '48 A', '8 A'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'cars',
    shortName: 'CARS',
    fullName: 'Critical Analysis and Reasoning Skills',
    questions: [
      {
        id: 'cars-1',
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
      },
      {
        id: 'cars-2',
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
      },
    ],
  },
  {
    id: 'bb',
    shortName: 'Bio / Biochem',
    fullName: 'Biological and Biochemical Foundations of Living Systems',
    questions: [
      {
        id: 'bb-1',
        stem: 'An enzyme follows Michaelis–Menten kinetics. At very high substrate concentration, the reaction rate is primarily limited by:',
        choices: [
          'substrate diffusion only',
          'the enzyme’s maximum capacity (Vmax)',
          'product inhibition only',
          'the dissociation constant of the ES complex only',
        ],
        correctIndex: 1,
      },
      {
        id: 'bb-2',
        stem: 'A rare autosomal recessive disorder appears in a family with unaffected parents. What is the most likely genotype situation for the parents?',
        choices: [
          'One parent homozygous dominant, one homozygous recessive',
          'Both parents heterozygous carriers',
          'Both parents homozygous recessive',
          'One parent heterozygous, one homozygous dominant',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'ps',
    shortName: 'Psych / Soc',
    fullName: 'Psychological, Social, and Biological Foundations of Behavior',
    questions: [
      {
        id: 'ps-1',
        stem: 'A study randomly assigns participants to conditions and manipulates one variable while holding others constant. This design primarily supports:',
        choices: [
          'correlational claims about natural groups',
          'claims about causal direction between variables',
          'descriptive statistics only',
          'case-study generalization',
        ],
        correctIndex: 1,
      },
      {
        id: 'ps-2',
        stem: 'According to social identity theory, which outcome is most expected when group boundaries feel threatened?',
        choices: [
          'Reduced in-group favoritism',
          'Stronger identification with the in-group and out-group differentiation',
          'Random switching between groups',
          'Elimination of stereotype use',
        ],
        correctIndex: 1,
      },
    ],
  },
] as const

export function totalDiagnosticQuestions(): number {
  return DIAGNOSTIC_SECTIONS.reduce((n, s) => n + s.questions.length, 0)
}
