import './config' // validates env vars on startup
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config'

import profileRouter from './routes/profile'
import planRouter from './routes/plan'
import diagnosticsRouter from './routes/diagnostics'
import progressRouter from './routes/progress'
import analyticsRouter from './routes/analytics'

const app = express()

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Health Check (no auth required) ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ProEdge API',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  })
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/profile', profileRouter)
app.use('/api/plan', planRouter)
app.use('/api/diagnostics', diagnosticsRouter)
app.use('/api/progress', progressRouter)
app.use('/api/analytics', analyticsRouter)

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: err.message ?? 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`\n🚀 ProEdge API running on http://localhost:${config.port}`)
    console.log(`   Health: http://localhost:${config.port}/api/health\n`)
  })
}

export default app
