import { Router, Request, Response } from 'express'
import multer from 'multer'
import { requireAuth, getUserId } from '../middleware/auth'
import { query, queryOne, execute } from '../lib/snowflake'
import { parseDiagnosticPdf } from '../lib/pdf'
import { DiagnosticScores } from '../types'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  },
})

// POST /api/diagnostics/parse-pdf
router.post(
  '/parse-pdf',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' })
      }

      const userId = getUserId(req)
      const scores = await parseDiagnosticPdf(req.file.buffer)

      await saveScores(userId, scores)

      return res.status(201).json({ scores })
    } catch (err) {
      console.error('POST /diagnostics/parse-pdf error:', err)
      return res.status(500).json({ error: 'Failed to parse PDF' })
    }
  }
)

// POST /api/diagnostics/scores — manual entry
router.post('/scores', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const body = req.body as Partial<DiagnosticScores>

    const scores: DiagnosticScores = {
      totalScore: body.totalScore ?? null,
      carsScore: body.carsScore ?? null,
      bioBiochemScore: body.bioBiochemScore ?? null,
      chemPhysScore: body.chemPhysScore ?? null,
      psychSocScore: body.psychSocScore ?? null,
      percentile: body.percentile ?? null,
      testDate: body.testDate ?? new Date().toISOString().split('T')[0],
      source: 'manual',
    }

    await saveScores(userId, scores)

    return res.status(201).json({ scores })
  } catch (err) {
    console.error('POST /diagnostics/scores error:', err)
    return res.status(500).json({ error: 'Failed to save scores' })
  }
})

// GET /api/diagnostics/scores
router.get('/scores', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

    const rows = await query<Record<string, unknown>>(
      `SELECT
        score_id,
        total_score,
        cars_score,
        bio_biochem_score,
        chem_phys_score,
        psych_soc_score,
        percentile,
        TO_CHAR(test_date, 'YYYY-MM-DD') AS test_date,
        source,
        created_at
      FROM DIAGNOSTIC_SCORES
      WHERE user_id = ?
      ORDER BY test_date DESC, created_at DESC
      LIMIT ?`,
      [userId, limit]
    )

    return res.json({
      scores: rows.map((r) => ({
        scoreId: r['SCORE_ID'],
        totalScore: r['TOTAL_SCORE'],
        carsScore: r['CARS_SCORE'],
        bioBiochemScore: r['BIO_BIOCHEM_SCORE'],
        chemPhysScore: r['CHEM_PHYS_SCORE'],
        psychSocScore: r['PSYCH_SOC_SCORE'],
        percentile: r['PERCENTILE'],
        testDate: r['TEST_DATE'],
        source: r['SOURCE'],
        createdAt: r['CREATED_AT'],
      })),
    })
  } catch (err) {
    console.error('GET /diagnostics/scores error:', err)
    return res.status(500).json({ error: 'Failed to fetch scores' })
  }
})

async function saveScores(userId: string, scores: DiagnosticScores): Promise<void> {
  await execute(
    `INSERT INTO DIAGNOSTIC_SCORES
      (user_id, total_score, cars_score, bio_biochem_score,
       chem_phys_score, psych_soc_score, percentile,
       test_date, source, raw_pdf_text)
    VALUES
      (?, ?, ?, ?, ?, ?, ?,
       TO_DATE(?, 'YYYY-MM-DD'), ?, ?)`,
    [
      userId,
      scores.totalScore,
      scores.carsScore,
      scores.bioBiochemScore,
      scores.chemPhysScore,
      scores.psychSocScore,
      scores.percentile,
      scores.testDate,
      scores.source,
      scores.rawPdfText ?? null,
    ]
  )
}

export default router
