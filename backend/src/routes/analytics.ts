import { Router, Request, Response } from 'express'
import { requireAuth, getUserId } from '../middleware/auth'
import { query, queryOne } from '../lib/snowflake'

const router = Router()

// GET /api/analytics/scores — score trend over time
router.get('/scores', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = await query<Record<string, unknown>>(
      `SELECT
        TO_CHAR(test_date, 'YYYY-MM-DD') AS test_date,
        total_score,
        cars_score,
        bio_biochem_score,
        chem_phys_score,
        psych_soc_score,
        percentile,
        source
      FROM DIAGNOSTIC_SCORES
      WHERE user_id = ?
        AND total_score IS NOT NULL
      ORDER BY test_date ASC`,
      [userId]
    )

    const trend = rows.map((r) => ({
      testDate: r['TEST_DATE'],
      totalScore: r['TOTAL_SCORE'],
      carsScore: r['CARS_SCORE'],
      bioBiochemScore: r['BIO_BIOCHEM_SCORE'],
      chemPhysScore: r['CHEM_PHYS_SCORE'],
      psychSocScore: r['PSYCH_SOC_SCORE'],
      percentile: r['PERCENTILE'],
      source: r['SOURCE'],
    }))

    // Compute improvement
    const improvement =
      trend.length >= 2
        ? (trend[trend.length - 1].totalScore as number) - (trend[0].totalScore as number)
        : null

    return res.json({ trend, improvement, dataPoints: trend.length })
  } catch (err) {
    console.error('GET /analytics/scores error:', err)
    return res.status(500).json({ error: 'Failed to fetch score trends' })
  }
})

// GET /api/analytics/summary — overall study summary
router.get('/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const [studySummary, scoreSummary, recentActivity] = await Promise.all([
      // Study hours summary
      queryOne<Record<string, unknown>>(
        `SELECT
          COUNT(*)                   AS total_sessions,
          SUM(hours_studied)         AS total_hours,
          AVG(hours_studied)         AS avg_hours_per_session,
          SUM(anki_cards_reviewed)   AS total_anki_cards,
          MAX(TO_CHAR(log_date, 'YYYY-MM-DD')) AS last_study_date,
          MIN(TO_CHAR(log_date, 'YYYY-MM-DD')) AS first_study_date
        FROM PROGRESS_LOGS
        WHERE user_id = ?`,
        [userId]
      ),

      // Score summary
      queryOne<Record<string, unknown>>(
        `SELECT
          MIN(total_score)  AS lowest_score,
          MAX(total_score)  AS highest_score,
          AVG(total_score)  AS avg_score,
          COUNT(*)          AS total_tests
        FROM DIAGNOSTIC_SCORES
        WHERE user_id = ? AND total_score IS NOT NULL`,
        [userId]
      ),

      // Hours studied per week (last 8 weeks)
      query<Record<string, unknown>>(
        `SELECT
          DATE_TRUNC('week', log_date)       AS week_start,
          SUM(hours_studied)                  AS hours,
          COUNT(*)                            AS sessions,
          SUM(anki_cards_reviewed)            AS anki_cards
        FROM PROGRESS_LOGS
        WHERE user_id = ?
          AND log_date >= DATEADD('week', -8, CURRENT_DATE())
        GROUP BY DATE_TRUNC('week', log_date)
        ORDER BY week_start ASC`,
        [userId]
      ),
    ])

    // Mood distribution
    const moodRows = await query<Record<string, unknown>>(
      `SELECT mood, COUNT(*) AS count
       FROM PROGRESS_LOGS
       WHERE user_id = ?
       GROUP BY mood`,
      [userId]
    )

    const moodDistribution = Object.fromEntries(
      moodRows.map((r) => [r['MOOD'] as string, r['COUNT'] as number])
    )

    return res.json({
      study: {
        totalSessions: studySummary?.['TOTAL_SESSIONS'] ?? 0,
        totalHours: studySummary?.['TOTAL_HOURS'] ?? 0,
        avgHoursPerSession: studySummary?.['AVG_HOURS_PER_SESSION'] ?? 0,
        totalAnkiCards: studySummary?.['TOTAL_ANKI_CARDS'] ?? 0,
        lastStudyDate: studySummary?.['LAST_STUDY_DATE'] ?? null,
        firstStudyDate: studySummary?.['FIRST_STUDY_DATE'] ?? null,
      },
      scores: {
        lowestScore: scoreSummary?.['LOWEST_SCORE'] ?? null,
        highestScore: scoreSummary?.['HIGHEST_SCORE'] ?? null,
        avgScore: scoreSummary?.['AVG_SCORE'] ?? null,
        totalTests: scoreSummary?.['TOTAL_TESTS'] ?? 0,
      },
      weeklyActivity: recentActivity.map((r) => ({
        weekStart: r['WEEK_START'],
        hours: r['HOURS'],
        sessions: r['SESSIONS'],
        ankiCards: r['ANKI_CARDS'],
      })),
      moodDistribution,
    })
  } catch (err) {
    console.error('GET /analytics/summary error:', err)
    return res.status(500).json({ error: 'Failed to fetch analytics summary' })
  }
})

// GET /api/analytics/section-breakdown — per-section score analysis
router.get('/section-breakdown', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = await query<Record<string, unknown>>(
      `SELECT
        AVG(cars_score)        AS avg_cars,
        AVG(bio_biochem_score) AS avg_bio_biochem,
        AVG(chem_phys_score)   AS avg_chem_phys,
        AVG(psych_soc_score)   AS avg_psych_soc,
        MAX(cars_score)        AS best_cars,
        MAX(bio_biochem_score) AS best_bio_biochem,
        MAX(chem_phys_score)   AS best_chem_phys,
        MAX(psych_soc_score)   AS best_psych_soc
      FROM DIAGNOSTIC_SCORES
      WHERE user_id = ?`,
      [userId]
    )

    const r = rows[0] ?? {}
    return res.json({
      averages: {
        cars: r['AVG_CARS'],
        bioBiochem: r['AVG_BIO_BIOCHEM'],
        chemPhys: r['AVG_CHEM_PHYS'],
        psychSoc: r['AVG_PSYCH_SOC'],
      },
      bests: {
        cars: r['BEST_CARS'],
        bioBiochem: r['BEST_BIO_BIOCHEM'],
        chemPhys: r['BEST_CHEM_PHYS'],
        psychSoc: r['BEST_PSYCH_SOC'],
      },
    })
  } catch (err) {
    console.error('GET /analytics/section-breakdown error:', err)
    return res.status(500).json({ error: 'Failed to fetch section breakdown' })
  }
})

export default router
