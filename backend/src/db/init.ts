import { readFileSync } from 'fs'
import { join } from 'path'
import { query, execute } from '../lib/snowflake'
import { config } from '../config'

async function initDb(): Promise<void> {
  console.log('Initializing Snowflake database...')

  // Ensure database and schema exist
  await execute(`CREATE DATABASE IF NOT EXISTS ${config.snowflake.database}`)
  await execute(`USE DATABASE ${config.snowflake.database}`)
  await execute(`USE SCHEMA ${config.snowflake.schema}`)

  // Create tables
  await execute(`
    CREATE TABLE IF NOT EXISTS USERS (
      user_id    VARCHAR(255) PRIMARY KEY,
      email      VARCHAR(255),
      created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
      updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `)
  console.log('✓ USERS table ready')

  await execute(`
    CREATE TABLE IF NOT EXISTS PROFILES (
      profile_id     VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
      user_id        VARCHAR(255) NOT NULL,
      name           VARCHAR(255),
      study_status   VARCHAR(50),
      hours_per_day  NUMBER(4,1),
      study_load     VARCHAR(50),
      target_score   NUMBER(3),
      baseline_score NUMBER(3),
      exam_date      DATE,
      resources      VARIANT,
      anki_decks     VARIANT,
      weak_sections  VARIANT,
      study_days     VARIANT,
      created_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
      updated_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `)
  console.log('✓ PROFILES table ready')

  await execute(`
    CREATE TABLE IF NOT EXISTS STUDY_PLANS (
      plan_id      VARCHAR(36)   DEFAULT UUID_STRING() PRIMARY KEY,
      user_id      VARCHAR(255)  NOT NULL,
      plan_data    VARIANT       NOT NULL,
      is_active    BOOLEAN       DEFAULT TRUE,
      generated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `)
  console.log('✓ STUDY_PLANS table ready')

  await execute(`
    CREATE TABLE IF NOT EXISTS DIAGNOSTIC_SCORES (
      score_id          VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
      user_id           VARCHAR(255) NOT NULL,
      total_score       NUMBER(3),
      cars_score        NUMBER(3),
      bio_biochem_score NUMBER(3),
      chem_phys_score   NUMBER(3),
      psych_soc_score   NUMBER(3),
      percentile        NUMBER(5,2),
      test_date         DATE,
      source            VARCHAR(20)  DEFAULT 'manual',
      raw_pdf_text      TEXT,
      created_at        TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `)
  console.log('✓ DIAGNOSTIC_SCORES table ready')

  await execute(`
    CREATE TABLE IF NOT EXISTS PROGRESS_LOGS (
      log_id               VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
      user_id              VARCHAR(255) NOT NULL,
      log_date             DATE         DEFAULT CURRENT_DATE(),
      hours_studied        NUMBER(4,1),
      topics_covered       VARIANT,
      anki_cards_reviewed  NUMBER(6)    DEFAULT 0,
      notes                TEXT,
      mood                 VARCHAR(10),
      created_at           TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `)
  console.log('✓ PROGRESS_LOGS table ready')

  // Verify tables exist
  const tables = await query<{ name: string }>(
    `SHOW TABLES IN DATABASE ${config.snowflake.database}`
  )
  console.log(`\n✅ Database initialized — ${tables.length} tables found`)
  process.exit(0)
}

initDb().catch((err) => {
  console.error('❌ DB init failed:', err)
  process.exit(1)
})
