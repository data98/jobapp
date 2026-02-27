-- ────────────────────────────────────────────────────────────
-- ATS Scoring V1 — New tables for multi-stage pipeline
-- ────────────────────────────────────────────────────────────

-- Table 1: jd_profiles
-- One profile per job_application, stores Stage 1 output (JD Analysis)
CREATE TABLE IF NOT EXISTS jd_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES job_application(id) ON DELETE CASCADE,
  required_skills JSONB NOT NULL DEFAULT '[]',
  preferred_skills JSONB NOT NULL DEFAULT '[]',
  min_years_experience INTEGER,
  max_years_experience INTEGER,
  seniority_level TEXT NOT NULL DEFAULT 'mid',
  education_requirements JSONB NOT NULL DEFAULT '[]',
  required_certifications JSONB NOT NULL DEFAULT '[]',
  preferred_certifications JSONB NOT NULL DEFAULT '[]',
  job_title_normalized TEXT NOT NULL DEFAULT '',
  department_function TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  key_responsibilities JSONB NOT NULL DEFAULT '[]',
  soft_skills JSONB NOT NULL DEFAULT '[]',
  raw_jd_text TEXT NOT NULL DEFAULT '',
  ai_model_used TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  user_edited BOOLEAN NOT NULL DEFAULT FALSE,
  user_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_application_id)
);

-- Table 2: ats_analysis
-- V1 analysis results (replaces ai_analysis for new analyses)
CREATE TABLE IF NOT EXISTS ats_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES job_application(id) ON DELETE CASCADE,
  jd_profile_id UUID NOT NULL REFERENCES jd_profiles(id),
  ats_score INTEGER NOT NULL,
  score_tier TEXT NOT NULL DEFAULT 'needs_work',
  scoring_version INTEGER NOT NULL DEFAULT 1,
  dimension_scores JSONB NOT NULL DEFAULT '[]',
  weakest_areas JSONB NOT NULL DEFAULT '[]',
  keyword_match JSONB NOT NULL DEFAULT '{}',
  experience_relevance JSONB NOT NULL DEFAULT '{}',
  hard_requirements JSONB NOT NULL DEFAULT '{}',
  resume_quality JSONB NOT NULL DEFAULT '{}',
  skills_depth JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  ai_models_used JSONB NOT NULL DEFAULT '{}',
  total_ai_tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_application_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jd_profiles_job_application_id ON jd_profiles(job_application_id);
CREATE INDEX IF NOT EXISTS idx_ats_analysis_job_application_id ON ats_analysis(job_application_id);
