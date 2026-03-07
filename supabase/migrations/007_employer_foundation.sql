-- ═══════════════════════════════════════════════════════════════════════
-- Migration 007: Employer Platform Foundation
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Add role to Better Auth's user table ──────────────────────────

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'seeker'
    CHECK (role IN ('seeker', 'employer'));

CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);

-- ─── 2. Organizations ─────────────────────────────────────────────────

CREATE TABLE organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  website text,
  logo_url text,
  description text,
  industry text,
  company_size text CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_organization_slug ON organization(slug);

-- ─── 3. Organization Members ──────────────────────────────────────────

CREATE TABLE organization_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin'
    CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer')),
  invited_by text REFERENCES "user"(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_member_user ON organization_member(user_id);
CREATE INDEX idx_org_member_org ON organization_member(organization_id);

-- ─── 4. Job Postings ─────────────────────────────────────────────────

CREATE TABLE job_posting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_by text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Content
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,

  -- Structured JD data
  required_skills jsonb DEFAULT '[]',
  preferred_skills jsonb DEFAULT '[]',
  min_years_experience integer,
  max_years_experience integer,
  seniority_level text,
  education_requirements jsonb DEFAULT '[]',
  key_responsibilities jsonb DEFAULT '[]',
  soft_skills jsonb DEFAULT '[]',

  -- Meta
  location text,
  location_type text CHECK (location_type IN ('remote', 'hybrid', 'onsite')),
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  show_salary boolean DEFAULT false,
  employment_type text CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  department text,

  -- Publication
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused', 'closed', 'archived')),
  published_at timestamptz,
  closes_at timestamptz,
  allow_external_apply boolean DEFAULT true,

  -- AI
  jd_optimized boolean DEFAULT false,
  ai_optimization_suggestions jsonb,

  -- Stats (denormalized for fast reads)
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_job_posting_org ON job_posting(organization_id);
CREATE INDEX idx_job_posting_created_by ON job_posting(created_by);
CREATE INDEX idx_job_posting_slug ON job_posting(slug);
CREATE INDEX idx_job_posting_status ON job_posting(status);
CREATE INDEX idx_job_posting_status_published ON job_posting(status, published_at)
  WHERE status = 'published';

-- ─── 5. External Applications (from public job page) ─────────────────

CREATE TABLE job_application_external (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_posting(id) ON DELETE CASCADE,

  -- Applicant info (may or may not be a registered user)
  applicant_user_id text REFERENCES "user"(id),
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text,
  applicant_linkedin text,
  cover_letter text,
  resume_file_url text,

  -- Employer workflow
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'shortlisted', 'interviewing',
                      'offer', 'hired', 'rejected', 'withdrawn')),
  employer_notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),

  -- AI matching (computed when applicant has a profile)
  match_score integer,
  match_details jsonb,

  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ext_app_posting ON job_application_external(job_posting_id);
CREATE INDEX idx_ext_app_status ON job_application_external(status);
CREATE INDEX idx_ext_app_email ON job_application_external(applicant_email);
CREATE INDEX idx_ext_app_user ON job_application_external(applicant_user_id);

-- ─── 6. Extend master_resume for public portfolios ───────────────────

ALTER TABLE master_resume
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS portfolio_headline text,
  ADD COLUMN IF NOT EXISTS portfolio_bio text;

CREATE INDEX IF NOT EXISTS idx_master_resume_public_slug ON master_resume(public_slug)
  WHERE is_public = true;

-- ─── 7. RLS Policies ─────────────────────────────────────────────────
-- Defense-in-depth only. Primary auth is Better Auth session checks in
-- Server Actions / API routes using the service role key.

ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posting ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_application_external ENABLE ROW LEVEL SECURITY;
