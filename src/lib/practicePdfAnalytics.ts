import type { PracticeAnalyticsReport, PracticeInsight } from '../types/analytics'
import { parseMcatTotalScoreFromText } from '../utils/mcatPdfScore'

const SECTION_BLOCKS: { label: string; needle: RegExp }[] = [
  {
    label: 'Chemistry & Physics',
    needle:
      /Chemical\s+and\s+Physical\s+Foundations\s+of\s+Biological\s+Systems/i,
  },
  {
    label: 'CARS',
    needle: /Critical\s+Analysis\s+and\s+Reasoning\s+Skills/i,
  },
  {
    label: 'Biology & Biochemistry',
    needle:
      /Biological\s+and\s+Biochemical\s+Foundations\s+of\s+Living\s+Systems/i,
  },
  {
    label: 'Psychology & Sociology',
    needle:
      /Psychological,?\s+Social,?\s+and\s+Biological\s+Foundations\s+of\s+Behavior/i,
  },
]

const TOPIC_PATTERNS: { re: RegExp; title: string }[] = [
  { re: /thermodynamic/i, title: 'Thermodynamics & energy' },
  { re: /electroch/i, title: 'Electrochemistry' },
  { re: /acid.{0,10}base|pKa|buffer/i, title: 'Acids, bases & buffers' },
  { re: /kinematic|projectile|force\s+and\s+motion/i, title: 'Forces & kinematics' },
  { re: /optic|lens|refraction|diffraction/i, title: 'Optics & waves' },
  {
    re: /amino\s+acid|protein\s+structure|enzyme\s+kinetics/i,
    title: 'Proteins & enzyme kinetics',
  },
  {
    re: /citric\s+acid|glycolysis|electron\s+transport|oxidative/i,
    title: 'Cellular respiration & metabolism',
  },
  {
    re: /genetic|transcription|translation|mutation/i,
    title: 'Genetics & gene expression',
  },
  { re: /research\s+design|confound|validity/i, title: 'Research design & bias' },
  { re: /memory|learning|condition|reinforce/i, title: 'Learning & behavior (P/S)' },
  { re: /social\s+psych|attribut|conform/i, title: 'Social psychology' },
  { re: /passage|inference|author/i, title: 'CARS reasoning & author intent' },
]

function scoreNearHeading(text: string, from: number): number | null {
  const slice = text.slice(from, from + 700)
  const matches = [...slice.matchAll(/\b(11[89]|12[0-9]|13[0-2])\b/g)]
  for (const m of matches) {
    const n = Number.parseInt(m[1], 10)
    if (n >= 118 && n <= 132) return n
  }
  return null
}

function parseSections(text: string) {
  return SECTION_BLOCKS.map(({ label, needle }) => {
    const m = needle.exec(text)
    if (m == null || m.index === undefined) {
      return {
        label,
        scaledScore: null as number | null,
        detail: 'Section heading not found in extracted text.',
      }
    }
    const sc = scoreNearHeading(text, m.index)
    return {
      label,
      scaledScore: sc,
      detail:
        sc != null
          ? `Found scaled score ${sc} near this section block.`
          : 'Section heading found; no 118–132 score detected nearby (try a text-based PDF export).',
    }
  })
}

function dedupeInsights(items: PracticeInsight[]): PracticeInsight[] {
  const seen = new Set<string>()
  const out: PracticeInsight[] = []
  for (const it of items) {
    const k = it.title.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

function mineTopics(
  text: string,
  mode: 'weak' | 'strong',
): PracticeInsight[] {
  const weakRe =
    /incorrect|missed|opportunit|below|weak|struggle|difficult|low\s+accuracy|needs?\s+improvement/i
  const strongRe =
    /correct|strong|above|high|master|well|excellent|proficient|strength/i

  const out: PracticeInsight[] = []
  for (const { re, title } of TOPIC_PATTERNS) {
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
    let m: RegExpExecArray | null
    while ((m = r.exec(text)) != null) {
      const start = Math.max(0, m.index - 100)
      const ctx = text.slice(start, m.index + 120)
      if (mode === 'weak' && weakRe.test(ctx)) {
        out.push({
          title: `Topic signal: ${title}`,
          description:
            'This theme appears near language that often marks missed items or growth areas in score reports.',
        })
        break
      }
      if (mode === 'strong' && strongRe.test(ctx)) {
        out.push({
          title: `Solid area: ${title}`,
          description:
            'This theme appears near language that often marks strengths or secure skills.',
        })
        break
      }
    }
  }
  return dedupeInsights(out).slice(0, 4)
}

function relativeSectionInsights(
  sections: PracticeAnalyticsReport['sections'],
): { strengths: PracticeInsight[]; weaknesses: PracticeInsight[] } {
  const parsed = sections
    .filter((s): s is typeof s & { scaledScore: number } => s.scaledScore != null)
    .map((s) => ({ label: s.label, scaledScore: s.scaledScore }))

  if (parsed.length < 2) {
    return { strengths: [], weaknesses: [] }
  }

  const sorted = [...parsed].sort((a, b) => b.scaledScore - a.scaledScore)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  if (best.scaledScore === worst.scaledScore) {
    return { strengths: [], weaknesses: [] }
  }

  return {
    strengths: [
      {
        title: `Relative strength: ${best.label}`,
        description: `Highest parsed section score in this PDF (${best.scaledScore}). Keep short maintenance passages or drills so the skill stays automatic.`,
      },
    ],
    weaknesses: [
      {
        title: `Relative gap: ${worst.label}`,
        description: `Lowest parsed section score (${worst.scaledScore}). Add timed sets and error logs focused here before your next full-length.`,
      },
    ],
  }
}

function fallbackFromTotal(total: number | null): {
  strengths: PracticeInsight[]
  weaknesses: PracticeInsight[]
} {
  if (total == null) {
    return {
      strengths: [
        {
          title: 'Upload a text-based PDF',
          description:
            'Many third-party exports are image-only; use “print to PDF” or official text exports so we can read headings and scores.',
        },
      ],
      weaknesses: [
        {
          title: 'Connect an AI backend (next step)',
          description:
            'Full item-level reasoning needs a server + model. This screen previews structure with on-device parsing today.',
        },
      ],
    }
  }

  const mid = 500
  if (total >= mid + 8) {
    return {
      strengths: [
        {
          title: 'Overall scaled score looks competitive',
          description: `Total ${total} is above typical mid-pack range — keep balancing content review with stamina on full-lengths.`,
        },
      ],
      weaknesses: [
        {
          title: 'Polish careless patterns',
          description:
            'At higher totals, gains often come from experimental skills, timing, and reviewing “easy” misses — not only new content.',
        },
      ],
    }
  }

  if (total <= mid - 8) {
    return {
      strengths: [
        {
          title: 'Clear upside if you tighten fundamentals',
          description:
            'Large gaps often close quickly with spaced repetition, UWorld-level review, and strict timing.',
        },
      ],
      weaknesses: [
        {
          title: 'Prioritize high-yield systems review',
          description: `With total ${total}, build a weekly plan that mixes one weak science section, daily CARS, and Anki so each modality moves together.`,
        },
      ],
    }
  }

  return {
    strengths: [
      {
        title: 'Balanced growth window',
        description:
          'Scores near the middle often respond well to targeted drills on your two weakest sections plus consistent CARS.',
      },
    ],
    weaknesses: [
      {
        title: 'Verify section balance',
        description:
          'Check whether one section is dragging the total; if PDF parsing missed sections, retake a mini diagnostic in-app for a cleaner split.',
      },
    ],
  }
}

/**
 * Heuristic “analytics” from raw PDF text — no network.
 * Replace with `POST /api/analyze` + LLM JSON when backend exists.
 */
export function analyzePracticeReportText(rawText: string): PracticeAnalyticsReport {
  const excerpt = rawText.replace(/\s+/g, ' ').trim().slice(0, 720)
  const totalScore = parseMcatTotalScoreFromText(rawText)
  const sections = parseSections(rawText)

  let strengths = mineTopics(rawText, 'strong')
  let weaknesses = mineTopics(rawText, 'weak')

  const rel = relativeSectionInsights(sections)
  strengths = dedupeInsights([...rel.strengths, ...strengths])
  weaknesses = dedupeInsights([...rel.weaknesses, ...weaknesses])

  const fb = fallbackFromTotal(totalScore)
  if (strengths.length === 0) strengths = fb.strengths
  if (weaknesses.length === 0) weaknesses = fb.weaknesses

  return {
    totalScore,
    sections,
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    excerpt,
    engine: 'heuristic_v1',
  }
}
