import { Router, Request, Response } from 'express'
import { requireAuth, getUserId } from '../middleware/auth'
import { query, queryOne, execute } from '../lib/snowflake'
import { generateStudyPlan } from '../lib/gemini'
import { UserProfile } from '../types'

const router = Router()

// POST /api/plan/generate
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    // Load profile from DB (or accept inline profile from body)
    let profile = req.body.profile as UserProfile | undefined

    if (!profile) {
      const row = await queryOne<Record<string, unknown>>(
        `SELECT
          user_id, name, study_status, hours_per_day, study_load,
          target_score, baseline_score,
          TO_CHAR(exam_date, 'YYYY-MM-DD') AS exam_date,
          resources, anki_decks, weak_sections, study_days
        FROM PROFILES
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 1`,
        [userId]
      )

      if (!row) {
        return res.status(400).json({ error: 'No profile found. Complete onboarding first.' })
      }

      profile = {
        userId,
        name: row['NAME'] as string,
        studyStatus: row['STUDY_STATUS'] as UserProfile['studyStatus'],
        hoursPerDay: row['HOURS_PER_DAY'] as number,
        studyLoad: row['STUDY_LOAD'] as UserProfile['studyLoad'],
        targetScore: row['TARGET_SCORE'] as number,
        baselineScore: row['BASELINE_SCORE'] as number,
        examDate: row['EXAM_DATE'] as string,
        resources: (row['RESOURCES'] as string[]) ?? [],
        ankiDecks: (row['ANKI_DECKS'] as string[]) ?? [],
        weakSections: (row['WEAK_SECTIONS'] as string[]) ?? [],
        studyDays: (row['STUDY_DAYS'] as number[]) ?? [],
      }
    }

    // Generate plan with Gemini
    const studyPlan = await generateStudyPlan(profile)

    // Deactivate previous plans
    await execute(
      `UPDATE STUDY_PLANS SET is_active = FALSE WHERE user_id = ?`,
      [userId]
    )

    // Save new plan
    await execute(
      `INSERT INTO STUDY_PLANS (user_id, plan_data, is_active)
       VALUES (?, PARSE_JSON(?), TRUE)`,
      [userId, JSON.stringify(studyPlan)]
    )

    return res.status(201).json({ plan: studyPlan })
  } catch (err) {
    console.error('POST /plan/generate error:', err)
    return res.status(500).json({ error: 'Failed to generate study plan' })
  }
})

// GET /api/plan — fetch active plan
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const row = await queryOne<Record<string, unknown>>(
      `SELECT plan_id, plan_data, generated_at
       FROM STUDY_PLANS
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY generated_at DESC
       LIMIT 1`,
      [userId]
    )

    if (!row) {
      return res.status(404).json({ error: 'No active study plan found' })
    }

    return res.json({
      planId: row['PLAN_ID'],
      generatedAt: row['GENERATED_AT'],
      plan: row['PLAN_DATA'],
    })
  } catch (err) {
    console.error('GET /plan error:', err)
    return res.status(500).json({ error: 'Failed to fetch study plan' })
  }
})

// GET /api/plan/history
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = await query<Record<string, unknown>>(
      `SELECT plan_id, is_active, generated_at
       FROM STUDY_PLANS
       WHERE user_id = ?
       ORDER BY generated_at DESC
       LIMIT 10`,
      [userId]
    )

    return res.json({
      plans: rows.map((r) => ({
        planId: r['PLAN_ID'],
        isActive: r['IS_ACTIVE'],
        generatedAt: r['GENERATED_AT'],
      })),
    })
  } catch (err) {
    console.error('GET /plan/history error:', err)
    return res.status(500).json({ error: 'Failed to fetch plan history' })
  }
})

export default router
