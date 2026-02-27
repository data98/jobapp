# ATS Scoring System V1 — Architecture & Implementation Spec

**Version:** 1.0
**Date:** February 2026
**Status:** Draft — Ready for Review

---

## 1. Executive Summary

The current ATS scoring system delegates all analysis to a single GPT-4o prompt, producing an opaque, non-deterministic score. V1 replaces this with a **multi-stage pipeline** where each stage has a focused responsibility, produces structured output, and feeds into the next. The result is a transparent, reproducible, and actionable scoring system.

### Core Principles

- **Transparency:** Every point of the score is traceable to a specific reason.
- **Determinism:** Same resume + same JD = same score (AI variance is bounded).
- **Actionability:** Every deduction comes with a specific, implementable fix.
- **Efficiency:** AI is used only where deterministic logic cannot suffice.

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOW                                │
│                                                                 │
│  User pastes Job Description                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────┐                           │
│  │  STAGE 1: JD Analysis (AI)      │ ← Runs ONCE per JD        │
│  │  Extracts structured profile    │                            │
│  │  User can review & edit         │                            │
│  └──────────────┬───────────────────┘                           │
│                 │                                                │
│                 ▼  Stored as `jd_profile` in DB                 │
│                                                                 │
│  User clicks "Analyze" (or edits resume and re-analyzes)        │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────┐                           │
│  │  STAGE 2: Matching Engine       │ ← Runs on each analysis   │
│  │  (Deterministic + AI Hybrid)    │                            │
│  │  Produces sub-scores per        │                            │
│  │  category                       │                            │
│  └──────────────┬───────────────────┘                           │
│                 │                                                │
│                 ▼                                                │
│  ┌──────────────────────────────────┐                           │
│  │  STAGE 3: Score Computation     │ ← Pure math, no AI        │
│  │  Weighted aggregation           │                            │
│  │  Deterministic & reproducible   │                            │
│  └──────────────┬───────────────────┘                           │
│                 │                                                │
│                 ▼                                                │
│  ┌──────────────────────────────────┐                           │
│  │  STAGE 4: Recommendations (AI)  │ ← Focused, targeted       │
│  │  Rewrites & improvement plan    │                            │
│  │  using specific gap data        │                            │
│  └──────────────────────────────────┘                           │
│                                                                 │
│  All stages → Unified results displayed to user                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Stage 1 — Job Description Analysis

### 2.1 Purpose

Parse unstructured job description text into a structured **JD Profile**. This runs once when the user creates/updates a job application and is independent of the resume. The extracted profile is stored, displayed to the user, and editable.

### 2.2 Output Schema: `JDProfile`

```typescript
interface JDProfile {
  id: string;                          // uuid
  job_application_id: string;          // FK to job_applications
  
  // --- Core Requirements ---
  required_skills: SkillRequirement[];  // Must-have skills
  preferred_skills: SkillRequirement[]; // Nice-to-have skills
  
  // --- Experience ---
  min_years_experience: number | null;  // e.g., 3
  max_years_experience: number | null;  // e.g., 7 (null = no upper bound)
  seniority_level: SeniorityLevel;      // junior | mid | senior | lead | principal | executive
  
  // --- Education ---
  education_requirements: EducationRequirement[];
  
  // --- Certifications ---
  required_certifications: string[];    // e.g., ["AWS Solutions Architect", "PMP"]
  preferred_certifications: string[];
  
  // --- Role Context ---
  job_title_normalized: string;         // Cleaned/normalized job title
  department_function: string;          // e.g., "Engineering", "Marketing", "Finance"
  industry: string;                     // e.g., "FinTech", "Healthcare", "SaaS"
  
  // --- Responsibilities ---
  key_responsibilities: string[];       // Top 5-8 core duties extracted from JD
  
  // --- Soft Skills ---
  soft_skills: string[];                // e.g., ["leadership", "communication", "cross-functional collaboration"]
  
  // --- Metadata ---
  raw_jd_text: string;                  // Original JD for reference
  ai_model_used: string;                // e.g., "gpt-4o"
  extracted_at: string;                 // ISO timestamp
  user_edited: boolean;                 // Flipped to true if user modifies anything
  user_edited_at: string | null;
}

interface SkillRequirement {
  id: string;
  name: string;                         // e.g., "React"
  category: SkillCategory;             // "language" | "framework" | "tool" | "platform" | "methodology" | "domain"
  aliases: string[];                    // e.g., ["React.js", "ReactJS"] — for matching
  context: string;                      // Where in the JD this was mentioned (brief quote/reference)
  importance: "required" | "preferred";
}

interface EducationRequirement {
  level: "high_school" | "associate" | "bachelor" | "master" | "phd" | "any";
  field: string | null;                 // e.g., "Computer Science" or null if any field
  importance: "required" | "preferred";
}

type SeniorityLevel = "intern" | "junior" | "mid" | "senior" | "lead" | "principal" | "manager" | "director" | "executive";
type SkillCategory = "language" | "framework" | "tool" | "platform" | "methodology" | "domain" | "soft_skill";
```

### 2.3 AI Prompt Design — Stage 1

```
SYSTEM:
You are a job description analyst. Your task is to extract structured 
requirements from a job posting. Be precise and conservative — only 
mark something as "required" if the JD explicitly states it is mandatory 
(words like "must have", "required", "minimum", "X+ years"). If the JD 
says "preferred", "nice to have", "bonus", or "ideal", mark it as 
"preferred".

For skills, generate reasonable aliases (e.g., "React" → ["React.js", 
"ReactJS"]). For seniority, infer from title + years + language used 
in the JD.

Return ONLY valid JSON matching the provided schema. Do not include 
any text outside the JSON.

USER:
Analyze this job description and extract all requirements.

JOB DESCRIPTION:
{{job_description}}

Return JSON matching this exact schema:
{
  "required_skills": [
    { 
      "name": "string",
      "category": "language|framework|tool|platform|methodology|domain",
      "aliases": ["string"],
      "context": "brief reference to where this appeared in JD"
    }
  ],
  "preferred_skills": [same shape as above],
  "min_years_experience": number | null,
  "max_years_experience": number | null,
  "seniority_level": "intern|junior|mid|senior|lead|principal|manager|director|executive",
  "education_requirements": [
    {
      "level": "high_school|associate|bachelor|master|phd|any",
      "field": "string or null",
      "importance": "required|preferred"
    }
  ],
  "required_certifications": ["string"],
  "preferred_certifications": ["string"],
  "job_title_normalized": "string",
  "department_function": "string",
  "industry": "string",
  "key_responsibilities": ["string — top 5-8"],
  "soft_skills": ["string"]
}
```

### 2.4 Model Selection

- **Recommended:** `gpt-4o-mini` — This task is structured extraction, not complex reasoning. A smaller/cheaper model is sufficient.
- **Fallback:** `gpt-4o` if extraction quality is insufficient in testing.
- **Token budget:** ~1000-1500 output tokens expected.

### 2.5 Database Storage

New table: `jd_profiles`

```sql
CREATE TABLE jd_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
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
  raw_jd_text TEXT NOT NULL,
  ai_model_used TEXT NOT NULL,
  user_edited BOOLEAN NOT NULL DEFAULT FALSE,
  user_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_application_id) -- one profile per application
);
```

### 2.6 User-Facing UI

When the user saves a job application (or edits the JD), Stage 1 runs automatically. The results are displayed in a new **"Job Requirements"** section on the application detail page:

**Display Elements:**
- Required Skills — editable chip/tag list, grouped by category
- Preferred Skills — same as above, visually distinct (lighter styling)
- Experience Level — editable: seniority dropdown + years range inputs
- Education — editable entries with level dropdown + field text input
- Certifications — editable tag list, separated by required/preferred
- Key Responsibilities — editable list of text items
- Industry & Department — editable text fields

**Edit Behavior:**
- All fields are directly editable inline
- Changes set `user_edited = true` and `user_edited_at = NOW()`
- User edits persist and override AI extraction
- A "Re-extract from JD" button re-runs Stage 1 (with confirmation: "This will overwrite your manual edits")

**Why this matters:**
- User sees what the system "understands" about the job before scoring
- If the AI misinterprets something, user corrects it, improving score accuracy
- Builds trust — the system is transparent, not a black box

---

## 3. Stage 2 — Matching Engine

### 3.1 Purpose

Compare the structured resume data against the JD Profile from Stage 1. Produce sub-scores for each scoring dimension with detailed evidence.

### 3.2 Scoring Dimensions

#### 3.2.1 Keyword Match Score (Weight: 35%)

**Type:** Deterministic (with AI-assisted synonym resolution)

**Logic:**
```
For each skill in JD Profile (required + preferred):
  1. Exact match: Check if skill.name or any skill.aliases appear in:
     - resume.skills[].name
     - resume.experience[].bullets[] (full text)
     - resume.experience[].title
     - resume.personal_info.summary
     - resume.projects[].bullets[]
     - resume.certifications[].name
  2. Fuzzy match: Normalize both sides (lowercase, remove special chars, 
     stem common suffixes). Check Levenshtein distance <= 2 for short 
     words, or partial string containment for longer terms.
  3. Record WHERE each keyword was found (which section, which entry).

Scoring:
  - Required skill matched: +full points
  - Required skill missing: 0 points  
  - Preferred skill matched: +full points (but lower point value)
  - Preferred skill missing: 0 points (no penalty)

Formula:
  required_match_pct = matched_required / total_required
  preferred_match_pct = matched_preferred / total_preferred
  
  keyword_score = (required_match_pct * 0.75) + (preferred_match_pct * 0.25)
  // Required keywords count 3x more than preferred
```

**Output:**
```typescript
interface KeywordMatchResult {
  score: number;                       // 0-100
  required_matched: SkillMatch[];
  required_missing: SkillRequirement[];
  preferred_matched: SkillMatch[];
  preferred_missing: SkillRequirement[];
  total_required: number;
  total_preferred: number;
}

interface SkillMatch {
  skill: SkillRequirement;
  found_in: MatchLocation[];          // Where it was found
}

interface MatchLocation {
  section: "skills" | "experience" | "summary" | "projects" | "certifications" | "education";
  entry_index?: number;               // Which experience/project entry
  bullet_index?: number;              // Which bullet within that entry
  match_type: "exact" | "alias" | "fuzzy";
  matched_text: string;               // The actual text that matched
}
```

#### 3.2.2 Experience Relevance Score (Weight: 25%)

**Type:** AI-assisted (semantic comparison needed)

**Logic:**
The AI compares the candidate's experience entries against the JD's key responsibilities and role context. This cannot be purely deterministic because job titles and bullet descriptions require semantic understanding.

**AI Prompt — Experience Matching:**
```
SYSTEM:
You are scoring resume experience relevance against a job description.
For each experience entry, assess how relevant it is to the target role.
Score strictly based on evidence. Return ONLY valid JSON.

USER:
TARGET ROLE:
- Title: {{jd_profile.job_title_normalized}}
- Department: {{jd_profile.department_function}}  
- Industry: {{jd_profile.industry}}
- Seniority: {{jd_profile.seniority_level}}
- Key Responsibilities: {{jd_profile.key_responsibilities}}

CANDIDATE EXPERIENCE:
{{resume.experience as JSON}}

For each experience entry, return:
{
  "experience_scores": [
    {
      "entry_index": 0,
      "title_relevance": <0-100>,
      "responsibility_overlap": <0-100>,
      "industry_match": <0-100>,
      "overall_relevance": <0-100>,
      "reasoning": "1 sentence explanation"
    }
  ],
  "total_relevant_years": <number>,
  "seniority_match": "under_qualified | match | over_qualified",
  "career_trajectory_note": "1 sentence on career direction fit"
}
```

**Scoring Formula:**
```
experience_relevance = weighted_avg(experience_scores[].overall_relevance, 
                                     weight_by=recency)
// Most recent roles weighted 2x vs older roles

// Seniority modifier:
if seniority_match == "match": no change
if seniority_match == "under_qualified": -10 penalty
if seniority_match == "over_qualified": -5 penalty (slight, not disqualifying)

// Years of experience check:
if jd_profile.min_years_experience exists:
  if total_relevant_years < min_years: -15 penalty
  if total_relevant_years >= min_years: no change
```

**Output:**
```typescript
interface ExperienceRelevanceResult {
  score: number;                       // 0-100
  experience_scores: ExperienceScore[];
  total_relevant_years: number;
  seniority_match: "under_qualified" | "match" | "over_qualified";
  years_requirement_met: boolean;
  career_trajectory_note: string;
}

interface ExperienceScore {
  entry_index: number;
  company: string;
  title: string;
  title_relevance: number;
  responsibility_overlap: number;
  industry_match: number;
  overall_relevance: number;
  reasoning: string;
}
```

#### 3.2.3 Hard Requirements Score (Weight: 20%)

**Type:** Fully Deterministic

**Logic:**
Check pass/fail conditions for non-negotiable requirements.

```
Education Check:
  For each required education requirement in JD Profile:
    - Check if resume.education[] has matching or higher level
    - Check if field matches (if specified)
    
  education_hierarchy = {
    high_school: 1, associate: 2, bachelor: 3, master: 4, phd: 5
  }
  
  if required_level exists:
    candidate_highest = max(resume.education[].level mapped to hierarchy)
    education_met = candidate_highest >= required_level
  else:
    education_met = true (no requirement)

Certification Check:
  For each required certification in JD Profile:
    - Check if resume.certifications[].name fuzzy-matches
    
  cert_match_pct = matched_certs / required_certs
  // 0 required certs = 100% match (no requirement)

Years of Experience Check:
  - Already computed in Stage 2.2 (experience relevance)
  - Binary: met or not met

Scoring:
  education_score = education_met ? 100 : 30
  // Not 0 — some roles list education as "required" but 
  // will accept equivalent experience
  
  cert_score = cert_match_pct * 100
  // Linear: 2 of 3 required certs = 67
  
  years_score = years_met ? 100 : max(30, (actual_years / required_years) * 100)
  // Proportional if under, with a floor of 30
  
  hard_requirements_score = avg(education_score, cert_score, years_score)
  // Equal weight within this category, since all are "hard" requirements
  // If a subcategory has no requirements (e.g., no certs listed), 
  // it scores 100 and effectively drops out
```

**Output:**
```typescript
interface HardRequirementsResult {
  score: number;                       // 0-100
  education: {
    met: boolean;
    required: EducationRequirement[];
    candidate_has: EducationEntry[];    // From resume
    score: number;
  };
  certifications: {
    matched: string[];
    missing: string[];
    total_required: number;
    score: number;
  };
  years_of_experience: {
    met: boolean;
    required_min: number | null;
    candidate_has: number;
    score: number;
  };
}
```

#### 3.2.4 Resume Quality Score (Weight: 10%)

**Type:** Fully Deterministic

**Logic:**
Assess structural quality of the resume regardless of the specific JD.

```
Checks:
  1. Has professional summary?
     - exists and length >= 50 chars → +20 points
     - missing or too short → 0 points
     
  2. Quantified achievements (numbers, %, $, metrics in bullets)?
     - Count bullets containing quantified results
     - quantified_pct = quantified_bullets / total_bullets
     - Score: quantified_pct * 25 (max 25 points)
     
  3. Bullet density per role:
     - avg_bullets = total_bullets / total_experience_entries
     - avg_bullets >= 4 → +20 points
     - avg_bullets >= 2 → +10 points  
     - avg_bullets < 2 → 0 points
     
  4. Skills section populated?
     - >= 8 skills → +15 points
     - >= 4 skills → +10 points
     - < 4 skills → +5 points
     - empty → 0 points
     
  5. Contact info complete?
     - Has email + phone + location → +10 points
     - Has LinkedIn → +5 points
     - Missing critical fields → proportional deduction
     
  6. Bullet quality — action verbs:
     - Count bullets starting with strong action verbs
     - action_verb_pct >= 80% → +10 points
     - action_verb_pct >= 50% → +5 points
     - Below → 0 points

  quality_score = sum of all check points (max 100)
```

**Action Verb Reference List (for check #6):**
```typescript
const ACTION_VERBS = [
  // Leadership
  "led", "managed", "directed", "coordinated", "oversaw", "supervised",
  "spearheaded", "championed", "mentored", "guided",
  // Achievement
  "achieved", "delivered", "completed", "exceeded", "surpassed", 
  "accomplished", "attained",
  // Creation
  "built", "created", "designed", "developed", "established", 
  "implemented", "launched", "initiated", "introduced", "founded",
  // Improvement
  "improved", "enhanced", "optimized", "streamlined", "reduced",
  "increased", "accelerated", "automated", "modernized", "revamped",
  // Technical
  "engineered", "architected", "deployed", "configured", "integrated",
  "migrated", "refactored", "debugged", "programmed",
  // Analysis
  "analyzed", "evaluated", "assessed", "researched", "identified",
  "investigated", "diagnosed", "audited", "measured",
  // Communication
  "presented", "published", "authored", "documented", "reported",
  "communicated", "negotiated", "collaborated",
];
```

**Output:**
```typescript
interface ResumeQualityResult {
  score: number;                       // 0-100
  checks: {
    has_summary: { passed: boolean; score: number; detail: string };
    quantified_achievements: { 
      passed: boolean; score: number; 
      quantified_count: number; total_bullets: number;
      unquantified_bullets: BulletReference[]; // For targeted suggestions
    };
    bullet_density: { passed: boolean; score: number; avg_bullets: number };
    skills_populated: { passed: boolean; score: number; count: number };
    contact_complete: { passed: boolean; score: number; missing_fields: string[] };
    action_verbs: { 
      passed: boolean; score: number; 
      weak_bullets: BulletReference[]; // Bullets not starting with action verbs
    };
  };
}

interface BulletReference {
  experience_index: number;
  bullet_index: number;
  text: string;
}
```

#### 3.2.5 Skills Depth Score (Weight: 10%)

**Type:** Deterministic

**Logic:**
A skill listed in the skills section is less valuable than a skill demonstrated in context (experience bullets). This dimension rewards skills that are "proven" rather than just "claimed."

```
For each matched keyword (from dimension 3.2.1):
  - Found ONLY in skills section → "claimed" (1 point)
  - Found in experience/project bullets → "demonstrated" (3 points)
  - Found in experience bullets WITH quantified result → "proven" (5 points)

skills_depth_score = (total_points / max_possible_points) * 100

Where max_possible_points = total_matched_skills * 5
// Best case: every skill is proven with quantified results
```

**Output:**
```typescript
interface SkillsDepthResult {
  score: number;                       // 0-100
  skill_evidence: SkillEvidence[];
}

interface SkillEvidence {
  skill_name: string;
  evidence_level: "claimed" | "demonstrated" | "proven";
  locations: MatchLocation[];          // Reuse from keyword matching
  points: number;
}
```

---

## 4. Stage 3 — Score Computation

### 4.1 Purpose

Combine all sub-scores into a single ATS score (0-100) using a weighted formula. This stage is purely deterministic — no AI calls.

### 4.2 Weighting

```typescript
const SCORE_WEIGHTS = {
  keyword_match: 0.35,
  experience_relevance: 0.25,
  hard_requirements: 0.20,
  resume_quality: 0.10,
  skills_depth: 0.10,
} as const;
```

### 4.3 Computation

```typescript
function computeATSScore(results: {
  keyword_match: KeywordMatchResult;
  experience_relevance: ExperienceRelevanceResult;
  hard_requirements: HardRequirementsResult;
  resume_quality: ResumeQualityResult;
  skills_depth: SkillsDepthResult;
}): ATSScoreResult {
  
  const weighted_score = 
    results.keyword_match.score * SCORE_WEIGHTS.keyword_match +
    results.experience_relevance.score * SCORE_WEIGHTS.experience_relevance +
    results.hard_requirements.score * SCORE_WEIGHTS.hard_requirements +
    results.resume_quality.score * SCORE_WEIGHTS.resume_quality +
    results.skills_depth.score * SCORE_WEIGHTS.skills_depth;
  
  const final_score = Math.round(weighted_score);
  
  // Determine which dimensions are dragging the score down
  const dimension_scores = [
    { name: "keyword_match", score: results.keyword_match.score, weight: 0.35 },
    { name: "experience_relevance", score: results.experience_relevance.score, weight: 0.25 },
    { name: "hard_requirements", score: results.hard_requirements.score, weight: 0.20 },
    { name: "resume_quality", score: results.resume_quality.score, weight: 0.10 },
    { name: "skills_depth", score: results.skills_depth.score, weight: 0.10 },
  ];
  
  // Sort by impact (how much this dimension is reducing the total)
  const weakest_areas = dimension_scores
    .map(d => ({
      ...d,
      impact: (100 - d.score) * d.weight, // Points being "lost" due to this dimension
    }))
    .sort((a, b) => b.impact - a.impact);
  
  return {
    final_score,
    dimension_scores,
    weakest_areas,
    score_tier: final_score >= 80 ? "excellent" :
                final_score >= 65 ? "good" :
                final_score >= 45 ? "needs_work" : "poor",
  };
}
```

### 4.4 Score Tier Definitions

| Tier | Score Range | Color | Meaning |
|------|------------|-------|---------|
| Excellent | 80-100 | Green | Strong match — likely to pass ATS and get reviewed by a human |
| Good | 65-79 | Yellow-Green | Decent match — some gaps but competitive |
| Needs Work | 45-64 | Yellow-Orange | Significant gaps — optimize before applying |
| Poor | 0-44 | Red | Major mismatch — consider if this role is the right fit |

### 4.5 Output Schema

```typescript
interface ATSScoreResult {
  final_score: number;                 // 0-100
  score_tier: "excellent" | "good" | "needs_work" | "poor";
  dimension_scores: DimensionScore[];
  weakest_areas: DimensionImpact[];
  
  // All detailed sub-results for drill-down UI
  details: {
    keyword_match: KeywordMatchResult;
    experience_relevance: ExperienceRelevanceResult;
    hard_requirements: HardRequirementsResult;
    resume_quality: ResumeQualityResult;
    skills_depth: SkillsDepthResult;
  };
}

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  weighted_contribution: number;       // score * weight
}

interface DimensionImpact {
  name: string;
  score: number;
  weight: number;
  impact: number;                      // Points being lost
}
```

---

## 5. Stage 4 — Recommendations & Rewrites

### 5.1 Purpose

Using the specific gaps identified in Stages 2-3, generate targeted, actionable suggestions. Because the AI now knows exactly what's wrong (not guessing), the recommendations are dramatically more focused and useful.

### 5.2 Input to Stage 4

Stage 4 receives a **gap summary** assembled from Stages 2-3:

```typescript
interface GapSummary {
  // From keyword matching
  missing_required_skills: SkillRequirement[];
  missing_preferred_skills: SkillRequirement[];
  
  // From experience relevance  
  weakest_experience_entries: ExperienceScore[]; // Bottom 2-3 by relevance
  seniority_gap: string | null;
  
  // From hard requirements
  missing_certifications: string[];
  education_gap: string | null;        // e.g., "JD requires Master's, candidate has Bachelor's"
  years_gap: string | null;            // e.g., "JD requires 5+ years, candidate has 3"
  
  // From resume quality
  unquantified_bullets: BulletReference[];
  weak_verb_bullets: BulletReference[];
  missing_summary: boolean;
  
  // From skills depth
  claimed_only_skills: SkillEvidence[]; // Skills only in skills section, not demonstrated
  
  // Context
  jd_profile: JDProfile;
  resume: ResumeData;
}
```

### 5.3 AI Prompt — Recommendations

```
SYSTEM:
You are a resume optimization specialist. You have been given a detailed 
gap analysis between a resume and a job description. Generate specific, 
actionable rewrite suggestions for the resume bullets that would have the 
highest impact on the ATS score.

Rules:
- Only suggest rewrites for bullets that need improvement.
- Each rewrite MUST address at least one missing keyword naturally.
- Do NOT keyword-stuff — the rewrite must read naturally and be truthful 
  to the candidate's actual experience.
- Prioritize addressing REQUIRED missing skills over preferred ones.
- For bullets lacking quantification, suggest adding specific metrics 
  (the candidate can fill in real numbers).
- For bullets with weak action verbs, start with a stronger one.
- If the summary is missing or weak, suggest a new one targeting this role.
- Return ONLY valid JSON.

USER:
GAP ANALYSIS:
{{gap_summary as JSON}}

CURRENT RESUME:
{{resume as JSON}}

TARGET JD PROFILE:
{{jd_profile as JSON}}

Generate rewrite suggestions. Return JSON:
{
  "rewrite_suggestions": [
    {
      "id": "<uuid>",
      "type": "bullet_rewrite" | "summary_rewrite" | "skill_addition",
      "section": "experience" | "summary" | "skills" | "projects",
      "experience_index": <number | null>,
      "bullet_index": <number | null>,
      "original_text": "the current text",
      "suggested_text": "the improved version",
      "keywords_addressed": ["keyword1", "keyword2"],
      "improvement_types": ["missing_keyword" | "quantification" | "action_verb" | "relevance"],
      "impact_explanation": "1 sentence on why this helps",
      "estimated_score_impact": "high" | "medium" | "low"
    }
  ],
  "summary_suggestion": {
    "needed": true/false,
    "current": "current summary or null",
    "suggested": "new summary text targeting this role",
    "keywords_addressed": ["keyword1", "keyword2"]
  },
  "skills_to_add": [
    {
      "name": "skill name",
      "reason": "why this should be added",
      "importance": "required" | "preferred"
    }
  ],
  "overall_strategy": "2-3 sentence high-level recommendation"
}
```

### 5.4 Model Selection

- **Recommended:** `gpt-4o` — Rewrites require high-quality writing and nuance.
- **Token budget:** ~2000-3000 output tokens.

### 5.5 Output Schema

```typescript
interface RecommendationsResult {
  rewrite_suggestions: RewriteSuggestion[];
  summary_suggestion: SummarySuggestion | null;
  skills_to_add: SkillAddition[];
  overall_strategy: string;
}

interface RewriteSuggestion {
  id: string;
  type: "bullet_rewrite" | "summary_rewrite" | "skill_addition";
  section: "experience" | "summary" | "skills" | "projects";
  experience_index: number | null;
  bullet_index: number | null;
  original_text: string;
  suggested_text: string;
  keywords_addressed: string[];
  improvement_types: ImprovementType[];
  impact_explanation: string;
  estimated_score_impact: "high" | "medium" | "low";
  accepted: boolean;                   // UI state, default false
}

type ImprovementType = "missing_keyword" | "quantification" | "action_verb" | "relevance";

interface SummarySuggestion {
  needed: boolean;
  current: string | null;
  suggested: string;
  keywords_addressed: string[];
}

interface SkillAddition {
  name: string;
  reason: string;
  importance: "required" | "preferred";
}
```

---

## 6. Unified Data Model — `ai_analysis` Table Update

The existing `ai_analysis` table needs to be expanded to store all stage results:

```sql
-- Option A: Extend existing table
ALTER TABLE ai_analysis ADD COLUMN scoring_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE ai_analysis ADD COLUMN dimension_scores JSONB;
ALTER TABLE ai_analysis ADD COLUMN keyword_match_detail JSONB;
ALTER TABLE ai_analysis ADD COLUMN experience_relevance_detail JSONB;
ALTER TABLE ai_analysis ADD COLUMN hard_requirements_detail JSONB;
ALTER TABLE ai_analysis ADD COLUMN resume_quality_detail JSONB;
ALTER TABLE ai_analysis ADD COLUMN skills_depth_detail JSONB;
ALTER TABLE ai_analysis ADD COLUMN gap_summary JSONB;
ALTER TABLE ai_analysis ADD COLUMN recommendations JSONB;

-- Option B (preferred): Create new table, deprecate old one
CREATE TABLE ats_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  jd_profile_id UUID NOT NULL REFERENCES jd_profiles(id),
  
  -- Top-level score
  ats_score INTEGER NOT NULL,          -- 0-100
  score_tier TEXT NOT NULL,            -- excellent | good | needs_work | poor
  scoring_version INTEGER NOT NULL DEFAULT 1,
  
  -- Dimension scores (summary)
  dimension_scores JSONB NOT NULL,     -- DimensionScore[]
  weakest_areas JSONB NOT NULL,        -- DimensionImpact[]
  
  -- Detailed sub-results
  keyword_match JSONB NOT NULL,        -- KeywordMatchResult
  experience_relevance JSONB NOT NULL, -- ExperienceRelevanceResult
  hard_requirements JSONB NOT NULL,    -- HardRequirementsResult
  resume_quality JSONB NOT NULL,       -- ResumeQualityResult
  skills_depth JSONB NOT NULL,         -- SkillsDepthResult
  
  -- Recommendations (Stage 4)
  recommendations JSONB NOT NULL,      -- RecommendationsResult
  
  -- Metadata
  ai_models_used JSONB NOT NULL,       -- { stage1: "gpt-4o-mini", stage2_experience: "gpt-4o", stage4: "gpt-4o" }
  total_ai_tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 7. API Design

### 7.1 Endpoints

```
POST /api/ai/analyze-jd
  Input: { job_application_id: string }
  Runs: Stage 1 only
  Returns: JDProfile
  When: Called on job application create/update

PUT /api/jd-profile/:id
  Input: Partial<JDProfile> (user edits)
  Returns: Updated JDProfile
  When: User edits extracted requirements

POST /api/ai/analyze-resume
  Input: { job_application_id: string }
  Runs: Stages 2 → 3 → 4 (uses stored JD Profile from Stage 1)
  Returns: ATSScoreResult + RecommendationsResult
  When: User clicks "Analyze" button

POST /api/ai/accept-rewrite
  Input: { analysis_id: string, suggestion_id: string }
  Runs: Applies rewrite to resume_variant
  Returns: Updated resume variant
  When: User clicks "Accept" on a suggestion

POST /api/ai/accept-all-rewrites
  Input: { analysis_id: string }
  Runs: Applies all pending rewrites to resume_variant
  Returns: Updated resume variant
  When: User clicks "Accept All"
```

### 7.2 Processing Flow — Analyze Resume

```typescript
async function analyzeResume(jobApplicationId: string) {
  // 1. Fetch inputs
  const jdProfile = await getJDProfile(jobApplicationId);
  const resume = await getResumeVariant(jobApplicationId);
  
  // 2. Stage 2a: Keyword Matching (deterministic)
  const keywordResult = computeKeywordMatch(resume, jdProfile);
  
  // 3. Stage 2b: Experience Relevance (AI call)
  const experienceResult = await assessExperienceRelevance(resume, jdProfile);
  
  // 4. Stage 2c: Hard Requirements (deterministic)
  const hardReqResult = computeHardRequirements(resume, jdProfile);
  
  // 5. Stage 2d: Resume Quality (deterministic)
  const qualityResult = computeResumeQuality(resume);
  
  // 6. Stage 2e: Skills Depth (deterministic)
  const depthResult = computeSkillsDepth(resume, keywordResult);
  
  // 7. Stage 3: Compute final score (deterministic)
  const scoreResult = computeATSScore({
    keyword_match: keywordResult,
    experience_relevance: experienceResult,
    hard_requirements: hardReqResult,
    resume_quality: qualityResult,
    skills_depth: depthResult,
  });
  
  // 8. Assemble gap summary
  const gapSummary = assembleGapSummary(scoreResult);
  
  // 9. Stage 4: Generate recommendations (AI call)
  const recommendations = await generateRecommendations(gapSummary, resume, jdProfile);
  
  // 10. Save everything
  const analysis = await saveAnalysis({
    job_application_id: jobApplicationId,
    jd_profile_id: jdProfile.id,
    ...scoreResult,
    recommendations,
  });
  
  return analysis;
}
```

---

## 8. UI Changes Summary

### 8.1 Application Detail Page — New "Job Requirements" Tab

Shows Stage 1 output. Editable. Automatically populated when JD is saved.

### 8.2 Analysis Results Page — Redesigned

**Top Section:**
- Overall ATS score gauge (0-100) with tier label and color
- Score breakdown bar chart showing all 5 dimensions with their individual scores and weights

**Dimension Cards (expandable):**
Each dimension gets its own card that shows the score and can be expanded for details:

1. **Keyword Match (35%)** — Matched keywords (green chips), missing keywords (red chips), categorized by required/preferred
2. **Experience Relevance (25%)** — Each experience entry with a mini relevance bar, seniority match indicator
3. **Hard Requirements (20%)** — Checklist style: education ✓/✗, certifications ✓/✗, years ✓/✗
4. **Resume Quality (10%)** — Checklist of quality factors with pass/fail
5. **Skills Depth (10%)** — Skills categorized by evidence level (claimed/demonstrated/proven)

**Recommendations Section:**
- Priority-ordered rewrite suggestions with Accept/Reject
- Each shows which dimension it improves and which keywords it addresses
- Skills to add section
- Summary suggestion (if needed)

---

## 9. Migration Strategy

### 9.1 Phase 1 — Build JD Analysis (Stage 1)
- Create `jd_profiles` table
- Build `/api/ai/analyze-jd` endpoint
- Build JD Profile UI (display + edit)
- Wire to job application create/update flow

### 9.2 Phase 2 — Build Scoring Engine (Stages 2-3)
- Implement deterministic scoring functions (keyword, hard req, quality, depth)
- Build experience relevance AI prompt
- Implement score computation
- Create `ats_analysis` table

### 9.3 Phase 3 — Build Recommendations (Stage 4)
- Implement gap summary assembler
- Build recommendations AI prompt
- Wire Accept/Reject to resume variant updates

### 9.4 Phase 4 — UI Redesign
- Redesign analysis results page with dimension breakdown
- Add JD Profile tab to application detail
- Update score gauge to show dimension breakdown

### 9.5 Backward Compatibility
- Keep old `ai_analysis` table and endpoint functional during migration
- New analysis uses `ats_analysis` table with `scoring_version = 1`
- Old analyses remain viewable but cannot be re-run with old system

---

## 10. Cost & Performance Estimates

### AI Calls Per Full Analysis

| Stage | Model | Calls | Est. Tokens | Est. Cost |
|-------|-------|-------|-------------|-----------|
| Stage 1 (JD Analysis) | gpt-4o-mini | 1 (once per JD) | ~1500 out | ~$0.002 |
| Stage 2b (Experience) | gpt-4o | 1 | ~800 out | ~$0.02 |
| Stage 4 (Recommendations) | gpt-4o | 1 | ~2500 out | ~$0.06 |
| **Total per analysis** | — | **2-3** | ~4800 | **~$0.08** |

Compared to current system: 1 call to gpt-4o with ~3000 output tokens (~$0.07). The new system costs roughly the same but produces dramatically better results.

### Performance

- Stage 1: ~3-5 seconds (one-time)
- Stages 2-3 deterministic: <200ms
- Stage 2b AI call: ~3-5 seconds
- Stage 4 AI call: ~5-8 seconds
- **Total for re-analysis: ~8-13 seconds** (vs. current ~5-8 seconds for lower quality)

---

## 11. Future Versions (V2+ Ideas — Not In Scope)

- **Score history tracking** — Show how the score changes as user accepts rewrites over time
- **Industry benchmarking** — "Your score is higher than 72% of applicants for similar roles"
- **Cover letter generation** — Using the JD Profile + resume gap analysis
- **Batch analysis** — Score one resume against multiple JDs simultaneously
- **Custom weights** — Let users adjust dimension weights based on what they know matters
- **ATS-specific profiles** — Different scoring adjustments for Workday vs. Greenhouse vs. Lever
- **Interview prep** — Use gap analysis to predict likely interview questions