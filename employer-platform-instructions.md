# Expansion: Employer Platform (B2B) — Full Implementation Guide

## Overview

This document extends the existing Jobapp platform with a **two-sided marketplace**: the current **job seeker** side (unchanged) plus a new **employer** side where HR professionals and recruiters can post jobs, optimize JDs with AI, manage applicants, and discover matching candidates. It also adds **public shareable pages** for both published job postings and candidate portfolios.

This is an expansion of the existing codebase — NOT a rewrite. All existing seeker functionality, database tables, components, and routes remain unchanged. New code is additive.

---

## Existing Tech Stack (unchanged)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, API Routes) |
| Language | TypeScript (strict mode) |
| Auth | Better Auth (email/password + Google OAuth) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| AI | OpenAI GPT-4o (via `openai` npm SDK) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| i18n | next-intl (English, Georgian, Russian) |
| PDF Export | `@react-pdf/renderer` |
| Deployment | Vercel |

**No standalone backend.** The employer side uses the same Next.js API Routes + Server Actions + Supabase pattern as the seeker side. No Express, no Fastify, no separate server.

---

## URL Architecture

The platform has five URL zones. Each zone maps to a Next.js route group with its own layout.

### Complete URL Map

```
MARKETING / PUBLIC (no auth required)
─────────────────────────────────────────────────────────────────────
/[locale]/                              → Job seeker landing page (EXISTING, unchanged)
/[locale]/employers                     → Employer landing page (NEW)
/[locale]/pricing                       → Pricing page (NEW, optional — shared or per-audience)

JOB SEEKER AUTH (EXISTING, unchanged)
─────────────────────────────────────────────────────────────────────
/[locale]/login                         → Job seeker login
/[locale]/signup                        → Job seeker signup

EMPLOYER AUTH (NEW)
─────────────────────────────────────────────────────────────────────
/[locale]/employers/login               → Employer login
/[locale]/employers/signup              → Employer signup

JOB SEEKER DASHBOARD (EXISTING, unchanged)
─────────────────────────────────────────────────────────────────────
/[locale]/dashboard                     → Seeker dashboard
/[locale]/applications                  → Applications list
/[locale]/applications/new              → New application
/[locale]/applications/[id]             → Application detail
/[locale]/applications/[id]/analysis    → AI analysis
/[locale]/applications/[id]/resume      → Tailored resume
/[locale]/resume                        → Master resume editor
/[locale]/settings                      → Seeker settings

EMPLOYER DASHBOARD (NEW)
─────────────────────────────────────────────────────────────────────
/[locale]/employer/dashboard            → Employer overview (stats, recent activity)
/[locale]/employer/jobs                 → Job postings list
/[locale]/employer/jobs/new             → Create new posting
/[locale]/employer/jobs/[id]            → Job posting detail + applicant pipeline
/[locale]/employer/jobs/[id]/edit       → Edit posting
/[locale]/employer/jobs/[id]/applicants → Full applicant list for this posting
/[locale]/employer/candidates           → Candidate search / matching
/[locale]/employer/candidates/[id]      → Candidate profile view
/[locale]/employer/settings             → Company profile, team management
/[locale]/employer/analytics            → Hiring analytics (views, conversion, etc.)

PUBLIC SHAREABLE PAGES (NEW, no auth required)
─────────────────────────────────────────────────────────────────────
/[locale]/jobs/[slug]                   → Public job posting page + apply form
/[locale]/p/[slug]                      → Public candidate portfolio
```

### URL Naming Rationale

- `/employers` (plural) = marketing landing page ("For Employers")
- `/employer/` (singular) = authenticated workspace prefix
- `/jobs/[slug]` = public job posting — short, SEO-friendly, outside any auth scope
- `/p/[slug]` = public candidate portfolio — minimal prefix, user-chosen slug

---

## Route Group Structure

```
app/
├── [locale]/
│   ├── (marketing)/                    ← Public marketing pages
│   │   ├── page.tsx                    ← Job seeker landing (EXISTING)
│   │   ├── employers/
│   │   │   └── page.tsx               ← Employer landing page (NEW)
│   │   ├── pricing/
│   │   │   └── page.tsx               ← Pricing page (NEW, optional)
│   │   └── layout.tsx                 ← Marketing layout (EXISTING — navbar + footer)
│   │
│   ├── (auth)/                         ← Job seeker auth (EXISTING, unchanged)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (employer-auth)/                ← Employer auth (NEW)
│   │   ├── employers/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   └── layout.tsx                 ← Centered card layout, employer branding
│   │
│   ├── (dashboard)/                    ← Job seeker dashboard (EXISTING, unchanged)
│   │   ├── layout.tsx                 ← Seeker sidebar + navbar
│   │   ├── dashboard/page.tsx
│   │   ├── applications/...
│   │   ├── resume/...
│   │   └── settings/page.tsx
│   │
│   ├── (employer-dashboard)/           ← Employer dashboard (NEW)
│   │   ├── layout.tsx                 ← Employer sidebar + navbar (different from seeker)
│   │   └── employer/
│   │       ├── dashboard/page.tsx
│   │       ├── jobs/
│   │       │   ├── page.tsx           ← Job postings list
│   │       │   ├── new/page.tsx       ← Create posting
│   │       │   └── [id]/
│   │       │       ├── page.tsx       ← Posting detail + applicant pipeline
│   │       │       ├── edit/page.tsx  ← Edit posting
│   │       │       └── applicants/page.tsx
│   │       ├── candidates/
│   │       │   ├── page.tsx           ← Candidate search
│   │       │   └── [id]/page.tsx      ← Candidate profile
│   │       ├── analytics/page.tsx
│   │       └── settings/page.tsx      ← Company profile + team
│   │
│   ├── (public)/                       ← Public shareable pages (NEW)
│   │   ├── layout.tsx                 ← Minimal layout (navbar only, no sidebar, no auth)
│   │   ├── jobs/
│   │   │   └── [slug]/page.tsx        ← Public job posting + apply form
│   │   └── p/
│   │       └── [slug]/page.tsx        ← Public candidate portfolio
│   │
│   └── layout.tsx                     ← Root locale layout (EXISTING)
│
├── api/                                ← API routes (EXISTING structure, outside [locale])
│   ├── auth/[...all]/route.ts         ← Better Auth handler (EXISTING)
│   ├── ai/...                         ← Seeker AI routes (EXISTING)
│   ├── resume/...                     ← Resume/PDF routes (EXISTING)
│   └── employer/                       ← Employer API routes (NEW)
│       ├── jobs/route.ts              ← Job posting CRUD
│       ├── jobs/[id]/route.ts         ← Single posting operations
│       ├── jobs/[id]/publish/route.ts ← Publish/unpublish
│       ├── applications/route.ts      ← External application submissions
│       ├── candidates/match/route.ts  ← AI candidate matching
│       └── jd-optimize/route.ts       ← AI JD optimization
```

---

## Authentication & Roles

### Extending Better Auth with User Roles

Better Auth manages its own `user` table. Add a `role` column to distinguish seekers from employers.

**Migration: `supabase/migrations/007_employer_foundation.sql`** (see Database Schema section below for full SQL)

The `role` column defaults to `'seeker'`. During employer signup, the registration flow explicitly sets `role = 'employer'`.

### How Signup Works Per Role

**Job seeker signup (`/[locale]/signup`)** — EXISTING, unchanged:
- Fields: name, email, password
- On success: creates `user` with `role = 'seeker'` (default)
- Redirects to `/${locale}/dashboard`

**Employer signup (`/[locale]/employers/signup`)** — NEW:
- Fields: full name, work email, password, company name, company website (optional), company size (dropdown)
- On success:
  1. Create `user` via Better Auth with standard email/password
  2. Immediately update `role = 'employer'` on the new user row (via a Server Action that runs after Better Auth signup completes)
  3. Create an `organization` record with the company details
  4. Create an `organization_member` record linking the user as `owner`
- Redirects to `/${locale}/employer/dashboard`

### Auth Configuration Update

**`lib/auth.ts`** — No changes to the Better Auth instance itself. Better Auth handles user creation. The role assignment is a post-signup step via Server Action.

**`lib/auth-client.ts`** — No changes.

**New: `lib/actions/employer-auth.ts`** — Server Action that:
1. Gets the current session (user just signed up)
2. Updates `user.role` to `'employer'`
3. Creates `organization` and `organization_member` records
4. Returns success

### Updated Middleware (`proxy.ts`)

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Routes requiring authentication (matched after stripping locale prefix)
const seekerProtectedPaths = ['/dashboard', '/applications', '/resume', '/settings'];
const employerProtectedPaths = ['/employer/dashboard', '/employer/jobs', '/employer/candidates',
                                '/employer/analytics', '/employer/settings'];

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ka|ru)/, '') || '/';
  const locale = pathname.match(/^\/(en|ka|ru)/)?.[1] || 'en';

  const isSeekerProtected = seekerProtectedPaths.some(p => pathnameWithoutLocale.startsWith(p));
  const isEmployerProtected = employerProtectedPaths.some(p => pathnameWithoutLocale.startsWith(p));

  if (isSeekerProtected || isEmployerProtected) {
    const sessionCookie =
      req.cookies.get('better-auth.session_token') ||
      req.cookies.get('__Secure-better-auth.session_token');

    if (!sessionCookie) {
      // Redirect to the appropriate login page
      const loginPath = isEmployerProtected ? '/employers/login' : '/login';
      return NextResponse.redirect(new URL(`/${locale}${loginPath}`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

**IMPORTANT: Role enforcement is NOT in middleware.** Middleware only checks "is there a session cookie?". The actual role check happens in the **layout server components**, which already call `auth.api.getSession()`. This is the same pattern as the existing seeker dashboard layout.

### Employer Dashboard Layout — Role Enforcement

**`app/[locale]/(employer-dashboard)/layout.tsx`:**

```typescript
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { EmployerSidebar } from '@/components/employer/EmployerSidebar';
// ... other imports

export default async function EmployerDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/${locale}/employers/login`);
  }

  // Role check: verify this user is actually an employer
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('user')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!user || user.role !== 'employer') {
    // If a seeker accidentally navigates here, send them to seeker dashboard
    redirect(`/${locale}/dashboard`);
  }

  // ... render employer layout (sidebar, navbar, children)
}
```

Apply the same pattern to the existing `(dashboard)/layout.tsx` — add a role check that redirects employers to `/employer/dashboard` if they try to access seeker routes.

---

## Database Schema

### Migration File: `supabase/migrations/007_employer_foundation.sql`

Run this in the Supabase SQL editor AFTER all existing migrations (001–006).

```sql
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

  -- Structured JD data (same schema as jd_profiles for AI pipeline reuse)
  required_skills jsonb DEFAULT '[]',
  -- shape: [{ name, category, aliases, importance: "required" }]
  preferred_skills jsonb DEFAULT '[]',
  -- shape: [{ name, category, aliases, importance: "preferred" }]
  min_years_experience integer,
  max_years_experience integer,
  seniority_level text,
  education_requirements jsonb DEFAULT '[]',
  -- shape: [{ level, field, importance }]
  key_responsibilities jsonb DEFAULT '[]',
  -- shape: string[]
  soft_skills jsonb DEFAULT '[]',
  -- shape: string[]

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
```

### TypeScript Types

Add these to `types/index.ts` (or create `types/employer.ts` and re-export):

```typescript
// ─── User Roles ───────────────────────────────────────────────────────

export type UserRole = 'seeker' | 'employer';

// ─── Organization ─────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  industry: string | null;
  company_size: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null;
  created_at: string;
  updated_at: string;
}

export type OrgMemberRole = 'owner' | 'admin' | 'recruiter' | 'viewer';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  invited_by: string | null;
  joined_at: string;
}

// ─── Job Posting ──────────────────────────────────────────────────────

export type JobPostingStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived';
export type LocationType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export interface JobPosting {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  required_skills: SkillRequirement[];
  preferred_skills: SkillRequirement[];
  min_years_experience: number | null;
  max_years_experience: number | null;
  seniority_level: string | null;
  education_requirements: EducationRequirement[];
  key_responsibilities: string[];
  soft_skills: string[];
  location: string | null;
  location_type: LocationType | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  show_salary: boolean;
  employment_type: EmploymentType | null;
  department: string | null;
  status: JobPostingStatus;
  published_at: string | null;
  closes_at: string | null;
  allow_external_apply: boolean;
  jd_optimized: boolean;
  ai_optimization_suggestions: unknown;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

// ─── External Application ─────────────────────────────────────────────

export type ExternalApplicationStatus =
  'new' | 'reviewed' | 'shortlisted' | 'interviewing' |
  'offer' | 'hired' | 'rejected' | 'withdrawn';

export interface JobApplicationExternal {
  id: string;
  job_posting_id: string;
  applicant_user_id: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  applicant_linkedin: string | null;
  cover_letter: string | null;
  resume_file_url: string | null;
  status: ExternalApplicationStatus;
  employer_notes: string | null;
  rating: number | null;
  match_score: number | null;
  match_details: unknown;
  applied_at: string;
  updated_at: string;
}
```

---

## Component & File Organization

### New Directories

```
components/
├── employer/                           ← All employer-specific components (NEW)
│   ├── EmployerSidebar.tsx            ← Sidebar navigation for employer dashboard
│   ├── EmployerNavbar.tsx             ← Top navbar for employer (company name, user menu)
│   ├── jobs/                          ← Job posting components
│   │   ├── JobPostingForm.tsx         ← Create/edit job posting form
│   │   ├── JobPostingCard.tsx         ← Card for job postings list
│   │   ├── JobPostingStatusBadge.tsx  ← Status badge component
│   │   ├── JobPostingDetail.tsx       ← Detail view
│   │   └── JdOptimizer.tsx           ← AI JD optimization panel
│   ├── applicants/                    ← Applicant management components
│   │   ├── ApplicantPipeline.tsx      ← Kanban-style pipeline board
│   │   ├── ApplicantCard.tsx          ← Applicant summary card
│   │   ├── ApplicantDetail.tsx        ← Full applicant view
│   │   └── ApplicantRating.tsx        ← Star rating component
│   ├── candidates/                    ← Candidate search/matching
│   │   ├── CandidateSearch.tsx
│   │   └── CandidateProfile.tsx
│   ├── analytics/                     ← Employer analytics
│   │   └── HiringAnalytics.tsx
│   └── settings/                      ← Company settings
│       ├── CompanyProfileForm.tsx
│       └── TeamManagement.tsx
├── public-pages/                       ← Public page components (NEW)
│   ├── PublicJobPosting.tsx           ← Public job view
│   ├── ApplicationForm.tsx            ← External apply form
│   └── PublicPortfolio.tsx            ← Public candidate portfolio view
├── landing/                            ← Existing + new
│   └── EmployerLanding.tsx            ← Employer landing page sections (NEW)

lib/
├── actions/
│   ├── employer-auth.ts               ← Post-signup role + org setup (NEW)
│   ├── employer-jobs.ts               ← Job posting CRUD server actions (NEW)
│   ├── employer-applicants.ts         ← Applicant management server actions (NEW)
│   └── public-pages.ts               ← Fetch public job / portfolio data (NEW)

constants/
├── employer-statuses.ts                ← Job posting & applicant status configs (NEW)
├── employer-prompts.ts                 ← AI prompts for JD optimization, matching (NEW)
```

---

## Feature Specifications

### Feature E1: Employer Authentication

**Routes:**
- `/[locale]/(employer-auth)/employers/login/page.tsx`
- `/[locale]/(employer-auth)/employers/signup/page.tsx`

**Employer Signup Form:**
- Full Name (required)
- Work Email (required)
- Password (required, min 8 chars)
- Company Name (required)
- Company Website (optional)
- Company Size (required, dropdown: `1-10`, `11-50`, `51-200`, `201-500`, `500+`)
- All labels from `t('employerAuth.fieldName')` — zero hardcoded strings

**Signup flow:**
1. Call Better Auth's `signUp.email()` client method (same as seeker signup)
2. On success, call Server Action `completeEmployerSignup({ companyName, website, companySize })`:
   - Updates `user.role` to `'employer'` in the `user` table
   - Generates organization slug from company name (lowercase, hyphenated, append short hash if duplicate)
   - Creates `organization` record
   - Creates `organization_member` record with `role = 'owner'`
3. Redirect to `/${locale}/employer/dashboard`

**Employer Login:**
- Same fields as seeker login (email + password)
- On success, fetch user role. If `role === 'employer'`, redirect to `/${locale}/employer/dashboard`. If `role === 'seeker'`, redirect to `/${locale}/dashboard`.
- Show translated error if credentials are invalid

**Server Action: `lib/actions/employer-auth.ts`:**

```typescript
'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

export async function completeEmployerSignup(input: {
  companyName: string;
  website?: string;
  companySize: string;
}): Promise<{ organizationId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const supabase = createServerClient();

  // 1. Set user role to employer
  await supabase
    .from('user')
    .update({ role: 'employer' })
    .eq('id', session.user.id);

  // 2. Generate unique slug
  let slug = generateSlug(input.companyName);
  const { data: existing } = await supabase
    .from('organization')
    .select('slug')
    .eq('slug', slug)
    .single();
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // 3. Create organization
  const { data: org, error: orgErr } = await supabase
    .from('organization')
    .insert({
      name: input.companyName,
      slug,
      website: input.website || null,
      company_size: input.companySize,
    })
    .select()
    .single();

  if (orgErr || !org) throw new Error(orgErr?.message || 'Failed to create organization');

  // 4. Link user as owner
  await supabase
    .from('organization_member')
    .insert({
      organization_id: org.id,
      user_id: session.user.id,
      role: 'owner',
    });

  return { organizationId: org.id };
}

export async function getUserRole(): Promise<'seeker' | 'employer'> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const supabase = createServerClient();
  const { data } = await supabase
    .from('user')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return (data?.role as 'seeker' | 'employer') || 'seeker';
}

export async function getUserOrganization(): Promise<{
  organization: Organization;
  memberRole: OrgMemberRole;
} | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const supabase = createServerClient();
  const { data: membership } = await supabase
    .from('organization_member')
    .select('organization_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (!membership) return null;

  const { data: org } = await supabase
    .from('organization')
    .select('*')
    .eq('id', membership.organization_id)
    .single();

  if (!org) return null;

  return {
    organization: org as Organization,
    memberRole: membership.role as OrgMemberRole,
  };
}
```

---

### Feature E2: Employer Dashboard Layout

**Route:** `app/[locale]/(employer-dashboard)/layout.tsx`

**Sidebar navigation items** (all labels from `t('employerNav.xxx')`):
- Dashboard (icon: LayoutDashboard)
- Job Postings (icon: Briefcase)
- Candidates (icon: Users)
- Analytics (icon: BarChart3)
- Settings (icon: Settings)

**Navbar:**
- Company name + logo (from organization record)
- User avatar + name
- Locale switcher
- Theme toggle

**Dashboard page (`/employer/dashboard`):**
- Stats cards: Total Postings, Active Postings, Total Applicants, Avg. Time to Fill
- Recent applicants list (last 5)
- Recent job postings with status badges
- Quick action: "Post a New Job" button

---

### Feature E3: Job Posting CRUD

**Server Actions: `lib/actions/employer-jobs.ts`**

Follow the exact same pattern as `lib/actions/applications.ts`:
- `getAuthUserId()` helper checks session
- All queries use `createServerClient()` (service role)
- All queries scope to the user's `organization_id` (fetch via `organization_member` join)

**Actions to implement:**
- `getJobPostings(filters?)` — list all postings for the user's org, with optional status filter
- `getJobPosting(id)` — single posting, verify org membership
- `createJobPosting(input)` — create with `status = 'draft'`, generate slug
- `updateJobPosting(id, input)` — update, verify org membership
- `deleteJobPosting(id)` — soft delete (set status to 'archived'), verify org membership
- `publishJobPosting(id)` — set `status = 'published'`, set `published_at = now()`
- `pauseJobPosting(id)` — set `status = 'paused'`
- `closeJobPosting(id)` — set `status = 'closed'`
- `getJobPostingStats()` — aggregate counts for the dashboard

**Slug generation for postings:**
```typescript
function generateJobSlug(title: string, companyName: string): string {
  const base = `${title}-${companyName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 60);
  const hash = Math.random().toString(36).substring(2, 8);
  return `${base}-${hash}`;
}
// Example: "senior-react-developer-acme-corp-a1b2c3"
```

**Create/Edit Form (`components/employer/jobs/JobPostingForm.tsx`):**
- Fields: Title*, Description* (rich textarea or markdown), Short Description, Location, Location Type (remote/hybrid/onsite), Employment Type, Department, Salary Range (min/max + currency), Education Requirements, Seniority Level, Closes At (date picker)
- Structured skills input: add required skills and preferred skills as tag inputs with category dropdowns
- "Save as Draft" and "Publish" buttons
- Form validation with Zod
- All labels from `t('employer.jobs.fieldName')`

**Job Postings List (`app/[locale]/(employer-dashboard)/employer/jobs/page.tsx`):**
- Filter tabs by status: All, Draft, Published, Paused, Closed
- Each card shows: title, status badge, location, applicant count, views, date posted
- Click → detail page

**Job Posting Detail (`app/[locale]/(employer-dashboard)/employer/jobs/[id]/page.tsx`):**
- Header: title, status dropdown (changeable), edit button, publish/unpublish button
- Tabs: Overview, Applicants, AI Optimize
- Overview: full description, structured requirements, posting metadata
- Applicants: pipeline view (see Feature E4)
- AI Optimize: JD optimization panel (see Feature E6)

**Status config (`constants/employer-statuses.ts`):**
```typescript
export const JOB_POSTING_STATUSES = [
  { value: 'draft', translationKey: 'employer.statuses.draft', color: 'gray' },
  { value: 'published', translationKey: 'employer.statuses.published', color: 'green' },
  { value: 'paused', translationKey: 'employer.statuses.paused', color: 'yellow' },
  { value: 'closed', translationKey: 'employer.statuses.closed', color: 'red' },
  { value: 'archived', translationKey: 'employer.statuses.archived', color: 'gray' },
] as const;

export const EXTERNAL_APPLICATION_STATUSES = [
  { value: 'new', translationKey: 'employer.applicantStatuses.new', color: 'blue' },
  { value: 'reviewed', translationKey: 'employer.applicantStatuses.reviewed', color: 'gray' },
  { value: 'shortlisted', translationKey: 'employer.applicantStatuses.shortlisted', color: 'indigo' },
  { value: 'interviewing', translationKey: 'employer.applicantStatuses.interviewing', color: 'yellow' },
  { value: 'offer', translationKey: 'employer.applicantStatuses.offer', color: 'orange' },
  { value: 'hired', translationKey: 'employer.applicantStatuses.hired', color: 'green' },
  { value: 'rejected', translationKey: 'employer.applicantStatuses.rejected', color: 'red' },
  { value: 'withdrawn', translationKey: 'employer.applicantStatuses.withdrawn', color: 'gray' },
] as const;
```

---

### Feature E4: Applicant Pipeline

**Route:** `/[locale]/employer/jobs/[id]/applicants`
**Also embedded:** In the job posting detail page as a tab

**Server Actions: `lib/actions/employer-applicants.ts`:**
- `getApplicants(jobPostingId, filters?)` — list applicants, verify org membership
- `getApplicant(applicationId)` — single applicant detail
- `updateApplicantStatus(applicationId, newStatus)` — move through pipeline
- `rateApplicant(applicationId, rating)` — 1-5 stars
- `addApplicantNote(applicationId, note)` — update employer_notes
- `getApplicantStats(jobPostingId)` — counts by status

**Pipeline View (`components/employer/applicants/ApplicantPipeline.tsx`):**
- Kanban-style columns: New → Reviewed → Shortlisted → Interviewing → Offer → Hired
- Each card shows: name, email, match score (if available), rating stars, applied date
- Drag-and-drop between columns (use dnd-kit, already in the project)
- Click card → slide-out panel or navigate to applicant detail

**Applicant Detail:**
- Applicant info (name, email, phone, LinkedIn)
- Resume viewer (if PDF was uploaded) or linked Jobapp profile (if `applicant_user_id` is set)
- Cover letter
- Match score breakdown (if AI matching was run)
- Employer notes (editable textarea)
- Star rating
- Status dropdown
- Timeline of status changes (track via `updated_at` or add a separate `status_history` jsonb column later)

---

### Feature E5: Public Job Posting Page

**Route:** `/[locale]/(public)/jobs/[slug]/page.tsx`

**Data fetching:** Server component that queries `job_posting` by slug. Return 404 if not found or `status !== 'published'`.

```typescript
// lib/actions/public-pages.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getPublicJobPosting(slug: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_posting')
    .select(`
      *,
      organization:organization_id (name, slug, logo_url, website, industry, company_size)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  // Increment views count (fire-and-forget)
  supabase
    .from('job_posting')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => {});

  return data;
}
```

**Page content:**
- Company header: logo, name, website link, industry, size
- Job header: title, location, location type badge, employment type badge, salary range (if `show_salary` is true), department
- Full description (rendered markdown or rich text)
- Requirements section: required skills (tag chips), preferred skills (tag chips), experience range, seniority, education
- Key responsibilities list
- "Apply Now" CTA button → scrolls to or opens application form

**Application Form (`components/public-pages/ApplicationForm.tsx`):**
- Shown only if `allow_external_apply` is true
- Fields: Full Name*, Email*, Phone, LinkedIn URL, Resume Upload (PDF, max 5MB)*, Cover Letter (textarea, optional)
- If the visitor is logged in as a seeker:
  - Pre-fill name and email from their `master_resume.personal_info`
  - Show: "Apply with your Jobapp profile" toggle — if enabled, attaches `applicant_user_id` and enables AI matching
- On submit: POST to `/api/employer/applications` route
  - Upload resume PDF to Supabase Storage
  - Create `job_application_external` record
  - If `applicant_user_id` is set, trigger AI match scoring (async)
  - Increment `job_posting.applications_count`
  - Show success message: `t('publicJob.applicationSubmitted')`

**SEO meta tags (in page.tsx `generateMetadata`):**
- `<title>` — "{Job Title} at {Company Name} | Jobapp"
- Open Graph: title, description (short_description or first 160 chars of description), type "website"
- JSON-LD: `JobPosting` schema (https://schema.org/JobPosting)

---

### Feature E6: AI JD Optimization

**Route:** Embedded in job posting detail page as "AI Optimize" tab
**API:** `app/api/employer/jd-optimize/route.ts`

**Reuses the existing AI infrastructure** (`lib/openai.ts`, prompt pattern from `constants/prompts.ts`).

**New prompt: `constants/employer-prompts.ts`:**

```typescript
export const JD_OPTIMIZATION_PROMPT = `
You are a job description optimization expert. Analyze the following job description and provide specific, actionable improvements.

Evaluate across these dimensions:
1. **Clarity** — Is the role and its responsibilities clearly defined? Are there vague phrases that should be more specific?
2. **Completeness** — Are key sections present (responsibilities, requirements, benefits, company info)? What's missing?
3. **Inclusivity** — Is the language gender-neutral and free of exclusionary terms? Are requirements realistic (not inflated)?
4. **Attractiveness** — Would a qualified candidate be excited by this posting? Is the company value proposition clear?
5. **SEO / Discoverability** — Are relevant industry keywords present? Is the title standard (not overly creative)?
6. **Requirements Balance** — Are "required" vs "preferred" skills properly categorized? Is the years-of-experience ask realistic for the seniority level?

For each dimension, provide:
- A score (1-10)
- Specific issues found
- Concrete rewrite suggestions with before/after examples

Return ONLY valid JSON matching this schema:
{
  "overall_score": number,
  "dimensions": [
    {
      "name": string,
      "score": number,
      "issues": [{ "description": string, "severity": "high" | "medium" | "low" }],
      "suggestions": [{ "before": string, "after": string, "reason": string }]
    }
  ],
  "rewritten_description": string,
  "rewritten_title": string | null,
  "missing_sections": string[]
}

Job Description:
{{jd_text}}

Job Title: {{job_title}}
`;
```

**Flow:**
1. Employer clicks "Optimize with AI" on a job posting
2. Frontend calls `/api/employer/jd-optimize` with the posting ID
3. API route: auth check → verify employer owns this posting → fetch posting → send to GPT-4o with the optimization prompt
4. Store results in `job_posting.ai_optimization_suggestions`
5. Set `jd_optimized = true`
6. Return results to frontend

**UI (`components/employer/jobs/JdOptimizer.tsx`):**
- Overall score gauge (similar to existing ATS score display)
- Dimension-by-dimension breakdown (cards with scores, issues, suggestions)
- "Apply Rewritten Description" button — replaces the posting description with the AI rewrite
- Individual suggestion accept/reject (similar to existing one-click rewrite pattern)

---

### Feature E7: Public Candidate Portfolio

**Route:** `/[locale]/(public)/p/[slug]/page.tsx`

**Data fetching (in `lib/actions/public-pages.ts`):**

```typescript
export async function getPublicPortfolio(slug: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('master_resume')
    .select('*')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single();

  if (error || !data) return null;
  return data;
}
```

**Page content:**
- Portfolio headline and bio (from new fields)
- Personal info (name, location, LinkedIn, portfolio URL — phone and email hidden unless user explicitly enables)
- Professional summary
- Experience timeline (company, title, dates, bullets)
- Education
- Skills (grouped by category, displayed as tag chips)
- Projects (with links)
- Certifications
- Languages

**Design:** Use a polished, read-only template. Consider reusing the resume template components but in a full-page layout rather than the A4 preview format.

**Settings for seekers** — add to existing `/[locale]/(dashboard)/settings/page.tsx`:
- Toggle: "Make my profile public"
- Slug input: "Your portfolio URL: jobapp.com/en/p/[your-slug]" — validate uniqueness
- Headline input (e.g., "Senior React Developer | Open to Opportunities")
- Bio textarea
- Privacy toggles: show/hide email, show/hide phone on public profile

**SEO meta tags:**
- `<title>` — "{Name} — {Headline} | Jobapp"
- Open Graph: name, headline, summary
- JSON-LD: `Person` schema

---

### Feature E8: Employer Landing Page

**Route:** `/[locale]/(marketing)/employers/page.tsx`

**Sections (all text from `t('employerLanding.xxx')`):**
1. **Hero** — headline: "Find your perfect candidates, faster" / subheadline + CTA: "Start Posting Free"
2. **How It Works** — 3 steps: Post a Job → AI Optimizes Your JD → Review Matched Candidates
3. **Features grid** — 4-6 cards: AI JD Optimization, Smart Candidate Matching, Applicant Pipeline, Analytics Dashboard, Public Job Pages, Team Collaboration
4. **Stats / Social proof** — placeholder for metrics
5. **Pricing preview** — if applicable
6. **CTA** — repeated signup prompt
7. **Footer** — same as seeker landing

**Design:** Same component structure as existing landing page but with employer-focused messaging. Reuse shadcn/ui components and design patterns. Differentiate visually with a different accent color or hero image.

---

### Feature E9: Candidate Matching (AI)

**Route:** `/[locale]/employer/candidates`
**API:** `app/api/employer/candidates/match/route.ts`

**This reuses the existing ATS scoring pipeline** (`lib/ats-scoring/`) but in reverse:
- Input: a job posting's structured requirements
- Candidates: registered users whose `master_resume.is_public = true`
- Output: ranked list of candidates with match scores

**Flow:**
1. Employer navigates to Candidates page or clicks "Find Matching Candidates" on a posting
2. System queries all public master resumes
3. For each candidate, run the ATS scoring pipeline (resume data vs. posting requirements)
4. Return ranked results with scores and match breakdowns

**For MVP:** This can be a simpler keyword/skill overlap scoring rather than full AI analysis for every candidate (which would be expensive). Use the deterministic stages of the ATS pipeline (keyword matching, experience years, skills overlap) and reserve AI for the top 10-20 candidates.

---

## i18n — Translation Keys

Add a new top-level namespace `employer` (and `employerAuth`, `employerLanding`, `publicJob`, `publicPortfolio`) to `messages/en.json`, `messages/ka.json`, and `messages/ru.json`.

**Key namespaces to add:**

```json
{
  "employerAuth": {
    "login": "Employer Sign In",
    "signup": "Create Employer Account",
    "companyName": "Company Name",
    "companyWebsite": "Company Website",
    "companySize": "Company Size",
    "workEmail": "Work Email",
    "signupSuccess": "Welcome! Let's set up your first job posting.",
    "noAccount": "Don't have an employer account?",
    "hasAccount": "Already have an employer account?",
    "seekerAccount": "Looking for a job instead?"
  },
  "employerNav": {
    "dashboard": "Dashboard",
    "jobPostings": "Job Postings",
    "candidates": "Candidates",
    "analytics": "Analytics",
    "settings": "Settings"
  },
  "employer": {
    "dashboard": {
      "title": "Employer Dashboard",
      "totalPostings": "Total Postings",
      "activePostings": "Active Postings",
      "totalApplicants": "Total Applicants",
      "avgTimeToFill": "Avg. Time to Fill",
      "recentApplicants": "Recent Applicants",
      "recentPostings": "Recent Postings",
      "postNewJob": "Post a New Job"
    },
    "jobs": {
      "title": "Job Postings",
      "new": "New Posting",
      "jobTitle": "Job Title",
      "description": "Job Description",
      "shortDescription": "Short Description",
      "location": "Location",
      "locationType": "Location Type",
      "remote": "Remote",
      "hybrid": "Hybrid",
      "onsite": "On-site",
      "employmentType": "Employment Type",
      "fullTime": "Full-time",
      "partTime": "Part-time",
      "contract": "Contract",
      "internship": "Internship",
      "department": "Department",
      "salaryRange": "Salary Range",
      "salaryMin": "Minimum",
      "salaryMax": "Maximum",
      "currency": "Currency",
      "showSalary": "Show salary on public posting",
      "seniorityLevel": "Seniority Level",
      "requiredSkills": "Required Skills",
      "preferredSkills": "Preferred Skills",
      "educationRequirements": "Education Requirements",
      "responsibilities": "Key Responsibilities",
      "closingDate": "Closing Date",
      "allowExternalApply": "Allow external applications",
      "saveAsDraft": "Save as Draft",
      "publish": "Publish",
      "unpublish": "Unpublish",
      "edit": "Edit Posting",
      "delete": "Delete Posting",
      "optimize": "Optimize with AI",
      "noPostings": "No job postings yet. Create your first one!",
      "created": "Job posting created",
      "updated": "Job posting updated",
      "published": "Job posting published",
      "applicants": "Applicants",
      "views": "Views"
    },
    "applicants": {
      "title": "Applicants",
      "new": "New",
      "reviewed": "Reviewed",
      "shortlisted": "Shortlisted",
      "interviewing": "Interviewing",
      "offer": "Offer",
      "hired": "Hired",
      "rejected": "Rejected",
      "withdrawn": "Withdrawn",
      "matchScore": "Match Score",
      "rating": "Rating",
      "notes": "Notes",
      "addNote": "Add a note...",
      "noApplicants": "No applicants yet.",
      "statusUpdated": "Applicant status updated",
      "viewProfile": "View Profile",
      "downloadResume": "Download Resume",
      "coverLetter": "Cover Letter"
    },
    "statuses": {
      "draft": "Draft",
      "published": "Published",
      "paused": "Paused",
      "closed": "Closed",
      "archived": "Archived"
    },
    "applicantStatuses": {
      "new": "New",
      "reviewed": "Reviewed",
      "shortlisted": "Shortlisted",
      "interviewing": "Interviewing",
      "offer": "Offer",
      "hired": "Hired",
      "rejected": "Rejected",
      "withdrawn": "Withdrawn"
    },
    "settings": {
      "title": "Company Settings",
      "companyProfile": "Company Profile",
      "teamManagement": "Team Management",
      "companyName": "Company Name",
      "website": "Website",
      "industry": "Industry",
      "description": "Company Description",
      "logo": "Company Logo",
      "saved": "Settings saved"
    },
    "analytics": {
      "title": "Hiring Analytics",
      "viewsByPosting": "Views by Posting",
      "applicationsByPosting": "Applications by Posting",
      "conversionRate": "View → Apply Rate",
      "statusBreakdown": "Pipeline Breakdown",
      "timeToFill": "Time to Fill"
    },
    "optimize": {
      "title": "AI JD Optimization",
      "overallScore": "Overall Score",
      "clarity": "Clarity",
      "completeness": "Completeness",
      "inclusivity": "Inclusivity",
      "attractiveness": "Attractiveness",
      "seo": "SEO & Discoverability",
      "requirementsBalance": "Requirements Balance",
      "applyRewrite": "Apply Rewritten Description",
      "acceptSuggestion": "Accept",
      "rejectSuggestion": "Dismiss",
      "analyzing": "Analyzing your job description...",
      "optimized": "JD optimization complete"
    }
  },
  "employerLanding": {
    "heroTitle": "Find your perfect candidates, faster",
    "heroSubtitle": "AI-powered job posting optimization and smart candidate matching",
    "ctaPrimary": "Start Posting Free",
    "ctaSecondary": "See How It Works",
    "step1Title": "Post your job",
    "step1Desc": "Create a job posting with your requirements",
    "step2Title": "AI optimizes your JD",
    "step2Desc": "Get suggestions to attract better candidates",
    "step3Title": "Review matched candidates",
    "step3Desc": "AI ranks applicants by fit to your requirements"
  },
  "publicJob": {
    "applyNow": "Apply Now",
    "applyWithProfile": "Apply with your Jobapp profile",
    "fullName": "Full Name",
    "email": "Email",
    "phone": "Phone",
    "linkedIn": "LinkedIn URL",
    "resumeUpload": "Upload Resume (PDF)",
    "coverLetter": "Cover Letter (optional)",
    "submit": "Submit Application",
    "submitting": "Submitting...",
    "applicationSubmitted": "Your application has been submitted successfully!",
    "alreadyApplied": "You have already applied to this position.",
    "postingClosed": "This position is no longer accepting applications.",
    "required": "Required",
    "preferred": "Preferred",
    "experience": "Experience",
    "education": "Education",
    "responsibilities": "Responsibilities",
    "aboutCompany": "About {company}",
    "postedOn": "Posted {date}",
    "closesOn": "Closes {date}"
  },
  "publicPortfolio": {
    "experience": "Experience",
    "education": "Education",
    "skills": "Skills",
    "projects": "Projects",
    "certifications": "Certifications",
    "languages": "Languages",
    "contactMe": "Contact Me",
    "profileNotFound": "This profile is not available."
  },
  "portfolioSettings": {
    "title": "Public Portfolio",
    "makePublic": "Make my profile public",
    "slug": "Portfolio URL",
    "slugPrefix": "jobapp.com/{locale}/p/",
    "headline": "Headline",
    "headlinePlaceholder": "Senior React Developer | Open to Opportunities",
    "bio": "Bio",
    "bioPlaceholder": "A brief introduction about yourself...",
    "showEmail": "Show email on public profile",
    "showPhone": "Show phone on public profile",
    "saved": "Portfolio settings saved",
    "slugTaken": "This URL is already taken"
  }
}
```

**CRITICAL:** Add all these keys to ALL locale files (`en.json`, `ka.json`, `ru.json`) with the same key structure. Georgian and Russian values must be properly translated.

---

## Implementation Order

Build in this exact sequence. Each phase should result in a working, testable addition.

### Phase E1: Foundation (auth + layout)
1. Run migration `007_employer_foundation.sql` in Supabase SQL editor
2. Add employer TypeScript types to `types/index.ts` (or `types/employer.ts` + re-export)
3. Add `employerAuth` and `employerNav` translation keys to all locale files
4. Create `(employer-auth)` route group with layout
5. Build employer signup page (`/[locale]/employers/signup`)
6. Build employer login page (`/[locale]/employers/login`)
7. Create `lib/actions/employer-auth.ts` (completeEmployerSignup, getUserRole, getUserOrganization)
8. Update `proxy.ts` middleware to handle employer protected paths
9. Create `(employer-dashboard)` route group with layout (role enforcement, employer sidebar, employer navbar)
10. Create placeholder employer dashboard page

**Test:** Sign up as employer → see employer dashboard. Sign in as seeker → still see seeker dashboard. Employer trying seeker routes → redirected. Seeker trying employer routes → redirected.

### Phase E2: Job Posting CRUD
11. Add `employer.jobs` and `employer.statuses` translation keys to all locale files
12. Create `lib/actions/employer-jobs.ts` (all CRUD actions)
13. Create `constants/employer-statuses.ts`
14. Build `JobPostingForm.tsx` (create + edit form)
15. Build job postings list page (`/employer/jobs`)
16. Build create posting page (`/employer/jobs/new`)
17. Build job posting detail page (`/employer/jobs/[id]`)
18. Build edit posting page (`/employer/jobs/[id]/edit`)
19. Implement publish/pause/close workflow with status transitions

**Test:** Create a draft posting → edit it → publish it → pause it → close it. List view shows correct status badges. Verify all i18n keys render.

### Phase E3: Public Job Page + Application Form
20. Add `publicJob` translation keys to all locale files
21. Create `(public)` route group with minimal layout
22. Create `lib/actions/public-pages.ts` (getPublicJobPosting)
23. Build public job posting page (`/[locale]/jobs/[slug]`)
24. Build `ApplicationForm.tsx` component
25. Create `/api/employer/applications` route for form submission
26. Set up resume file upload to Supabase Storage for external applicants
27. Add `generateMetadata` for SEO (Open Graph, JSON-LD JobPosting schema)

**Test:** Publish a posting → navigate to its public URL → see full posting → submit an application (both as anonymous and as logged-in seeker). Verify the application appears in the database.

### Phase E4: Applicant Pipeline
28. Add `employer.applicants` and `employer.applicantStatuses` translation keys
29. Create `lib/actions/employer-applicants.ts`
30. Build `ApplicantPipeline.tsx` (kanban view with dnd-kit)
31. Build `ApplicantCard.tsx` and `ApplicantDetail.tsx`
32. Build `ApplicantRating.tsx` (star rating)
33. Build applicants page (`/employer/jobs/[id]/applicants`)
34. Integrate pipeline as a tab in job posting detail page

**Test:** Submit 3-4 test applications → view them in pipeline → drag between columns → rate and add notes → verify status updates persist.

### Phase E5: AI JD Optimization
35. Add `employer.optimize` translation keys
36. Create `constants/employer-prompts.ts` with JD optimization prompt
37. Create `/api/employer/jd-optimize/route.ts`
38. Build `JdOptimizer.tsx` component (score display, suggestions, apply rewrite)
39. Integrate as "AI Optimize" tab in job posting detail page

**Test:** Create a posting with a mediocre JD → run optimization → review suggestions → apply the rewritten description → verify it updates the posting.

### Phase E6: Public Candidate Portfolio
40. Add `publicPortfolio` and `portfolioSettings` translation keys
41. Build portfolio settings section in seeker settings page (toggle public, slug, headline, bio)
42. Create `lib/actions/public-pages.ts` → `getPublicPortfolio(slug)`
43. Build public portfolio page (`/[locale]/p/[slug]`)
44. Add `generateMetadata` for SEO

**Test:** As a seeker → enable public profile → set slug → view public URL. Toggle off → URL returns 404. Verify SEO meta tags.

### Phase E7: Candidate Matching
45. Create `/api/employer/candidates/match/route.ts`
46. Build candidate search page (`/employer/candidates`)
47. Build candidate profile view (`/employer/candidates/[id]`)
48. Implement match scoring (reuse ATS pipeline stages)
49. Add match scores to applicant pipeline cards

**Test:** Have 2-3 seeker accounts with public profiles → from employer account, search candidates → see ranked results with match scores.

### Phase E8: Polish
50. Build employer landing page (`/[locale]/employers`)
51. Build employer analytics page (`/employer/analytics`)
52. Add loading states (`loading.tsx`) and error boundaries (`error.tsx`) to all new route segments
53. Add empty states for all list views
54. Responsive design pass for all employer pages
55. **i18n QA pass**: switch between all locales on every new page, verify no untranslated strings

---

## Key Constraints (same as existing + new)

- **Use Server Actions** for mutations. Use API routes for AI processing and file uploads.
- **No ORMs.** Use Supabase JS client for all database operations.
- **Type safety.** All new types in `types/`. No `any`.
- **Component composition.** Reuse shadcn/ui. Keep components small and focused.
- **Error boundaries.** Add `error.tsx` in all new route segments.
- **Loading states.** Add `loading.tsx` or Suspense boundaries in all new route segments.
- **ZERO hardcoded strings.** Every user-facing string uses `t('key')`.
- **All navigation links** use `Link` from `next-intl/navigation`.
- **Employer data isolation.** ALL employer queries must verify organization membership. Never allow an employer to see another org's postings or applicants. Use the pattern: fetch `organization_member` for the current user → use `organization_id` in all subsequent queries.
- **Public pages must be safe.** Never expose private data (seeker emails/phones unless explicitly published, draft postings, internal notes).
- **No standalone backend.** Everything runs within Next.js. API routes at `/api/employer/...` for complex operations, Server Actions for simple CRUD.

---

## Deliverables

For each phase, provide:
1. All new/modified files with complete code
2. Any SQL migrations to run
3. Translation key additions for ALL locale files
4. What to test manually before moving to the next phase
5. Any new `.env` values needed (none expected — existing env vars cover everything)

Start with **Phase E1: Foundation**.