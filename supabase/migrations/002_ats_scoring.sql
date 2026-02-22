-- Migration: ATS Scoring & Design Settings
-- Adds new columns for the integrated Resume View with ATS Scoring feature

-- ─── resume_variant: design settings & section ordering ─────────────────────

alter table resume_variant
  add column design_settings jsonb not null default '{}';
  -- Shape: { font_family, font_size, line_height, list_line_height, accent_color, text_color, section_spacing, margins: { top, bottom, left, right } }

alter table resume_variant
  add column section_order jsonb not null default '[]';
  -- Shape: ordered array of section name strings, e.g. ["personal_info","experience","skills","education","languages","certifications","projects"]

-- ─── ai_analysis: ideal resume, granular scores, dismissed suggestions ──────

alter table ai_analysis
  add column ideal_resume jsonb;
  -- Shape: { summary, experience_bullets, skills, education, section_order, keyword_map, ideal_measurable_results_count, ideal_structure }

alter table ai_analysis
  add column keyword_score integer;

alter table ai_analysis
  add column measurable_results_score integer;

alter table ai_analysis
  add column structure_score integer;

alter table ai_analysis
  add column max_achievable_score integer;

alter table ai_analysis
  add column detailed_scores jsonb;
  -- Full breakdown from AI analysis response

alter table ai_analysis
  add column dismissed_suggestions jsonb default '[]';
  -- Array of dismissed suggestion IDs

-- ─── Backfill: set section_order from included_sections for existing rows ───

update resume_variant
  set section_order = included_sections
  where section_order = '[]'::jsonb
    and included_sections != '[]'::jsonb;
