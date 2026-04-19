import { auth } from 'express-oauth2-jwt-bearer'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

const jwtAuth = auth({
  audience: config.auth0.audience,
  issuerBaseURL: `https://${config.auth0.domain}`,
  tokenSigningAlg: 'RS256',
})

/**
 * Requires a valid Bearer token (ProEdge HS256 JWT or Auth0 RS256 JWT), unless
 * development dev-auth bypass is enabled with no Authorization header (see DEV_AUTH_BYPASS).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    if (config.devAuthBypass && config.nodeEnv === 'development') {
      ;(req as any).auth = {
        header: {},
        payload: { sub: config.devUserId },
        token: 'dev',
      }
      return next()
    }
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = authHeader.slice(7)
  const meta = jwt.decode(token, { complete: true })
  const alg = meta?.header?.alg

  if (alg === 'HS256') {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload & {
        sub?: string
      }
      const sub = payload.sub
      if (!sub || typeof sub !== 'string') {
        res.status(401).json({ error: 'Invalid token' })
        return
      }
      ;(req as any).auth = {
        header: {},
        payload: { sub },
        token,
      }
      return next()
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }
  }

  jwtAuth(req, res, next)
}

export function getUserId(req: Request): string {
  const sub = (req as any).auth?.payload?.sub
  if (!sub) throw new Error('No user ID in token')
  return sub as string
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => next())
}
