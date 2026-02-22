# Implementation Prompts — 3 Steps

> **Usage:** Add `resume-view-ats-spec.md` to project knowledge (or paste it as context). Then run each prompt below as a separate conversation. Verify each step works before moving to the next.

---

## Step 1 of 3: Backend — Database, Types, Scoring Engine & All API Endpoints

```
Referring to the "Integrated Resume View with ATS Scoring" spec (provided as project knowledge), implement the entire backend layer: database migrations, TypeScript types, client-side scoring engine, and all API endpoints.

Context: This is an existing Next.js 15 + Supabase + Better Auth + OpenAI app called "Jobapp". The current schema has tables: master_resume, job_application, resume_variant, ai_analysis. Types are in types/index.ts. AI prompts are in constants/prompts.ts. OpenAI client is in lib/openai.ts. Supabase server client is in lib/supabase/server.ts. Server actions for applications are in lib/actions/applications.ts.

### Part A: Database Migration

Create supabase/migrations/002_ats_scoring.sql:

1. Add to resume_variant:
   - design_settings (jsonb, not null, default '{}') — shape: { font_family, font_size, line_height, list_line_height, accent_color, text_color, section_spacing, margins: { top, bottom, left, right } }
   - section_order (jsonb, not null, default '[]') — ordered array of section name strings

2. Add to ai_analysis:
   - ideal_resume (jsonb) — the generated perfect-score benchmark
   - keyword_score (integer)
   - measurable_results_score (integer)
   - structure_score (integer)
   - max_achievable_score (integer)
   - detailed_scores (jsonb) — full breakdown from AI
   - dismissed_suggestions (jsonb, default '[]') — array of dismissed suggestion IDs

3. Backfill: set section_order = included_sections for existing resume_variant rows so current data doesn't break.

### Part B: TypeScript Types

Update types/index.ts — keep ALL existing types intact, add:

- DesignSettings: { font_family: string; font_size: number; line_height: number; list_line_height: number; accent_color: string; text_color: string; section_spacing: 'compact' | 'normal' | 'relaxed'; margins: { top: number; bottom: number; left: number; right: number } }

- Extend ResumeVariant with: design_settings: DesignSettings; section_order: ResumeSection[]

- IdealResume: { summary: string; experience_bullets: string[]; skills: string[]; education: { degree: string; field: string }[]; section_order: string[]; keyword_map: KeywordMap; ideal_measurable_results_count: number; ideal_structure: IdealStructure }

- KeywordMap: { hard_skills: KeywordEntry[]; soft_skills: KeywordEntry[]; industry_terms: KeywordEntry[]; qualifications: KeywordEntry[]; action_verbs: KeywordEntry[] }

- KeywordEntry: { keyword: string; importance: 'critical' | 'important' | 'nice_to_have'; frequency: number }

- IdealStructure: { section_order: string[]; bullet_count_per_experience: number; has_summary: boolean; summary_length_range: [number, number]; total_page_count: 1 | 2 }

- SuggestionType: 'keyword_addition' | 'bullet_rewrite' | 'summary_rewrite' | 'section_reorder' | 'section_addition' | 'master_resume_content'

- SuggestionCategory: 'keyword' | 'measurable_result' | 'structure' | 'multiple'

- MetricImpacts: { keyword: number; measurable_results: number; structure: number }

- ATSSuggestion: { id: string; type: SuggestionType; category: SuggestionCategory; priority: Priority; estimated_score_impact: number; metric_impacts: MetricImpacts; original_text: string | null; suggested_text: string | null; target_section: string; target_index: number | null; bullet_index: number | null; keywords_addressed: string[]; explanation: string }

- DetailedScores with nested sub-objects matching the spec's analysis response shape:
  - keyword_usage: { score, matched_keywords: { keyword, category, importance, found_in }[], missing_keywords: { keyword, category, importance, in_master_resume, estimated_impact }[], synonym_matches: { expected, found, section }[] }
  - measurable_results: { score, total_bullets, bullets_with_metrics, ideal_count, bullet_assessments: { experience_index, bullet_index, has_metric, text }[], summary_has_metric }
  - structure: { score, section_order_score, current_order, ideal_order, completeness_score, missing_sections, summary_score, summary_word_count, summary_ideal_range, bullet_count_score, bullet_count_details: { company, current, ideal }[], page_length_score, estimated_pages, ideal_pages }
  - composite: number
  - max_achievable: number

- Extend AiAnalysis with: ideal_resume: IdealResume | null; keyword_score: number | null; measurable_results_score: number | null; structure_score: number | null; max_achievable_score: number | null; detailed_scores: DetailedScores | null; dismissed_suggestions: string[]

- ClientScoreResult: { keyword_score: number; measurable_results_score: number; structure_score: number; composite: number; max_achievable: number | null; is_estimate: true }

### Part C: Client-Side Scoring Engine

Create lib/ats-scoring/client.ts with pure, synchronous functions (no React, no API calls, no external NLP libraries):

1. calculateKeywordScore(resumeVariant: ResumeVariant, keywordMap: KeywordMap): KeywordScoreResult
   - Extract all text from variant (summary, experience bullets, skill names, project descriptions/bullets, certification names) into one lowercase blob
   - Match each keyword from the map (case-insensitive)
   - Basic stemming helper: strip trailing "s", "ing", "ed", "tion"→"t", "ment"→"m" to generate a few stem variants. No NLP library needed.
   - Multi-word keywords: check if all words appear in the text
   - Weighted score: critical×3, important×2, nice_to_have×1
   - Return: { score (0-100), matched: KeywordMatch[], missing: KeywordMiss[] }

2. calculateMeasurableResultsScore(resumeVariant: ResumeVariant, idealCount: number): MeasurableResultsScoreResult
   - For each experience bullet, detect measurable results via regex:
     - Percentages: /\d+(\.\d+)?%/
     - Currency: /[\$€£]\s?[\d,]+(\.\d+)?[MmKkBb]?/
     - Numbers with context: /\b\d+[+]?\s*(users|clients|customers|employees|team members|projects|campaigns|markets|products|locations)/i
     - Ranges: /\d+\s*(to|-|–)\s*\d+/
     - Raw significant numbers (but NOT years like 2019-2024): /\b(?!(?:19|20)\d{2}\b)\d{2,}[+]?\b/
   - Check summary too
   - Score = min(100, (bullets_with_metrics / idealCount) × 100)
   - Return full assessment per bullet

3. calculateStructureScore(resumeVariant: ResumeVariant, idealStructure: IdealStructure): StructureScoreResult
   - Section order (30%): array Levenshtein distance between current (filtered to visible) and ideal
   - Section completeness (25%): how many ideal sections are present
   - Summary quality (15%): missing=0, too short=50, too long=70, in range=100
   - Bullet count (15%): per-experience comparison to ideal, averaged
   - Page length (15%): heuristic line count estimate → page count → compare to ideal
   - Return composite + each sub-score

4. calculateCompositeScore(keyword, measurableResults, structure): round(k×0.40 + m×0.40 + s×0.20)

5. calculateATSScore(resumeVariant, idealResume, masterResume?): ClientScoreResult
   - Orchestrator that calls all three, optionally calculates max_achievable from master resume

6. checkKeywordInMasterResume(keyword, masterResume): boolean

Create lib/ats-scoring/index.ts re-exporting everything. Export all helper types (KeywordMatch, KeywordMiss, KeywordScoreResult, MeasurableResultsScoreResult, StructureScoreResult).

### Part D: AI Prompts

Add to constants/prompts.ts (keep existing prompts):

1. IDEAL_RESUME_PROMPT — from the spec's "Generation" section. Template var: {{job_description}}. Instructs AI to build the perfect-score resume benchmark as JSON matching IdealResume.

2. AI_ANALYSIS_V2_PROMPT — from the spec's "Analysis + Suggestions prompt" section. Template vars: {{job_description}}, {{resume_variant_json}}, {{master_resume_json}}, {{ideal_resume_json}}. Returns scores + suggestions as JSON.

### Part E: API Endpoints

1. app/api/ai/generate-ideal/route.ts (POST):
   - Auth check → fetch job_application → call OpenAI with IDEAL_RESUME_PROMPT → parse JSON → upsert into ai_analysis.ideal_resume → return ideal resume
   - Retry once if JSON parsing fails

2. Refactor app/api/ai/analyze/route.ts (POST):
   - Auth check → fetch job_application, resume_variant, master_resume in parallel
   - If no ideal_resume exists yet, generate it first (call generate-ideal logic)
   - Call OpenAI with AI_ANALYSIS_V2_PROMPT → parse JSON
   - Upsert into ai_analysis: set ats_score, keyword_score, measurable_results_score, structure_score, max_achievable_score, detailed_scores, rewrite_suggestions (mapped from new suggestions format), summary, missing_keywords, matching_strengths, raw_response
   - Return full analysis result

3. app/api/ai/accept-suggestion/route.ts (POST):
   - Auth check → body: { job_application_id, suggestion_id, edited_text? }
   - Find suggestion in ai_analysis → fetch resume_variant
   - Apply change based on type:
     - bullet_rewrite: update experience[target_index].bullets[bullet_index]
     - summary_rewrite: update personal_info.summary
     - keyword_addition: add to skills array
     - section_reorder: update section_order
     - section_addition: add to included_sections
     - master_resume_content: add to appropriate section
   - Save updated variant → mark suggestion accepted → return updated variant

4. app/api/ai/dismiss-suggestion/route.ts (POST):
   - Auth check → add suggestion_id to ai_analysis.dismissed_suggestions → return success

5. app/api/ai/recalculate-score/route.ts (POST):
   - Auth check → fetch resume_variant + ideal_resume
   - Run client-side scoring functions server-side (they're pure functions)
   - Update ai_analysis scores → return updated scores
   - NO OpenAI call — just recalculation against stored ideal_resume

### Part F: Server Actions

Create lib/actions/analysis.ts:
- runAnalysis(jobApplicationId): calls /api/ai/analyze, returns full result
- acceptSuggestion(jobApplicationId, suggestionId, editedText?): calls accept endpoint, returns updated variant
- dismissSuggestion(jobApplicationId, suggestionId): calls dismiss endpoint
- recalculateScore(jobApplicationId): calls recalculate endpoint, returns scores
- getAnalysis(jobApplicationId): fetches ai_analysis from Supabase, returns typed AiAnalysis | null
- getIdealResume(jobApplicationId): fetches ai_analysis.ideal_resume, returns IdealResume | null

Follow existing codebase patterns: Better Auth session checks, Supabase service role client, error handling with try-catch, proper TypeScript typing throughout.
```

---

## Step 2 of 3: Frontend — Page Layout, All 3 Tabs & All UI Components

```
Referring to the "Integrated Resume View with ATS Scoring" spec (provided as project knowledge), implement the entire frontend: the unified Resume View page, all three tabs (Preview, Design, Job Matching), and all UI components.

Context: Step 1 is complete. We have: updated types in types/index.ts, client-side scoring engine in lib/ats-scoring/client.ts, all API endpoints, server actions in lib/actions/analysis.ts. The existing codebase has ResumePreview, VariantEditor, and template components (ClassicTemplate, ModernTemplate, MinimalTemplate).

### Part A: Page & Layout

1. Replace app/[locale]/(dashboard)/applications/[id]/resume/page.tsx:
   - Server component that fetches: job_application, resume_variant, master_resume, ai_analysis
   - Gets translated labels for section names
   - Passes everything to <ResumeViewPage> client component

2. Create components/resume-view/ResumeViewPage.tsx — the main shell:

   Layout:
   - LEFT PANEL (~50% on desktop, full on mobile): header (job title + company + status badge), tab bar (Preview | Design | Job Matching), scrollable content area
   - RIGHT PANEL (~50%, sticky, hidden on mobile with toggle): live ResumePreview, template selector dropdown at top, A4 page simulation container with proper aspect ratio
   - BOTTOM BAR (fixed, full width): ATS score display

   State (single source of truth for all tabs):
   - All resume variant fields (personal_info, experience, education, skills, etc.) — initialized from the variant prop
   - templateId, includedSections, sectionOrder, designSettings
   - analysisData (from ai_analysis prop)
   - clientScores (from client-side scoring, updated on every edit)
   - isDirty flag (any edit sets true, save resets to false)
   - activeTab

   Every state change re-renders the right-side preview via a computed currentData object (same pattern as existing VariantEditor).

   Responsive: desktop = side-by-side, mobile = stacked with "Show Preview" toggle.

### Part B: Preview Tab

Create components/resume-view/PreviewTab.tsx:

Migrate editing functionality from the existing VariantEditor into this tab:
- Personal Info (editable fields)
- Professional Summary textarea with word count indicator. Show quality badge: green "Within ideal length" / yellow "Too short" / yellow "Too long" — only when ideal_resume is available
- Work Experience: editable entries with bullet points. Each bullet shows a measurable-result indicator using the hasMeasurableResult detection from lib/ats-scoring/client.ts (green ✓ or yellow ⚠). Drag handles to reorder entries. Add/remove bullets and entries.
- Education, Skills (tag/chip input), Languages, Certifications, Projects — all editable with add/remove
- Skills color coding when analysis available: green badge = matches critical keyword, blue = matches important, gray = nice_to_have or no match
- "Add from Master Resume" button in relevant sections (details in Part G below)
- Save button + Reset to Master button
- All edits trigger: (1) right-panel preview update, (2) debounced client-side ATS score recalculation (500ms after last keystroke, only if ideal_resume available)

### Part C: Design Tab

Create components/resume-view/DesignTab.tsx with two sub-tabs (use shadcn Tabs, underline style):

Sub-tab: Presentation (components/resume-view/PresentationSubTab.tsx):
- Template selector: 3 thumbnail cards (Classic/Modern/Minimal) with selected border highlight
- Font family: Select dropdown (Georgia, Arial/Helvetica, Garamond, Calibri, Times New Roman, Roboto)
- Font size: Slider 9–12pt (0.5 step) with value display
- Line height: Slider 1.0–2.0 (0.1 step)
- List line height: Separate slider (same range), labeled "Bullet Point Spacing"
- Accent color: color input + 8-10 preset professional swatches (teal #0D9488, navy #1E3A5F, burgundy #800020, forest #228B22, charcoal #36454F, slate blue #6A5ACD, coral #E8634A, gold #B8860B)
- Text color: 3 preset options (black #000, dark gray #333, charcoal #444)
- Section spacing: 3 toggle buttons (Compact / Normal / Relaxed)
- Margins: 3 presets (Narrow / Normal / Wide)
- All changes update preview immediately via designSettings state

Sub-tab: Sections (components/resume-view/SectionsSubTab.tsx):
- Install @dnd-kit/core and @dnd-kit/sortable for drag-and-drop
- Draggable section list: each row has drag handle (GripVertical icon), section name (translated), visibility toggle (Switch)
- When toggling off: if ideal_resume available, calculate score impact and show warning badge (red "−X pts")
- On reorder: update section_order state → preview updates → structure score recalculates
- Recommended order reference card at bottom: "Recommended for this role: Experience → Skills → ..." (from idealResume.ideal_structure.section_order). Green "✓ Optimal order" badge if current matches ideal.

Update existing template components (ClassicTemplate, ModernTemplate, MinimalTemplate):
- Add designSettings prop
- Apply: font_family (inline style), font_size, line_height, accent_color (to headings, name, decorative elements), section_spacing (margin between sections)
- Render sections in the order specified by section_order (not hardcoded order)
- Update ResumePreview to pass designSettings through

### Part D: Job Matching Tab

Create components/resume-view/JobMatchingTab.tsx:

Three states:
- No analysis: empty state with "Analyze Resume" button + explanation
- Loading: skeleton with "Analyzing your resume..."
- Complete: full scoring interface

Create components/resume-view/ScoreGauge.tsx:
- SVG circular progress gauge with large score number in center
- Color-coded ring: red (<40), orange (40-59), yellow (60-74), green (≥75)
- Max achievable shown as secondary tick mark + text below
- "Estimated" label when showing client-side scores
- CSS transition animation on score changes

Create components/resume-view/MetricBreakdown.tsx:
- Three horizontal bars (Keyword Usage 40%, Measurable Results 40%, Structure 20%)
- Each shows: label, score/100, colored bar, weight
- Each clickable to expand with detailed breakdown:
  - Keywords: matched (green badges by category), missing (red/orange sorted by importance), in-master-resume (blue with "Add" action), synonyms (yellow)
  - Measurable Results: count ("8 of 12"), per-bullet list with ✓/⚠, summary line
  - Structure: current vs recommended order, completeness checklist, summary/bullet/page assessments

Create components/resume-view/SuggestionCard.tsx:
- Icon by type (🔑 keyword, ✏️ rewrite, 📐 structure, ➕ addition, 📋 master content)
- Title + explanation
- For rewrites: original (muted) vs suggested (highlighted) diff-style view
- Keywords addressed as small badges
- Impact badge: "+3 pts" in green
- Buttons: Accept, Edit & Accept (for text — opens inline textarea), Dismiss
- States: default, accepted (collapsed green "✓ Accepted"), dismissed (removed with exit animation)

Create components/resume-view/SuggestionsList.tsx:
- Filter tabs: All | Keywords | Results | Structure
- Sorted by estimated_score_impact descending
- "Accept All Suggestions" button
- Empty state: "Great work! No more suggestions."

Create components/resume-view/BottomScoreBar.tsx:
- Fixed bottom bar: composite ATS score (colored badge/mini-gauge), three metric scores as compact indicators
- "Estimated" label when client-side, smooth CSS transitions
- If no analysis: "Run analysis to see your ATS score" with button

Qualitative indicator based on max_achievable:
- <60: warning about missing qualifications
- 60-80: solid foundation, optimization helps
- >80: well-qualified, focus on polish

### Part E: "Analyze" / "Re-analyze" Button Behavior

- First click: "Analyze Resume" → calls runAnalysis server action → loading state across entire Job Matching tab → on complete: populate all scores, suggestions, breakdowns
- Subsequent: "Re-analyze" → same flow
- After manual edits in Preview tab since last analysis: show banner "Scores may have changed — re-analyze for updated suggestions"

### Part F: Hybrid Score Updates

When suggestion is accepted:
1. Optimistic: add estimated_score_impact to displayed score, show "Estimated" label
2. Update variant in local state (apply the change)
3. Background: call recalculateScore server action (debounced if rapid acceptances)
4. On response: animate score to actual value, remove "Estimated"

When user edits in Preview tab:
1. Debounced (500ms) client-side calculateATSScore runs
2. Bottom bar updates with "Estimated" scores
3. Job Matching tab shows stale-data banner

### Part G: "Add from Master Resume" Modal

Create components/resume-view/AddFromMasterModal.tsx:
- Triggered by "Add from Master Resume" buttons in Preview tab
- Sheet/modal showing master resume content NOT currently in the variant
- Sections: Skills, Experience entries/bullets, Education, Certifications, Projects, Languages
- Each item shows keyword-match highlighting (if analysis available)
- "Add" button per item → adds to variant state → recalculates score → keeps modal open for more

### Part H: Translations

Add ALL translation keys from the spec's "Translation Keys" section to both messages/en.json and messages/ru.json under the "resumeView" namespace (tabs, design, matching, preview sub-namespaces).

Use shadcn/ui components throughout: Tabs, Card, Input, Textarea, Button, Badge, Separator, Select, Slider, Switch, Sheet, Tooltip, Collapsible, Progress. Use lucide-react for icons. ZERO hardcoded user-facing strings.
```

---

## Step 3 of 3: Integration, Migration & Polish

```
Referring to the "Integrated Resume View with ATS Scoring" spec (provided as project knowledge), implement the final integration: wire everything together, migrate from old architecture, update adjacent pages, and polish.

Context: Steps 1 and 2 are complete. We have the full backend (DB, types, scoring engine, APIs) and the full frontend (ResumeViewPage with all 3 tabs, all UI components). This step ensures everything works end-to-end.

### Part A: Cross-Tab State Synchronization

Verify and fix in ResumeViewPage.tsx that changes in ANY tab properly propagate:

1. Preview tab edits → right-panel preview updates + bottom bar scores update (debounced client-side) + Job Matching tab shows stale banner if suggestions exist
2. Design > Presentation changes (template, font, colors, spacing) → preview updates immediately
3. Design > Sections reorder → preview updates + structure score recalculates + bottom bar updates
4. Design > Sections toggle visibility → preview updates + keyword and structure scores recalculate + bottom bar updates
5. Job Matching > accept suggestion → variant state updates → preview updates → measurable-result indicators in Preview tab update → bottom bar updates
6. Job Matching > accept suggestion that's a section reorder → Design > Sections list reorders to match

The single source of truth is the state in ResumeViewPage. All tabs read from and write to the same state object.

### Part B: Auto-Save & Dirty State

1. Track isDirty: set true on any edit, false after save
2. Show "Unsaved changes" indicator in the page header or bottom bar when dirty
3. Save button calls saveResumeVariant server action (update to accept the new fields: design_settings, section_order)
4. After save: isDirty = false, success toast
5. Add beforeunload warning when isDirty is true

Update lib/actions/applications.ts saveResumeVariant function to handle:
- design_settings field
- section_order field
- Keep backward compatibility with existing callers

### Part C: Update Application Detail Page

In app/[locale]/(dashboard)/applications/[id]/page.tsx:
1. Remove the separate "AI Analysis" tab/link — this is now inside the resume view
2. Change "Tailored Resume" / "View Resume" link to point to the unified resume view
3. Show ATS score badge on the detail page if ai_analysis exists (color-coded)
4. Add prominent "Open Resume Editor" button/card

### Part D: Update Application List

In the ApplicationCard component:
- Show ATS score badge if analysis exists for that application
- Color-coded (red <40, orange 40-59, yellow 60-74, green ≥75)

### Part E: Old Route Cleanup

1. Remove or redirect app/[locale]/(dashboard)/applications/[id]/analysis/page.tsx
   - Option: redirect to /applications/[id]/resume?tab=matching
   - Or just remove and update any links that pointed to it
2. Add deprecation comment to the old VariantEditor component: "Deprecated: use ResumeViewPage instead"
3. Remove any navigation links to the old analysis page (sidebar, breadcrumbs, etc.)

### Part F: Backward Compatibility

1. If ai_analysis has ats_score but no detailed_scores (old analysis): show score in bottom bar, but in Job Matching tab show "Re-analyze for detailed breakdown" message instead of trying to render empty metric data
2. If resume_variant has no section_order: default to included_sections value
3. If resume_variant has no design_settings: use defaults — { font_family: "Georgia", font_size: 10, line_height: 1.4, list_line_height: 1.2, accent_color: "#2E75B6", text_color: "#000000", section_spacing: "normal", margins: { top: 40, bottom: 40, left: 40, right: 40 } }
4. Old rewrite_suggestions format in ai_analysis should still render if detailed_scores is missing (graceful degradation)

### Part G: PDF Export Updates

Update app/api/resume/export/route.ts and the PDF template components (ClassicPDF, ModernPDF, MinimalPDF):
1. Accept and apply design_settings (font, colors, spacing)
2. Render sections in section_order
3. "Export PDF" button should be visible in the resume view page header

### Part H: Loading & Error States

1. Loading skeleton for the resume view page while server component fetches data
2. Error boundary (error.tsx) with friendly message and retry
3. If no master resume exists: show a message directing user to create one first (link to /resume)
4. If no job description on the application: show message in Job Matching tab — "Add a job description to analyze your resume"
5. Suspense boundaries around the tab content areas

### Part I: Translation Audit

Go through EVERY component in components/resume-view/ and verify:
1. No hardcoded user-facing strings anywhere
2. All button text, labels, headings, placeholders, toasts, error messages use t('resumeView.xxx') or t('resume.xxx') or t('common.xxx')
3. Both messages/en.json and messages/ru.json have ALL keys under the "resumeView" namespace
4. Add Russian translations for all new keys (proper Russian, not machine translation placeholders)

### Part J: End-to-End Verification

After everything is wired up, verify this flow works:

1. Create a job application with a job description
2. Open the resume view → Preview tab shows editable form + live preview on right
3. Switch to Job Matching → click "Analyze Resume" → loading → scores + suggestions appear
4. All three metrics show detailed breakdowns when expanded
5. Accept a bullet rewrite suggestion → score updates instantly (estimated) → settles to actual after background recalculation
6. Switch to Design > Presentation → change font, accent color → preview updates live
7. Switch to Design > Sections → reorder sections → preview reorders + structure score changes
8. Toggle off a section → warning shows point impact → score updates
9. Back to Preview → edit a bullet → measurable result indicator changes → bottom bar score updates (debounced)
10. Click "Add from Master Resume" → modal shows relevant content → add a skill → score updates
11. Save → success toast → isDirty clears
12. Export PDF → PDF reflects design settings and section order
13. Go back to application detail → ATS score badge visible
14. Go to applications list → score badge visible on the card
15. Switch locale EN→RU → all text translates
16. Mobile: layout stacks, preview toggle works
```

---

## Quick Reference

| Step | What It Builds | Key Files |
|---|---|---|
| **Step 1: Backend** | DB migration, types, scoring engine, prompts, all API endpoints, server actions | `supabase/migrations/002_*.sql`, `types/index.ts`, `lib/ats-scoring/client.ts`, `constants/prompts.ts`, `app/api/ai/*`, `lib/actions/analysis.ts` |
| **Step 2: Frontend** | Page layout, Preview tab, Design tab (2 sub-tabs), Job Matching tab, score gauge, suggestion cards, bottom bar, master resume modal, translations | `components/resume-view/*`, `app/[locale]/.../resume/page.tsx`, `messages/*.json` |
| **Step 3: Integration** | Cross-tab wiring, auto-save, old route cleanup, backward compat, PDF updates, loading/error states, translation audit, e2e verification | Various existing files updated + polish |