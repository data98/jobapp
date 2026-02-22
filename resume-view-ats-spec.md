# Feature Specification: Integrated Resume View with ATS Scoring

## Overview

Replace the current separate "AI Analysis" and "Resume Variant Editor" pages with a single unified **Resume View** page per job application. This page combines resume editing, design customization, live preview, and AI-powered job matching with granular ATS scoring — all in one split-pane interface.

**Route:** `/[locale]/(dashboard)/applications/[id]/resume/page.tsx`

**Layout:** Left panel (content + tabs) | Right panel (live resume preview, always visible)

---

## Core Concept: The Ideal Resume Benchmark

When a job application is first analyzed (or when the user triggers analysis), the system generates an **Ideal Resume** — a phantom "perfect 100-score" resume constructed entirely from the job description. This ideal resume represents what a flawless candidate's resume would look like for this specific role. It is generated once by AI and stored in the database alongside the job application.

### What the Ideal Resume Contains

The AI constructs a complete, realistic resume with:

- **Ideal professional summary** — perfectly tailored to the role's requirements, tone, and seniority level
- **Ideal experience bullets** — action-verb-led, quantified achievements that map 1:1 to every job requirement
- **Ideal skills list** — every keyword, technology, methodology, and tool mentioned or implied in the JD
- **Ideal education** — the degree level, field, and certifications the JD requests
- **Ideal section ordering** — sections arranged in the optimal order for this role type (e.g., skills-first for technical roles, experience-first for senior leadership roles)
- **Keyword map** — a complete list of keywords/phrases extracted from the JD, categorized by type:
  - `hard_skills` — technologies, tools, platforms, languages (e.g., "Python", "Salesforce", "Google Analytics")
  - `soft_skills` — interpersonal and leadership skills (e.g., "cross-functional collaboration", "stakeholder management")
  - `industry_terms` — domain-specific jargon (e.g., "brand visibility", "demand generation", "CAC/LTV")
  - `qualifications` — degrees, certifications, years of experience (e.g., "MBA", "10+ years", "PMP certified")
  - `action_verbs` — strong verbs the JD uses or implies (e.g., "spearheaded", "optimized", "scaled")

### How It Is Used

The ideal resume is **never shown directly to the user** as a full document. Instead, it serves as the scoring benchmark:

- Each metric (Keywords, Measurable Results, Structure) compares the user's current resume view against the ideal
- Suggestions in the Job Matching tab reference gaps between the user's resume and the ideal
- The ideal keyword map drives the "missing keywords" and "keyword coverage" calculations
- The ideal section order drives the structure score's section-ordering component

### Storage

```sql
-- New column on ai_analysis table (or new table)
alter table ai_analysis add column ideal_resume jsonb;
-- Shape:
-- {
--   "summary": "string",
--   "experience_bullets": ["string", ...],
--   "skills": ["string", ...],
--   "education": [{ "degree": "string", "field": "string" }],
--   "section_order": ["experience", "skills", "education", ...],
--   "keyword_map": {
--     "hard_skills": [{ "keyword": "string", "importance": "critical|important|nice_to_have", "frequency": number }],
--     "soft_skills": [{ "keyword": "string", "importance": "...", "frequency": number }],
--     "industry_terms": [...],
--     "qualifications": [...],
--     "action_verbs": [...]
--   },
--   "ideal_measurable_results_count": number,
--   "ideal_structure": {
--     "section_order": ["string"],
--     "bullet_count_per_experience": number,
--     "has_summary": true,
--     "summary_length_range": [min_words, max_words],
--     "total_page_count": 1 | 2
--   }
-- }
```

### Generation

**When:** On first "Analyze" action for a job application, or when user clicks "Regenerate Analysis" (e.g., after editing the job description).

**AI Prompt (ideal resume generation):**

```
You are an expert ATS (Applicant Tracking System) analyst and professional resume writer.

Given the following job description, construct the IDEAL resume that would score a perfect 100/100 on any ATS system for this role. This ideal resume should represent a perfectly qualified candidate.

Return ONLY valid JSON matching this schema:

{
  "summary": "<ideal professional summary, 2-4 sentences>",
  "experience_bullets": [
    "<ideal bullet point with measurable result>",
    ...
  ],
  "skills": ["<every relevant skill/keyword>", ...],
  "education": [
    { "degree": "<ideal degree>", "field": "<ideal field>" }
  ],
  "section_order": ["experience", "skills", "education", "certifications", "projects", "languages"],
  "keyword_map": {
    "hard_skills": [
      { "keyword": "<skill>", "importance": "critical|important|nice_to_have", "frequency": <times mentioned in JD> }
    ],
    "soft_skills": [...],
    "industry_terms": [...],
    "qualifications": [...],
    "action_verbs": [...]
  },
  "ideal_measurable_results_count": <number of quantified achievements expected>,
  "ideal_structure": {
    "section_order": ["<optimal section ordering>"],
    "bullet_count_per_experience": <ideal number>,
    "has_summary": true,
    "summary_length_range": [<min_words>, <max_words>],
    "total_page_count": <1 or 2 based on seniority>
  }
}

Rules:
- Extract EVERY keyword, technology, tool, methodology, and qualification from the JD
- Classify each keyword by importance: "critical" (explicitly required), "important" (mentioned as preferred), "nice_to_have" (implied or related)
- Experience bullets must all contain measurable results (numbers, percentages, dollar amounts)
- Section order should reflect what ATS systems and hiring managers for this role type expect to see first
- The ideal bullet count should reflect the seniority level (entry: 2-3, mid: 3-4, senior: 4-6 per role)

JOB DESCRIPTION:
{{job_description}}
```

---

## ATS Scoring System

The ATS score is a composite of three sub-metrics, each scored 0-100, then weighted:

| Metric | Weight | What It Measures |
|---|---|---|
| **Keyword Usage** | 40% | Coverage of keywords from the ideal resume's keyword map |
| **Measurable Results** | 40% | Quantified achievements in experience bullets and summary |
| **Resume Structure** | 20% | Section order, formatting, section completeness, length |

**Composite ATS Score** = (keyword_score × 0.40) + (measurable_results_score × 0.40) + (structure_score × 0.20)

### Metric 1: Keyword Usage (40%)

Compares keywords found in the current resume view against the ideal resume's keyword map.

**Scoring formula:**

```
keyword_score = weighted_matches / weighted_total × 100

Where:
- critical keywords matched × 3
- important keywords matched × 2  
- nice_to_have keywords matched × 1
- weighted_total = (total_critical × 3) + (total_important × 2) + (total_nice_to_have × 1)
```

**Matching rules:**
- Case-insensitive matching
- Stemming-aware (e.g., "managing" matches "management")
- Phrase matching for multi-word keywords (e.g., "cross-functional collaboration")
- Synonyms should be considered (e.g., "led" ≈ "spearheaded" ≈ "directed") — the AI analysis should flag synonym matches as partial credit
- Keywords found in skills section, experience bullets, summary, and project descriptions all count
- A keyword used in multiple sections does NOT count multiple times (binary: present or not)

**What the user sees:**
- Keyword coverage percentage (e.g., "72% keyword coverage")
- List of matched keywords (green badges)
- List of missing keywords (red badges), sorted by importance (critical first)
- For each missing keyword: whether it exists in the master resume but wasn't included in this view

### Metric 2: Measurable Results (40%)

Evaluates whether experience bullets and the professional summary contain quantified achievements.

**What counts as a measurable result:**
- Specific numbers: "Managed a team of **12** engineers"
- Percentages: "Increased conversion rates by **35%**"
- Dollar/currency amounts: "Managed a **$2.5M** marketing budget"
- Timeframes as achievements: "Reduced deployment time from **2 weeks to 3 days**"
- Scale indicators: "Served **50,000+** daily active users"

**What does NOT count:**
- Vague quantities: "managed several projects", "worked with multiple teams"
- Dates (start/end dates of employment)
- Years of experience in summary (e.g., "10+ years of experience")

**Scoring formula:**

```
measurable_results_score = (bullets_with_metrics / ideal_measurable_results_count) × 100
Capped at 100 (overqualified resumes don't get bonus points)
```

**How to count:**
- Each experience bullet is evaluated: does it contain at least one measurable result?
- The professional summary is evaluated: does it contain at least one quantified achievement?
- The ideal_measurable_results_count from the ideal resume sets the target

**What the user sees:**
- Results ratio (e.g., "8 of 12 bullets have measurable results")
- Per-bullet indicators: green checkmark (has metric) or yellow warning (no metric)
- For bullets without metrics: AI suggestion to add a quantified achievement (with estimated score impact)

### Metric 3: Resume Structure (20%)

Evaluates the overall structure, formatting, and organization of the resume.

**Sub-components (each contributes proportionally to the structure score):**

| Sub-component | Weight within Structure | What It Checks |
|---|---|---|
| Section order | 30% | How closely the current section order matches the ideal |
| Section completeness | 25% | Are all recommended sections present? |
| Summary quality | 15% | Is a summary present? Is it within the ideal length range? |
| Bullet count | 15% | Does each experience entry have the ideal number of bullets? |
| Page length | 15% | Is the resume the ideal length (1 or 2 pages based on seniority)? |

**Section order scoring:**

```
section_order_score = 1 - (levenshtein_distance(current_order, ideal_order) / max_possible_distance) × 100
```

Where `current_order` and `ideal_order` are arrays of section names in their display order. This means:
- Perfect match = 100
- Every section out of place reduces the score
- Completely reversed = near 0

**Section completeness scoring:**

The ideal resume specifies which sections should be present. For each missing section that the ideal recommends, deduct points proportionally:

```
completeness_score = (present_recommended_sections / total_recommended_sections) × 100
```

**Summary quality scoring:**

```
if no summary present: 0
if summary present but too short (< min_words): 50
if summary present but too long (> max_words): 70
if summary present and within ideal range: 100
```

**Bullet count scoring:**

```
For each experience entry:
  if bullet_count == ideal_count: 100
  if bullet_count < ideal_count: (bullet_count / ideal_count) × 100
  if bullet_count > ideal_count: max(70, 100 - (excess × 10))

bullet_score = average across all experience entries
```

**Page length scoring:**

```
if actual_pages == ideal_pages: 100
if actual_pages == ideal_pages + 1: 60 (too long)
if actual_pages == ideal_pages - 1: 40 (too short, likely missing content)
if actual_pages > ideal_pages + 1: 20
```

**What the user sees:**
- Structure score breakdown showing each sub-component
- Specific actionable items: "Move Skills section above Education for +5 points", "Add 2 more bullets to your NVIDIA experience for +3 points"

---

## Maximum Achievable Score

The **maximum achievable score** is determined by comparing the user's master resume (all available data) against the ideal resume. This represents the ceiling — what's possible if the user includes every relevant detail from their master resume.

**Calculation:**

Run the three scoring metrics against a hypothetical "best possible variant" constructed by:
1. Including all master resume keywords that match the ideal keyword map → max keyword score
2. Counting all measurable results across all master resume bullets → max measurable results score  
3. Assuming optimal section ordering and all sections included → max structure score

**Use cases for maximum achievable score:**
- Show the user: "Your current score is 62/100. With your experience, you can reach up to 78/100."
- If max achievable < 70: suggest the user is underqualified — highlight which qualifications they're missing entirely
- If max achievable > 90: the user is well-qualified — focus on optimization
- The gap between current score and max achievable = room for improvement through resume optimization
- The gap between max achievable and 100 = gaps in actual qualifications (can't be fixed through resume editing alone)

**Display:**
- Circular gauge showing current score with a marker showing max achievable
- Example: gauge filled to 62 (current), with a tick mark at 78 (max achievable), out of 100

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: [Job Title] at [Company] | Status dropdown | Export PDF button  │
├───────────────────────────────────┬─────────────────────────────────────┤
│                                   │                                     │
│  ┌─ Tabs ──────────────────────┐  │                                     │
│  │ Preview │ Design │ Job Match│  │       Live Resume Preview           │
│  └─────────────────────────────┘  │       (always visible,              │
│                                   │        updates in real-time         │
│  Tab Content Area                 │        as user edits left panel)    │
│  (scrollable, full height)        │                                     │
│                                   │       Template: [selector]          │
│                                   │       Zoom: [- 100% +]             │
│                                   │                                     │
│                                   │                                     │
├───────────────────────────────────┴─────────────────────────────────────┤
│ Bottom bar: ATS Score [62/100] | Max: 78 | Keywords: 72% | Results: 8/12│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Preview (Resume Content Editor)

This tab displays the resume content in an editable form. It mirrors the current `VariantEditor` functionality but in a more streamlined single-column form.

### Sections (in display order, reorderable from Design tab):

**Personal Information**
- Full Name, Email, Phone, Location, LinkedIn, Portfolio URL
- All fields editable inline
- Changes reflect immediately in the right-side preview

**Professional Summary**
- Textarea, editable
- Character/word count shown
- Visual indicator: green (within ideal range), yellow (too short/long), red (missing)

**Work Experience**
- For each entry: Company, Title, Location, Start Date, End Date, Current toggle
- Bullet points: editable list with add/remove
- Each bullet shows a measurable-result indicator (green ✓ / yellow ⚠)
- "Add Experience" button at bottom
- Drag handles to reorder experience entries

**Education**
- Institution, Degree, Field of Study, Start Date, End Date, GPA
- "Add Education" button

**Skills**
- Tag/chip input for each skill
- Skills are displayed as removable badges
- Color-coded: green (matches keyword map critical), blue (matches important), gray (no match / nice-to-have)
- "Add from Master Resume" button — shows skills from master resume not yet included, with keyword-match highlighting

**Languages**
- Language, Proficiency level
- "Add Language" button

**Certifications**
- Name, Issuer, Date, URL
- "Add Certification" button

**Projects**
- Name, Description, URL, Bullet points
- "Add Project" button

### Key Behaviors:

- Every edit updates the right-side preview in real-time
- Every edit triggers a client-side ATS score recalculation (debounced, ~500ms after last keystroke)
- A "Save" button persists changes to the `resume_variant` record
- A "Reset to Master" button reverts the variant to master resume data
- An "Add from Master Resume" contextual action lets users pull specific items (skills, experience entries, etc.) from their master resume that aren't in the current view
- All text fields support manual entry — the user can type anything, not just select from master resume

---

## Tab 2: Design

This tab has two sub-tabs: **Presentation** and **Sections**.

### Sub-tab: Presentation

Controls visual appearance of the resume. All changes reflect in the right-side preview in real-time.

**Template Selector:**
- Thumbnail cards for each template (Classic, Modern, Minimal)
- Clicking selects and immediately updates preview

**Typography:**
- Font family (dropdown: serif options, sans-serif options)
- Font size (slider or input: 9pt–12pt for body text)
- Line height (slider: 1.0–2.0)
- List line height (separate control for bullet point spacing)

**Colors:**
- Accent color (color picker) — used for section headings, name, decorative elements
- Text color (typically black, but allow dark gray options)

**Spacing:**
- Section spacing (gap between sections: compact / normal / relaxed)
- Margins (top, bottom, left, right — or a simple preset: narrow / normal / wide)

**These design settings are stored on the resume_variant:**

```sql
alter table resume_variant add column design_settings jsonb not null default '{}';
-- Shape:
-- {
--   "font_family": "string",
--   "font_size": number,
--   "line_height": number,
--   "list_line_height": number,
--   "accent_color": "#hexcolor",
--   "text_color": "#hexcolor",
--   "section_spacing": "compact|normal|relaxed",
--   "margins": { "top": number, "bottom": number, "left": number, "right": number }
-- }
```

### Sub-tab: Sections

Controls which sections are visible and their display order.

**Section list (drag-and-drop reorderable):**
- Each section shown as a row with:
  - Drag handle (⠿)
  - Section name (e.g., "Skills", "Education")
  - Toggle switch (show/hide)
  - ATS impact indicator: if hiding a section reduces the ATS score, show a warning badge (e.g., "−8 pts")

**Section order changes affect the ATS Structure score** (section ordering sub-component). When the user reorders, the score updates in real-time.

**The ideal section order is shown as a reference:**
- A small note or ghost ordering showing "Recommended order for this role: Experience → Skills → Education → ..."
- Sections out of ideal order are subtly highlighted

**Stored in resume_variant:**
- `included_sections` (existing field — array of visible section names)
- `section_order` (new field — ordered array of all section names, including hidden ones)

```sql
alter table resume_variant add column section_order jsonb not null default '[]';
-- Shape: ["personal_info", "experience", "skills", "education", "languages", "certifications", "projects"]
```

---

## Tab 3: Job Matching (ATS Analysis + Suggestions)

This is the core intelligence tab. It replaces the old standalone AI Analysis page and integrates scoring with actionable suggestions.

### Layout:

```
┌──────────────────────────────────────────┐
│ ATS Score Gauge                          │
│ ┌──────────────────┐                     │
│ │   62 / 100       │ Max achievable: 78  │
│ │  ████████░░░░░░  │                     │
│ └──────────────────┘                     │
│                                          │
│ ┌─ Metric Breakdown ──────────────────┐  │
│ │ Keywords:   72/100  ████████░░ 40%  │  │
│ │ Results:    58/100  ██████░░░░ 40%  │  │
│ │ Structure:  80/100  █████████░ 20%  │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ ─── Suggestions ───────────────────────  │
│                                          │
│ [Filter: All | Keywords | Results |      │
│  Structure]                              │
│                                          │
│ ┌─ Suggestion Card ──────────────────┐   │
│ │ 🔑 Add "demand generation" keyword │   │
│ │ Section: Skills                    │   │
│ │ Impact: +3 pts (keyword score)     │   │
│ │ [Accept] [Dismiss]                 │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌─ Suggestion Card ──────────────────┐   │
│ │ ✏️ Rewrite bullet for measurable   │   │
│ │    result                          │   │
│ │ Original: "Led marketing campaigns │   │
│ │   to promote NVIDIA products"      │   │
│ │ Suggested: "Led 15+ marketing      │   │
│ │   campaigns that drove a 28%       │   │
│ │   increase in brand engagement     │   │
│ │   across digital channels"         │   │
│ │ Impact: +4 pts (results + keywords)│   │
│ │ Keywords addressed: [brand         │   │
│ │   engagement] [digital channels]   │   │
│ │ [Accept] [Edit & Accept] [Dismiss] │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌─ Suggestion Card ──────────────────┐   │
│ │ 📐 Move "Skills" above "Education" │   │
│ │ Impact: +2 pts (structure score)   │   │
│ │ [Accept] [Dismiss]                 │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ... more suggestions ...                 │
│                                          │
│ [Accept All Suggestions]                 │
└──────────────────────────────────────────┘
```

### ATS Score Display

**Circular gauge:**
- Current score prominently displayed (large number + circular progress)
- Color-coded: red < 40, orange 40-59, yellow 60-74, green ≥ 75
- Max achievable score shown as a secondary marker/number
- Gap visualization: "You can gain up to X more points by optimizing your resume"

**Metric breakdown:**
- Three horizontal bars, one per metric
- Each shows: metric name, score (out of 100), visual bar, weight percentage
- Clicking a metric expands to show detailed breakdown

### Keyword Usage Details (expandable)

- **Matched keywords:** green badges, grouped by category (hard_skills, soft_skills, etc.)
- **Missing keywords:** red badges, sorted by importance (critical → important → nice_to_have)
- **Partial matches / synonyms:** yellow badges with note explaining the synonym match
- **In master resume but not in view:** blue badges with "Add to this resume" action button
- Each missing keyword shows estimated score impact if added

### Measurable Results Details (expandable)

- List of all experience bullets with pass/fail indicators
- Summary assessment
- For each bullet without a metric: inline suggestion to quantify
- Count: "8 of 12 bullets contain measurable results"

### Structure Details (expandable)

- Current section order vs. recommended order (visual diff)
- Completeness checklist: which recommended sections are present/missing
- Summary length assessment
- Bullet count per experience assessment
- Page length assessment

### Suggestions

Suggestions are the primary actionable output. Each suggestion is generated to close a specific gap between the current resume view and the ideal resume.

**Suggestion types:**

1. **Keyword Addition** — A missing keyword that can be naturally added
   - Where to add it (which section/bullet)
   - Exact text suggestion
   - Score impact

2. **Bullet Rewrite** — An experience bullet that can be improved
   - Original text
   - Suggested rewrite (with keywords incorporated and/or measurable result added)
   - Keywords addressed
   - Score impact (may affect both keyword and measurable results scores)

3. **Summary Rewrite** — The professional summary can be optimized
   - Original text
   - Suggested rewrite
   - Keywords addressed
   - Score impact

4. **Section Reorder** — Sections should be rearranged
   - Current order → suggested order
   - Score impact (structure score)

5. **Section Addition** — A recommended section is missing
   - Which section to add
   - Why it matters for this role
   - Score impact

6. **Content from Master Resume** — Something in the master resume is relevant but not in this view
   - What to add (specific skill, experience bullet, certification, etc.)
   - Why it's relevant (matches specific keyword or requirement)
   - Score impact

**Each suggestion includes:**
- `id` — unique identifier
- `type` — one of the types above
- `category` — which metric it affects: "keyword" | "measurable_result" | "structure" | "multiple"
- `priority` — "high" | "medium" | "low"
- `estimated_score_impact` — how many points the composite ATS score would increase
- `metric_impacts` — breakdown: `{ keyword: +3, measurable_results: +2, structure: 0 }`
- `original_text` — (if rewrite) the current text
- `suggested_text` — (if rewrite/addition) the proposed text
- `target_section` — which resume section this applies to
- `target_index` — (if applicable) which entry/bullet
- `keywords_addressed` — list of keywords this suggestion covers
- `explanation` — human-readable explanation of why this improves the score

**Suggestion actions:**

- **Accept** — applies the suggestion to the resume variant immediately:
  - For rewrites: replaces the original text with the suggested text
  - For keyword additions: adds the keyword to the skills section (or specified section)
  - For section reorders: updates the section order
  - For section additions: makes the section visible
  - For master resume content: copies the content into the variant
  - Updates the client-side estimated ATS score immediately
  - Triggers a background re-analysis for accurate scoring
  - The suggestion card collapses to a "✓ Accepted" state

- **Edit & Accept** (for text suggestions) — opens the suggested text in an inline editor, user can modify before accepting

- **Dismiss** — removes the suggestion from view (stored so it's not regenerated)

- **Accept All** — applies all non-dismissed suggestions in sequence

### Score Update Behavior (Hybrid Approach)

When a suggestion is accepted (or any edit is made):

1. **Immediate (client-side):** The estimated ATS score updates instantly based on the known impact values. This is a simple addition/subtraction from the current score based on `estimated_score_impact`. The UI shows this as "Estimated score" with a subtle indicator.

2. **Background (server-side):** A debounced API call (1-2 seconds after last change) re-runs the full scoring algorithm against the updated resume variant. When the response arrives:
   - If the actual score matches the estimate: silently confirm
   - If different: smoothly animate the score to the actual value, remove the "estimated" indicator
   - Refresh the suggestions list (some may no longer apply, new ones may appear)

### AI Analysis Prompt (Updated)

The analysis endpoint now generates both the ideal resume AND the scored analysis + suggestions in a single call (or two sequential calls if token limits are a concern).

**Analysis + Suggestions prompt:**

```
You are an expert ATS (Applicant Tracking System) analyst and career coach.

You have been given:
1. A job description
2. The user's current resume (the resume variant they are using for this application)  
3. The user's master resume (their complete career data)
4. The ideal resume benchmark for this job (previously generated)

Analyze the current resume against the ideal resume benchmark and return ONLY valid JSON:

{
  "scores": {
    "keyword_usage": {
      "score": <0-100>,
      "matched_keywords": [
        { "keyword": "string", "category": "hard_skills|soft_skills|industry_terms|qualifications|action_verbs", "importance": "critical|important|nice_to_have", "found_in": ["skills", "experience", ...] }
      ],
      "missing_keywords": [
        { "keyword": "string", "category": "string", "importance": "string", "in_master_resume": boolean, "estimated_impact": <number> }
      ],
      "synonym_matches": [
        { "expected": "string", "found": "string", "section": "string" }
      ]
    },
    "measurable_results": {
      "score": <0-100>,
      "total_bullets": <number>,
      "bullets_with_metrics": <number>,
      "ideal_count": <number>,
      "bullet_assessments": [
        { "experience_index": <number>, "bullet_index": <number>, "has_metric": boolean, "text": "string" }
      ],
      "summary_has_metric": boolean
    },
    "structure": {
      "score": <0-100>,
      "section_order_score": <0-100>,
      "current_order": ["string"],
      "ideal_order": ["string"],
      "completeness_score": <0-100>,
      "missing_sections": ["string"],
      "summary_score": <0-100>,
      "summary_word_count": <number>,
      "summary_ideal_range": [<min>, <max>],
      "bullet_count_score": <0-100>,
      "bullet_count_details": [
        { "company": "string", "current": <number>, "ideal": <number> }
      ],
      "page_length_score": <0-100>,
      "estimated_pages": <number>,
      "ideal_pages": <number>
    },
    "composite": <0-100>,
    "max_achievable": <0-100>
  },
  "summary": "<2-3 sentence overall assessment>",
  "suggestions": [
    {
      "id": "<uuid>",
      "type": "keyword_addition|bullet_rewrite|summary_rewrite|section_reorder|section_addition|master_resume_content",
      "category": "keyword|measurable_result|structure|multiple",
      "priority": "high|medium|low",
      "estimated_score_impact": <number>,
      "metric_impacts": { "keyword": <number>, "measurable_results": <number>, "structure": <number> },
      "original_text": "<current text, if applicable>",
      "suggested_text": "<proposed text, if applicable>",
      "target_section": "<section name>",
      "target_index": <index, if applicable>,
      "bullet_index": <index, if applicable>,
      "keywords_addressed": ["string"],
      "explanation": "<why this helps>"
    }
  ]
}

Scoring weights: Keywords 40%, Measurable Results 40%, Structure 20%.

Rules for suggestions:
- Generate suggestions ONLY where there is room to improve the score
- Each suggestion must have a realistic estimated_score_impact (how much the COMPOSITE score would increase)
- Sort suggestions by estimated_score_impact descending (highest impact first)
- For bullet rewrites: the suggested text must sound natural, professional, and specific to this industry
- For keyword additions: suggest WHERE to naturally incorporate the keyword, don't just list it
- For master resume content: reference specific items from the master resume that are relevant
- Never suggest adding skills or experience the user doesn't actually have (only what's in the master resume)
- Limit to a maximum of 15 suggestions, focusing on highest-impact items
- max_achievable should be calculated assuming the user applies all possible improvements from their master resume

JOB DESCRIPTION:
{{job_description}}

CURRENT RESUME VARIANT:
{{resume_variant_json}}

MASTER RESUME:
{{master_resume_json}}

IDEAL RESUME BENCHMARK:
{{ideal_resume_json}}
```

---

## Database Changes Summary

### Modified Tables

**`resume_variant`** — add columns:
```sql
alter table resume_variant add column design_settings jsonb not null default '{}';
alter table resume_variant add column section_order jsonb not null default '[]';
```

**`ai_analysis`** — add columns and modify structure:
```sql
alter table ai_analysis add column ideal_resume jsonb;
alter table ai_analysis add column keyword_score integer;
alter table ai_analysis add column measurable_results_score integer;
alter table ai_analysis add column structure_score integer;
alter table ai_analysis add column max_achievable_score integer;
alter table ai_analysis add column detailed_scores jsonb;
-- detailed_scores stores the full scores object from the AI response
alter table ai_analysis add column dismissed_suggestions jsonb default '[]';
-- dismissed_suggestions: array of suggestion IDs the user has dismissed
```

---

## API Endpoints

### `POST /api/ai/generate-ideal`
**Purpose:** Generate the ideal resume benchmark for a job application.  
**Input:** `{ job_application_id: string }`  
**Process:**
1. Fetch job description from `job_application`
2. Call AI with the ideal resume generation prompt
3. Store result in `ai_analysis.ideal_resume`
4. Return the ideal resume

### `POST /api/ai/analyze`  
**Purpose:** Run the full ATS analysis and generate suggestions.  
**Input:** `{ job_application_id: string }`  
**Process:**
1. Fetch job description, resume variant, master resume, and ideal resume
2. If no ideal resume exists, generate it first
3. Call AI with the analysis prompt
4. Store scores and suggestions in `ai_analysis`
5. Return full analysis results

### `POST /api/ai/accept-suggestion`
**Purpose:** Apply a suggestion to the resume variant.  
**Input:** `{ job_application_id: string, suggestion_id: string }`  
**Process:**
1. Fetch the suggestion from the analysis
2. Apply the change to the resume variant based on suggestion type
3. Update `resume_variant` in the database
4. Return the updated variant

### `POST /api/ai/dismiss-suggestion`
**Purpose:** Dismiss a suggestion so it's not shown again.  
**Input:** `{ job_application_id: string, suggestion_id: string }`  
**Process:**
1. Add the suggestion ID to `ai_analysis.dismissed_suggestions`
2. Return success

### `POST /api/ai/recalculate-score`
**Purpose:** Recalculate the ATS score after edits (background call).  
**Input:** `{ job_application_id: string }`  
**Process:**
1. Fetch updated resume variant, ideal resume
2. Run scoring (can be done partially server-side without full AI call for keyword and structure metrics, or do a lighter AI call)
3. Update `ai_analysis` scores
4. Return updated scores and any new/invalidated suggestions

---

## Client-Side Score Estimation

To enable instant score feedback, the client maintains a local scoring engine that can approximate the ATS score without an API call. This is used for:
- Real-time updates as the user types
- Instant feedback when accepting suggestions
- Score preview when toggling sections on/off or reordering

**Client-side scoring can reliably calculate:**
- Keyword coverage (exact match against the stored keyword map)
- Measurable results detection (regex patterns for numbers, percentages, currency)
- Section order distance (Levenshtein on arrays)
- Section completeness (simple presence check)
- Summary length (word count)
- Bullet counts

**Client-side scoring cannot reliably calculate:**
- Synonym matching (requires NLP)
- Context-aware keyword matching
- Quality of measurable results (just detects presence)

**Implementation:**

```typescript
// lib/ats-scoring/client.ts

interface ClientScoreResult {
  keyword_score: number;
  measurable_results_score: number;
  structure_score: number;
  composite: number;
  is_estimate: boolean;
}

function calculateClientScore(
  resumeVariant: ResumeVariant,
  idealResume: IdealResume,
  keywordMap: KeywordMap
): ClientScoreResult {
  // ... implementation
}
```

This should be a pure function that can run in a React component with no side effects.

---

## Translation Keys

Add to `messages/en.json` and `messages/ru.json`:

```json
{
  "resumeView": {
    "tabs": {
      "preview": "Preview",
      "design": "Design",
      "jobMatching": "Job Matching"
    },
    "design": {
      "presentation": "Presentation",
      "sections": "Sections",
      "template": "Template",
      "font": "Font",
      "fontSize": "Font Size",
      "lineHeight": "Line Height",
      "listLineHeight": "List Line Height",
      "accentColor": "Accent Color",
      "textColor": "Text Color",
      "sectionSpacing": "Section Spacing",
      "margins": "Margins",
      "compact": "Compact",
      "normal": "Normal",
      "relaxed": "Relaxed",
      "narrow": "Narrow",
      "wide": "Wide",
      "recommendedOrder": "Recommended order for this role",
      "hidingWarning": "Hiding this section will reduce your ATS score by {points} points",
      "dragToReorder": "Drag to reorder sections"
    },
    "matching": {
      "atsScore": "ATS Score",
      "maxAchievable": "Max Achievable",
      "keywordUsage": "Keyword Usage",
      "measurableResults": "Measurable Results",
      "resumeStructure": "Resume Structure",
      "suggestions": "Suggestions",
      "filterAll": "All",
      "filterKeywords": "Keywords",
      "filterResults": "Results",
      "filterStructure": "Structure",
      "accept": "Accept",
      "acceptAll": "Accept All Suggestions",
      "editAndAccept": "Edit & Accept",
      "dismiss": "Dismiss",
      "accepted": "Accepted",
      "dismissed": "Dismissed",
      "estimatedScore": "Estimated",
      "recalculating": "Recalculating...",
      "scoreImpact": "+{points} pts",
      "matchedKeywords": "Matched Keywords",
      "missingKeywords": "Missing Keywords",
      "inMasterResume": "Available in your master resume",
      "addToResume": "Add to this resume",
      "bulletsWithMetrics": "{count} of {total} bullets have measurable results",
      "currentOrder": "Current Order",
      "idealOrder": "Recommended Order",
      "runAnalysis": "Analyze Resume",
      "reanalyze": "Re-analyze",
      "analyzing": "Analyzing...",
      "noAnalysis": "Run an analysis to see your ATS score and get optimization suggestions.",
      "overqualified": "You exceed the requirements for this role",
      "underqualified": "Some qualifications are missing from your experience",
      "wellQualified": "You're well-qualified — focus on optimization"
    },
    "preview": {
      "addFromMaster": "Add from Master Resume",
      "hasMeasurableResult": "Has measurable result",
      "noMeasurableResult": "Consider adding a quantified achievement",
      "withinIdealRange": "Within ideal length",
      "tooShort": "Summary is shorter than recommended",
      "tooLong": "Summary is longer than recommended",
      "save": "Save Changes",
      "saving": "Saving...",
      "resetToMaster": "Reset to Master Resume",
      "unsavedChanges": "You have unsaved changes"
    }
  }
}
```

---

## Implementation Order

1. **Database migrations** — add new columns to `resume_variant` and `ai_analysis`
2. **Types** — update TypeScript types for ideal resume, detailed scores, suggestions, design settings
3. **Ideal resume generation** — API endpoint + AI prompt
4. **Client-side scoring engine** — pure functions for keyword matching, measurable results detection, structure scoring
5. **Analysis API** — updated endpoint that generates ideal resume (if needed), runs analysis, returns suggestions with score impacts
6. **Resume View page layout** — split-pane with tabs, responsive
7. **Preview tab** — migrate from existing VariantEditor, add measurable-result indicators, master resume integration
8. **Design tab** — Presentation sub-tab (font, colors, spacing), Sections sub-tab (reorder, toggle)
9. **Job Matching tab** — score gauge, metric breakdown, suggestion cards
10. **Suggestion actions** — accept, edit & accept, dismiss, accept all
11. **Real-time scoring** — client-side estimation with debounced server re-analysis
12. **Live preview updates** — ensure right panel updates from all three tabs
13. **Score persistence** — bottom bar showing ATS score, update after every change
14. **Testing & refinement** — verify scoring accuracy, tune AI prompts, adjust weights if needed

---

## Migration from Current Architecture

The current codebase has:
- `/applications/[id]/analysis/page.tsx` — standalone AI analysis page
- `/applications/[id]/resume/page.tsx` — standalone variant editor page
- `VariantEditor` component with form + preview
- AI analysis with single `ats_score`, no sub-metrics

**Migration path:**
1. Build the new unified Resume View page at the existing `/applications/[id]/resume/page.tsx` route
2. Absorb the analysis functionality into the Job Matching tab
3. Remove the standalone `/analysis/` route (or redirect to the resume page's Job Matching tab)
4. Update the application detail page to link to the unified resume view instead of separate analysis/resume links
5. Keep backward compatibility with existing `ai_analysis` records (old single-score records can coexist; the new page will prompt re-analysis to get detailed scores)