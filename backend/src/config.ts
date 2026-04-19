import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

/**
 * In development, missing vars use safe placeholders so `npm run dev` works without copying `.env`.
 * JWT is bypassed when there is no `Authorization` header (see `middleware/auth.ts`).
 * Snowflake / Gemini calls still need real keys in `.env` to succeed at runtime.
 */
function env(key: string, devFallback?: string): string {
  const value = process.env[key]
  if (value) return value
  if (!isProd && devFallback !== undefined) return devFallback
  throw new Error(`Missing required environment variable: ${key}`)
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: JSON.parse(
    process.env.CORS_ORIGINS ??
      '["http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:5176","http://localhost:5177","http://localhost:5178","http://localhost:5179"]',
  ) as string[],

  // In development, API calls without a JWT use this fixed user ID
  devUserId: process.env.DEV_USER_ID ?? 'dev-user-001',

  /** When true (default in dev), requests with no Authorization header authenticate as DEV_USER_ID. Set false to require login for /api calls. */
  devAuthBypass: (process.env.DEV_AUTH_BYPASS ?? 'true').toLowerCase() === 'true',

  /** HS256 secret for email/password JWTs (required in production). */
  jwtSecret: env('JWT_SECRET', 'dev-only-change-me-use-openssl-rand-hex-32'),

  /** Session length when “remember me” is off (browser keeps token until then). */
  jwtExpiresShort: process.env.JWT_EXPIRES_IN_SHORT ?? '30d',
  /** Session length when “remember me” is on (default). */
  jwtExpiresLong: process.env.JWT_EXPIRES_IN_LONG ?? '365d',

  auth0: {
    domain: env('AUTH0_DOMAIN', 'dev-placeholder.invalid'),
    audience: env('AUTH0_AUDIENCE', 'https://proedge-api'),
  },

  snowflake: {
    account: env('SNOWFLAKE_ACCOUNT', ''),
    username: env('SNOWFLAKE_USERNAME', ''),
    password: env('SNOWFLAKE_PASSWORD', ''),
    database: env('SNOWFLAKE_DATABASE', 'PROEDGE_DB'),
    schema: env('SNOWFLAKE_SCHEMA', 'PUBLIC'),
    warehouse: env('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH'),
    role: env('SNOWFLAKE_ROLE', 'SYSADMIN'),
  },

  gemini: {
    apiKey: env('GEMINI_API_KEY', 'dev-placeholder-no-gemini'),
  },
}
