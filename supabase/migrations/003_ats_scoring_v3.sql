-- Migration: ATS Scoring V3
-- Adds job title match and anti-spam penalty columns

alter table ai_analysis
  add column if not exists job_title_match_score integer;

alter table ai_analysis
  add column if not exists anti_spam_penalty integer default 0;
