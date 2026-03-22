import { Router, Request, Response } from 'express'
import { requireAuth, getUserId } from '../middleware/auth'
import { query, queryOne, execute } from '../lib/snowflake'
import { ProgressLog } from '../types'

const router = Router()

// POST /api/progress — log a study session
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const body = req.body as Partial<ProgressLog>

    if (!body.hoursStudied || body.hoursStudied <= 0) {
      return res.status(400).json({ error: 'hoursStudied must be a positive number' })
    }

    const logDate = body.logDate ?? new Date().toISOString().split('T')[0]

    await execute(
      `INSERT INTO PROGRESS_LOGS
        (user_id, log_date, hours_studied, topics_covered,
         anki_cards_reviewed, notes, mood)
      VALUES
        (?, TO_DATE(?, 'YYYY-MM-DD'), ?, PARSE_JSON(?), ?, ?, ?)`,
      [
        userId,
        logDate,
        body.hoursStudied,
        JSON.stringify(body.topicsCovered ?? []),
        body.ankiCardsReviewed ?? 0,
        body.notes ?? null,
        body.mood ?? 'good',
      ]
    )

    return res.status(201).json({ message: 'Progress logged' })
  } catch (err) {
    console.error('POST /progress error:', err)
    return res.status(500).json({ error: 'Failed to log progress' })
  }
})

// GET /api/progress
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 90)
    const offset = parseInt(req.query.offset as string) || 0

    const rows = await query<Record<string, unknown>>(
      `SELECT
        log_id,
        TO_CHAR(log_date, 'YYYY-MM-DD') AS log_date,
        hours_studied,
        topics_covered,
        anki_cards_reviewed,
        notes,
        mood,
        created_at
      FROM PROGRESS_LOGS
      WHERE user_id = ?
      ORDER BY log_date DESC
      LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    )

    const total = await queryOne<{ TOTAL: number }>(
      `SELECT COUNT(*) AS total FROM PROGRESS_LOGS WHERE user_id = ?`,
      [userId]
    )

    return res.json({
      logs: rows.map((r) => ({
        logId: r['LOG_ID'],
        logDate: r['LOG_DATE'],
        hoursStudied: r['HOURS_STUDIED'],
        topicsCovered: r['TOPICS_COVERED'] ?? [],
        ankiCardsReviewed: r['ANKI_CARDS_REVIEWED'],
        notes: r['NOTES'],
        mood: r['MOOD'],
        createdAt: r['CREATED_AT'],
      })),
      total: total?.TOTAL ?? 0,
      limit,
      offset,
    })
  } catch (err) {
    console.error('GET /progress error:', err)
    return res.status(500).json({ error: 'Failed to fetch progress' })
  }
})

// GET /api/progress/streak
router.get('/streak', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = await query<{ LOG_DATE: string }>(
      `SELECT DISTINCT TO_CHAR(log_date, 'YYYY-MM-DD') AS log_date
       FROM PROGRESS_LOGS
       WHERE user_id = ?
       ORDER BY log_date DESC
       LIMIT 365`,
      [userId]
    )

    const dates = rows.map((r) => r.LOG_DATE)
    const streak = calculateStreak(dates)

    return res.json({ streak, lastStudyDate: dates[0] ?? null })
  } catch (err) {
    console.error('GET /progress/streak error:', err)
    return res.status(500).json({ error: 'Failed to fetch streak' })
  }
})

function calculateStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0

  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0 || diff === 1) {
      streak++
      current = d
    } else {
      break
    }
  }

  return streak
}

export default router
