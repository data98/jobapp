-- Phase 2: Create application tables
-- Run this AFTER `npx @better-auth/cli migrate` has created the auth tables (user, session, account, verification).

-- ─── Master Resume ────────────────────────────────────────────────────────────

create table master_resume (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  personal_info jsonb not null default '{}',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  skills jsonb not null default '[]',
  languages jsonb not null default '[]',
  certifications jsonb not null default '[]',
  projects jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- ─── Job Application ──────────────────────────────────────────────────────────

create table job_application (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  job_title text not null,
  company text not null,
  job_description text,
  job_url text,
  status text not null default 'bookmarked'
    check (status in ('bookmarked', 'applying', 'applied', 'interviewing', 'negotiation', 'accepted', 'rejected')),
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  salary_range text,
  location text,
  applied_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Resume Variant ───────────────────────────────────────────────────────────

create table resume_variant (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references job_application(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  template_id text not null default 'classic',
  personal_info jsonb not null default '{}',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  skills jsonb not null default '[]',
  languages jsonb not null default '[]',
  certifications jsonb not null default '[]',
  projects jsonb not null default '[]',
  included_sections jsonb not null default '["personal_info","experience","education","skills"]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_application_id)
);

-- ─── AI Analysis ──────────────────────────────────────────────────────────────

create table ai_analysis (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references job_application(id) on delete cascade,
  ats_score integer,
  summary text,
  missing_keywords jsonb default '[]',
  improvement_areas jsonb default '[]',
  matching_strengths jsonb default '[]',
  rewrite_suggestions jsonb default '[]',
  raw_response jsonb,
  created_at timestamptz default now(),
  unique(job_application_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Defense-in-depth: primary auth is via Better Auth session checks in API routes.
-- Server-side uses service role key which bypasses RLS.

alter table master_resume enable row level security;
alter table job_application enable row level security;
alter table resume_variant enable row level security;
alter table ai_analysis enable row level security;

-- Policies for master_resume
create policy "Users can select own master_resume"
  on master_resume for select
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert own master_resume"
  on master_resume for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can update own master_resume"
  on master_resume for update
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can delete own master_resume"
  on master_resume for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies for job_application
create policy "Users can select own job_application"
  on job_application for select
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert own job_application"
  on job_application for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can update own job_application"
  on job_application for update
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can delete own job_application"
  on job_application for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies for resume_variant
create policy "Users can select own resume_variant"
  on resume_variant for select
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert own resume_variant"
  on resume_variant for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can update own resume_variant"
  on resume_variant for update
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can delete own resume_variant"
  on resume_variant for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies for ai_analysis (joined through job_application for ownership)
create policy "Users can select own ai_analysis"
  on ai_analysis for select
  using (
    job_application_id in (
      select id from job_application where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

create policy "Users can insert own ai_analysis"
  on ai_analysis for insert
  with check (
    job_application_id in (
      select id from job_application where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

create policy "Users can update own ai_analysis"
  on ai_analysis for update
  using (
    job_application_id in (
      select id from job_application where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

create policy "Users can delete own ai_analysis"
  on ai_analysis for delete
  using (
    job_application_id in (
      select id from job_application where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index idx_master_resume_user_id on master_resume(user_id);
create index idx_job_application_user_id on job_application(user_id);
create index idx_job_application_status on job_application(status);
create index idx_resume_variant_user_id on resume_variant(user_id);
create index idx_resume_variant_job_application_id on resume_variant(job_application_id);
create index idx_ai_analysis_job_application_id on ai_analysis(job_application_id);
