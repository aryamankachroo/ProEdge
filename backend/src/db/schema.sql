-- ProEdge Snowflake Schema
-- Run via: npm run init-db

CREATE DATABASE IF NOT EXISTS PROEDGE_DB;
USE DATABASE PROEDGE_DB;
USE SCHEMA PUBLIC;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS USERS (
  user_id    VARCHAR(255) PRIMARY KEY,       -- Auth0 sub (e.g. auth0|abc123)
  email      VARCHAR(255),
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PROFILES (
  profile_id     VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
  user_id        VARCHAR(255) NOT NULL REFERENCES USERS(user_id),
  name           VARCHAR(255),
  study_status   VARCHAR(50),
  hours_per_day  NUMBER(4,1),
  study_load     VARCHAR(50),
  target_score   NUMBER(3),
  baseline_score NUMBER(3),
  exam_date      DATE,
  resources      VARIANT,       -- JSON array of strings
  anki_decks     VARIANT,       -- JSON array of strings
  weak_sections  VARIANT,       -- JSON array of strings
  study_days     VARIANT,       -- JSON array of weekday numbers
  created_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ─── Study Plans ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS STUDY_PLANS (
  plan_id      VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
  user_id      VARCHAR(255) NOT NULL REFERENCES USERS(user_id),
  plan_data    VARIANT      NOT NULL,    -- Full JSON plan from Gemini
  is_active    BOOLEAN      DEFAULT TRUE,
  generated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ─── Diagnostic Scores ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DIAGNOSTIC_SCORES (
  score_id         VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
  user_id          VARCHAR(255) NOT NULL REFERENCES USERS(user_id),
  total_score      NUMBER(3),
  cars_score       NUMBER(3),
  bio_biochem_score NUMBER(3),
  chem_phys_score  NUMBER(3),
  psych_soc_score  NUMBER(3),
  percentile       NUMBER(5,2),
  test_date        DATE,
  source           VARCHAR(20)  DEFAULT 'manual',  -- manual | pdf_import | diagnostic_test
  raw_pdf_text     TEXT,
  created_at       TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ─── Progress Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PROGRESS_LOGS (
  log_id             VARCHAR(36)  DEFAULT UUID_STRING() PRIMARY KEY,
  user_id            VARCHAR(255) NOT NULL REFERENCES USERS(user_id),
  log_date           DATE         DEFAULT CURRENT_DATE(),
  hours_studied      NUMBER(4,1),
  topics_covered     VARIANT,     -- JSON array of strings
  anki_cards_reviewed NUMBER(6)  DEFAULT 0,
  notes              TEXT,
  mood               VARCHAR(10), -- great | good | okay | rough
  created_at         TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
