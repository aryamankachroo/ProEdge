export type DiagnosticQuestion = {
  id: number
  sectionNumber: 1 | 2 | 3 | 4
  sectionShort: string
  sectionTitle: string
  questionInSection: number
  sectionQuestionCount: number
  prompt: string
  choices: [string, string, string, string]
  /** Correct option index 0–3 (for future scoring) */
  correctIndex: number
  /** Why the keyed answer is correct */
  explanation: string
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    sectionNumber: 1,
    sectionShort: 'CHEM / PHYS',
    sectionTitle: 'Chemical and Physical Foundations of Biological Systems',
    questionInSection: 1,
    sectionQuestionCount: 3,
    prompt:
      'A gas expands isothermally against a constant external pressure. Which statement best describes the work done by the system on the surroundings?',
    choices: [
      'Work is zero because temperature is constant.',
      'Work is positive if the gas expands.',
      'Work is always negative for any expansion.',
      'Work depends only on the change in internal energy.',
    ],
    correctIndex: 1,
    explanation:
      'Isothermal means ΔU = 0 for an ideal gas, not that no work occurs. During expansion the gas can still do work on the surroundings; “work is zero because temperature is constant” confuses energy change with mechanical work.',
  },
  {
    id: 2,
    sectionNumber: 1,
    sectionShort: 'CHEM / PHYS',
    sectionTitle: 'Chemical and Physical Foundations of Biological Systems',
    questionInSection: 2,
    sectionQuestionCount: 3,
    prompt:
      'Which of the following best explains why adding a catalyst increases the rate of a chemical reaction?',
    choices: [
      'It increases the equilibrium constant of the reaction.',
      'It lowers the activation energy of the reaction pathway.',
      'It increases the average kinetic energy of the reactants.',
      'It shifts the reaction quotient Q toward products only.',
    ],
    correctIndex: 1,
    explanation:
      'Catalysts provide an alternate pathway with a lower activation energy; they do not change ΔG° or the equilibrium constant, and they do not change the average kinetic energy of molecules at a given temperature.',
  },
  {
    id: 3,
    sectionNumber: 1,
    sectionShort: 'CHEM / PHYS',
    sectionTitle: 'Chemical and Physical Foundations of Biological Systems',
    questionInSection: 3,
    sectionQuestionCount: 3,
    prompt:
      'Light passes from air into glass with a higher refractive index. Which quantity necessarily changes at the boundary?',
    choices: [
      'Frequency of the light',
      'Speed of the light in the medium',
      'Energy per photon',
      'Color perception independent of medium',
    ],
    correctIndex: 1,
    explanation:
      'Frequency (and photon energy E = hf) is set by the source and is unchanged at the boundary; in a medium, v = c/n, so the speed of light in the medium changes.',
  },
  {
    id: 4,
    sectionNumber: 2,
    sectionShort: 'CARS',
    sectionTitle: 'Critical Analysis and Reasoning Skills',
    questionInSection: 1,
    sectionQuestionCount: 2,
    prompt:
      'A passage argues that public funding for the arts should track measurable civic outcomes. The author’s main concern is most likely to:',
    choices: [
      'promote aesthetic relativism.',
      'justify accountability for how arts money is spent.',
      'eliminate private patronage of museums.',
      'replace qualitative criticism with popularity metrics only.',
    ],
    correctIndex: 1,
    explanation:
      'Linking funding to measurable civic outcomes shows the author cares about demonstrating results and accountability for public spending, not eliminating private support or replacing all qualitative judgment.',
  },
  {
    id: 5,
    sectionNumber: 2,
    sectionShort: 'CARS',
    sectionTitle: 'Critical Analysis and Reasoning Skills',
    questionInSection: 2,
    sectionQuestionCount: 2,
    prompt:
      'If the passage treats a counterexample as a special case rather than a refutation, the author is probably:',
    choices: [
      'conceding the entire argument.',
      'qualifying a general claim without abandoning it.',
      'committing an ad hominem fallacy.',
      'confusing correlation with causation.',
    ],
    correctIndex: 1,
    explanation:
      'Treating a counterexample as a special case narrows or refines the main claim rather than overturning it—this is qualifying the general statement.',
  },
  {
    id: 6,
    sectionNumber: 3,
    sectionShort: 'BIO / BIOCHEM',
    sectionTitle: 'Biological and Biochemical Foundations of Living Systems',
    questionInSection: 1,
    sectionQuestionCount: 3,
    prompt:
      'In eukaryotes, where is the electron transport chain primarily located during oxidative phosphorylation?',
    choices: [
      'Cytoplasm',
      'Inner mitochondrial membrane',
      'Outer mitochondrial membrane',
      'Nucleolus',
    ],
    correctIndex: 1,
    explanation:
      'The electron transport chain pumps protons and couples electron flow to ATP synthase; in eukaryotes it sits in the inner mitochondrial membrane.',
  },
  {
    id: 7,
    sectionNumber: 3,
    sectionShort: 'BIO / BIOCHEM',
    sectionTitle: 'Biological and Biochemical Foundations of Living Systems',
    questionInSection: 2,
    sectionQuestionCount: 3,
    prompt:
      'Which enzyme class typically catalyzes the hydrolysis of peptide bonds?',
    choices: [
      'Kinases',
      'Proteases',
      'Isomerases',
      'Ligases',
    ],
    correctIndex: 1,
    explanation:
      'Peptide-bond hydrolysis is cleaving the amide linkage between amino acids; proteases (peptidases) specialize in that reaction.',
  },
  {
    id: 8,
    sectionNumber: 3,
    sectionShort: 'BIO / BIOCHEM',
    sectionTitle: 'Biological and Biochemical Foundations of Living Systems',
    questionInSection: 3,
    sectionQuestionCount: 3,
    prompt:
      'DNA replication is semiconservative because each daughter duplex contains:',
    choices: [
      'two newly synthesized strands.',
      'one parental strand and one new strand.',
      'only parental DNA after repair.',
      'RNA primers instead of DNA on both sides.',
    ],
    correctIndex: 1,
    explanation:
      'Semiconservative replication means each daughter double helix contains one original parental strand and one newly synthesized complementary strand.',
  },
  {
    id: 9,
    sectionNumber: 4,
    sectionShort: 'PSYCH / SOC',
    sectionTitle:
      'Psychological, Social, and Biological Foundations of Behavior',
    questionInSection: 1,
    sectionQuestionCount: 2,
    prompt:
      'In classical conditioning, the conditioned stimulus (CS) is best defined as:',
    choices: [
      'an innate reflex elicited without prior learning.',
      'a previously neutral cue that comes to predict the unconditioned stimulus.',
      'the unlearned response to food or pain.',
      'a punishment schedule that reduces behavior.',
    ],
    correctIndex: 1,
    explanation:
      'After repeated pairing, a conditioned stimulus is a cue that was initially neutral but now predicts the unconditioned stimulus (e.g., the US that originally drove the reflex).',
  },
  {
    id: 10,
    sectionNumber: 4,
    sectionShort: 'PSYCH / SOC',
    sectionTitle:
      'Psychological, Social, and Biological Foundations of Behavior',
    questionInSection: 2,
    sectionQuestionCount: 2,
    prompt:
      'Which term describes the tendency for people to exert less effort when working in a group than when working alone?',
    choices: [
      'Groupthink',
      'Social loafing',
      'Fundamental attribution error',
      'Cognitive dissonance',
    ],
    correctIndex: 1,
    explanation:
      'Social loafing is reduced individual effort when people work in a group and responsibility feels diffuse; groupthink is premature consensus, not simply lower effort.',
  },
]

export const DIAGNOSTIC_TOTAL = DIAGNOSTIC_QUESTIONS.length
