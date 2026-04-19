import { Router, Request, Response } from 'express'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { config } from '../config'
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
} from '../lib/auth-store'
import { requireAuth, getUserId } from '../middleware/auth'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseRemember(body: Record<string, unknown>): boolean {
  const r = body.remember
  if (r === false || r === 'false') return false
  return true
}

function issueToken(userId: string, email: string, remember: boolean): string {
  const expiresIn = (
    remember ? config.jwtExpiresLong : config.jwtExpiresShort
  ) as SignOptions['expiresIn']
  return jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn })
}

/** POST /api/auth/register */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const user = await createUser(email, password)
    const remember = parseRemember(req.body as Record<string, unknown>)
    const token = issueToken(user.userId, user.email, remember)
    return res.status(201).json({
      token,
      user: { id: user.userId, email: user.email },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_IN_USE') {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }
    console.error('POST /auth/register error:', err)
    return res.status(500).json({ error: 'Could not create account.' })
  }
})

/** POST /api/auth/login */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = findUserByEmail(email)
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const remember = parseRemember(req.body as Record<string, unknown>)
    const token = issueToken(user.userId, user.email, remember)
    return res.json({
      token,
      user: { id: user.userId, email: user.email },
    })
  } catch (err) {
    console.error('POST /auth/login error:', err)
    return res.status(500).json({ error: 'Could not sign in.' })
  }
})

/** GET /api/auth/me */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    if (
      config.devAuthBypass &&
      config.nodeEnv === 'development' &&
      (req as { auth?: { token?: string } }).auth?.token === 'dev'
    ) {
      return res.json({
        user: { id: config.devUserId, email: 'dev@localhost' },
      })
    }
    const record = findUserById(userId)
    if (!record) {
      return res.status(404).json({ error: 'User not found.' })
    }
    return res.json({
      user: { id: record.userId, email: record.email },
    })
  } catch (err) {
    console.error('GET /auth/me error:', err)
    return res.status(500).json({ error: 'Could not load user.' })
  }
})

export default router
