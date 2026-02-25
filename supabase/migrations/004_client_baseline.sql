-- Migration: Client baseline scores for delta-based scoring

alter table ai_analysis
  add column if not exists client_baseline_scores jsonb;
