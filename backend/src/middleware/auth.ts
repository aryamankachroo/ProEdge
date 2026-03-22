import { auth } from 'express-oauth2-jwt-bearer'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

const jwtAuth = auth({
  audience: config.auth0.audience,
  issuerBaseURL: `https://${config.auth0.domain}`,
  tokenSigningAlg: 'RS256',
})

/**
 * In development mode, requests without an Authorization header bypass JWT
 * validation and use DEV_USER_ID as the authenticated user.
 * In production, a valid Auth0 JWT is always required.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (config.nodeEnv === 'development' && !req.headers.authorization) {
    // Inject a synthetic auth payload so getUserId() works downstream
    ;(req as any).auth = {
      header: {},
      payload: { sub: config.devUserId },
      token: 'dev',
    }
    return next()
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
