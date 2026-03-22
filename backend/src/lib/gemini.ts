import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config'
import { UserProfile, StudyPlan } from '../types'

const genAI = new GoogleGenerativeAI(config.gemini.apiKey)

function buildStudyPlanPrompt(profile: UserProfile): string {
  const today = new Date()
  const examDate = new Date(profile.examDate)
  const weeksUntilExam = Math.max(
    1,
    Math.round((examDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000))
  )
  const scoreGap = profile.targetScore - profile.baselineScore
  const studyDayNames = profile.studyDays
    .map((d) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d])
    .join(', ')

  return `You are an expert MCAT tutor with 10+ years of experience. Generate a detailed, personalized MCAT study plan.

STUDENT PROFILE:
- Name: ${profile.name}
- Study Status: ${profile.studyStatus.replace(/_/g, ' ')}
- Hours Available Per Day: ${profile.hoursPerDay}
- Study Load Type: ${profile.studyLoad.replace(/_/g, ' ')}
- Target MCAT Score: ${profile.targetScore}/528
- Current Baseline Score: ${profile.baselineScore}/528
- Score Gap to Close: ${scoreGap} points
- MCAT Exam Date: ${profile.examDate}
- Weeks Until Exam: ${weeksUntilExam}
- Available Study Days: ${studyDayNames}
- Study Resources: ${profile.resources.join(', ')}
- Anki Decks: ${profile.ankiDecks.length > 0 ? profile.ankiDecks.join(', ') : 'None'}
- Weak Sections: ${profile.weakSections.join(', ')}

MCAT SECTIONS (for reference):
1. Chemical and Physical Foundations (Chem/Phys) — 118-132 points
2. Critical Analysis and Reasoning Skills (CARS) — 118-132 points
3. Biological and Biochemical Foundations (Bio/Biochem) — 118-132 points
4. Psychological, Social, and Biological Foundations (Psych/Soc) — 118-132 points

Generate a comprehensive ${weeksUntilExam}-week study plan. Respond ONLY with valid JSON matching this exact structure:
{
  "totalWeeks": ${weeksUntilExam},
  "phaseBreakdown": [
    { "phase": "Content Review", "weeks": "1-X", "goal": "..." },
    { "phase": "Practice & Application", "weeks": "X-Y", "goal": "..." },
    { "phase": "Full-Length Testing", "weeks": "Y-Z", "goal": "..." }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Content Review",
      "theme": "Biology Cell Structure & Biochemistry",
      "focusSections": ["Bio/Biochem"],
      "dailySchedule": {
        "monday": [
          { "resource": "Kaplan", "section": "Bio/Biochem", "durationMins": 90, "topic": "Cell Biology: Eukaryotic Cell Structure" },
          { "resource": "Anki", "section": "Bio/Biochem", "durationMins": 30, "topic": "Cell biology flashcards" }
        ]
      },
      "weeklyGoals": ["Complete Kaplan Bio chapter 1-3", "Review 200 Anki cards"],
      "ankiTarget": 200
    }
  ],
  "milestones": [
    { "week": 4, "milestone": "Complete Bio/Biochem content review" }
  ],
  "studyTips": [
    "Focus extra 20% of time on your weak section: ${profile.weakSections[0] ?? 'CARS'}"
  ],
  "scoreProgressionTargets": [
    { "week": 4, "targetScore": ${profile.baselineScore + Math.round(scoreGap * 0.25)} },
    { "week": 8, "targetScore": ${profile.baselineScore + Math.round(scoreGap * 0.5)} }
  ]
}

Rules:
- Only include study days: ${studyDayNames}
- Allocate max ${profile.hoursPerDay} hours/day
- Prioritize weak sections: ${profile.weakSections.join(', ')}
- Use only the student's available resources: ${profile.resources.join(', ')}
- CARS cannot be crammed — spread it throughout all weeks
- Include full-length practice tests every 2-3 weeks in the schedule
- Respond with ONLY the JSON object, no markdown, no explanation`
}

export async function generateStudyPlan(profile: UserProfile): Promise<StudyPlan> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  })

  const prompt = buildStudyPlanPrompt(profile)
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned) as StudyPlan
}

export async function generateStudyTip(
  weakSection: string,
  recentProgress: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are an MCAT tutor. Give one concise, actionable study tip (2-3 sentences) for a student struggling with ${weakSection}. Their recent progress: ${recentProgress}. Be specific and practical.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
