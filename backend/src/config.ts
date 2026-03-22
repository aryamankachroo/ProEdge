import dotenv from 'dotenv'
dotenv.config()

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: JSON.parse(process.env.CORS_ORIGINS ?? '["http://localhost:5173"]') as string[],

  // In development, API calls without a JWT use this fixed user ID
  devUserId: process.env.DEV_USER_ID ?? 'dev-user-001',

  auth0: {
    domain: required('AUTH0_DOMAIN'),
    audience: required('AUTH0_AUDIENCE'),
  },

  snowflake: {
    account: required('SNOWFLAKE_ACCOUNT'),
    username: required('SNOWFLAKE_USERNAME'),
    password: required('SNOWFLAKE_PASSWORD'),
    database: required('SNOWFLAKE_DATABASE'),
    schema: required('SNOWFLAKE_SCHEMA'),
    warehouse: required('SNOWFLAKE_WAREHOUSE'),
    role: required('SNOWFLAKE_ROLE'),
  },

  gemini: {
    apiKey: required('GEMINI_API_KEY'),
  },
}
