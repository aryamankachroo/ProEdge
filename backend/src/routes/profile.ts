import { Router, Request, Response } from 'express'
import { requireAuth, getUserId } from '../middleware/auth'
import { query, queryOne, execute } from '../lib/snowflake'
import { UserProfile } from '../types'

const router = Router()

// GET /api/profile
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const profile = await queryOne<Record<string, unknown>>(
      `SELECT
        p.profile_id,
        p.user_id,
        p.name,
        p.study_status,
        p.hours_per_day,
        p.study_load,
        p.target_score,
        p.baseline_score,
        TO_CHAR(p.exam_date, 'YYYY-MM-DD') AS exam_date,
        p.resources,
        p.anki_decks,
        p.weak_sections,
        p.study_days,
        p.updated_at
      FROM PROFILES p
      WHERE p.user_id = ?
      ORDER BY p.updated_at DESC
      LIMIT 1`,
      [userId]
    )

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    return res.json({ profile: normalizeProfile(profile) })
  } catch (err) {
    console.error('GET /profile error:', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// POST /api/profile  — upsert
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const body = req.body as Partial<UserProfile>

    // Ensure user row exists
    await execute(
      `MERGE INTO USERS AS target
       USING (SELECT ? AS user_id, ? AS email) AS source
       ON target.user_id = source.user_id
       WHEN NOT MATCHED THEN INSERT (user_id, email) VALUES (source.user_id, source.email)
       WHEN MATCHED THEN UPDATE SET updated_at = CURRENT_TIMESTAMP()`,
      [userId, body.email ?? null]
    )

    // Check for existing profile
    const existing = await queryOne<{ PROFILE_ID: string }>(
      `SELECT profile_id FROM PROFILES WHERE user_id = ? LIMIT 1`,
      [userId]
    )

    if (existing) {
      await execute(
        `UPDATE PROFILES SET
          name           = ?,
          study_status   = ?,
          hours_per_day  = ?,
          study_load     = ?,
          target_score   = ?,
          baseline_score = ?,
          exam_date      = TO_DATE(?, 'YYYY-MM-DD'),
          resources      = PARSE_JSON(?),
          anki_decks     = PARSE_JSON(?),
          weak_sections  = PARSE_JSON(?),
          study_days     = PARSE_JSON(?),
          updated_at     = CURRENT_TIMESTAMP()
        WHERE user_id = ?`,
        [
          body.name ?? null,
          body.studyStatus ?? null,
          body.hoursPerDay ?? null,
          body.studyLoad ?? null,
          body.targetScore ?? null,
          body.baselineScore ?? null,
          body.examDate ?? null,
          JSON.stringify(body.resources ?? []),
          JSON.stringify(body.ankiDecks ?? []),
          JSON.stringify(body.weakSections ?? []),
          JSON.stringify(body.studyDays ?? []),
          userId,
        ]
      )
    } else {
      await execute(
        `INSERT INTO PROFILES
          (user_id, name, study_status, hours_per_day, study_load,
           target_score, baseline_score, exam_date,
           resources, anki_decks, weak_sections, study_days)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, TO_DATE(?, 'YYYY-MM-DD'),
           PARSE_JSON(?), PARSE_JSON(?), PARSE_JSON(?), PARSE_JSON(?))`,
        [
          userId,
          body.name ?? null,
          body.studyStatus ?? null,
          body.hoursPerDay ?? null,
          body.studyLoad ?? null,
          body.targetScore ?? null,
          body.baselineScore ?? null,
          body.examDate ?? null,
          JSON.stringify(body.resources ?? []),
          JSON.stringify(body.ankiDecks ?? []),
          JSON.stringify(body.weakSections ?? []),
          JSON.stringify(body.studyDays ?? []),
        ]
      )
    }

    return res.status(200).json({ message: 'Profile saved' })
  } catch (err) {
    console.error('POST /profile error:', err)
    return res.status(500).json({ error: 'Failed to save profile' })
  }
})

function normalizeProfile(row: Record<string, unknown>): Record<string, unknown> {
  return {
    profileId: row['PROFILE_ID'],
    userId: row['USER_ID'],
    name: row['NAME'],
    studyStatus: row['STUDY_STATUS'],
    hoursPerDay: row['HOURS_PER_DAY'],
    studyLoad: row['STUDY_LOAD'],
    targetScore: row['TARGET_SCORE'],
    baselineScore: row['BASELINE_SCORE'],
    examDate: row['EXAM_DATE'],
    resources: row['RESOURCES'] ?? [],
    ankiDecks: row['ANKI_DECKS'] ?? [],
    weakSections: row['WEAK_SECTIONS'] ?? [],
    studyDays: row['STUDY_DAYS'] ?? [],
    updatedAt: row['UPDATED_AT'],
  }
}

export default router
