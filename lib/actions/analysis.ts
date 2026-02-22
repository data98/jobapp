'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type {
  AiAnalysis,
  IdealResume,
  ResumeVariant,
  RewriteSuggestion,
  ExperienceEntry,
} from '@/types';

async function getAuthUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  return { 'Content-Type': 'application/json', cookie };
}

// ─── V2: ATS Scoring Actions ─────────────────────────────────────────────────

export async function runAnalysis(
  jobApplicationId: string
): Promise<AiAnalysis> {
  await getAuthUserId();
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${getBaseUrl()}/api/ai/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ jobApplicationId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to run analysis');
  }

  return res.json();
}

export async function acceptSuggestion(
  jobApplicationId: string,
  suggestionId: string,
  editedText?: string
): Promise<ResumeVariant> {
  await getAuthUserId();
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${getBaseUrl()}/api/ai/accept-suggestion`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      job_application_id: jobApplicationId,
      suggestion_id: suggestionId,
      edited_text: editedText,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to accept suggestion');
  }

  return res.json();
}

export async function dismissSuggestion(
  jobApplicationId: string,
  suggestionId: string
): Promise<void> {
  await getAuthUserId();
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${getBaseUrl()}/api/ai/dismiss-suggestion`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      job_application_id: jobApplicationId,
      suggestion_id: suggestionId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to dismiss suggestion');
  }
}

export async function recalculateScore(
  jobApplicationId: string
): Promise<{
  keyword_score: number;
  measurable_results_score: number;
  structure_score: number;
  composite: number;
  max_achievable: number | null;
}> {
  await getAuthUserId();
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${getBaseUrl()}/api/ai/recalculate-score`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ job_application_id: jobApplicationId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to recalculate score');
  }

  return res.json();
}

export async function getAnalysis(
  jobApplicationId: string
): Promise<AiAnalysis | null> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  // Verify the user owns this application
  const { data: app } = await supabase
    .from('job_application')
    .select('id')
    .eq('id', jobApplicationId)
    .eq('user_id', userId)
    .single();

  if (!app) return null;

  const { data, error } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data as AiAnalysis | null;
}

export async function getIdealResume(
  jobApplicationId: string
): Promise<IdealResume | null> {
  await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('ai_analysis')
    .select('ideal_resume')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return (data?.ideal_resume as IdealResume) ?? null;
}

// ─── V1: Legacy Actions (backward compatibility) ─────────────────────────────

export async function acceptRewrite(
  jobApplicationId: string,
  suggestionId: string
): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data: analysis, error: aErr } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (aErr || !analysis) throw new Error('Analysis not found');

  const suggestions = analysis.rewrite_suggestions as RewriteSuggestion[];
  const suggestion = suggestions.find((s) => s.id === suggestionId);
  if (!suggestion) throw new Error('Suggestion not found');

  const { data: variant, error: vErr } = await supabase
    .from('resume_variant')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId)
    .single();

  if (vErr || !variant) throw new Error('Resume variant not found');

  const experience = variant.experience as ExperienceEntry[];
  if (
    suggestion.section === 'experience' &&
    experience[suggestion.original_index]
  ) {
    const entry = experience[suggestion.original_index];
    if (entry.bullets[suggestion.bullet_index] !== undefined) {
      entry.bullets[suggestion.bullet_index] = suggestion.suggested_text;
    }
  }

  await supabase
    .from('resume_variant')
    .update({
      experience,
      updated_at: new Date().toISOString(),
    })
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId);

  const updatedSuggestions = suggestions.map((s) =>
    s.id === suggestionId ? { ...s, accepted: true } : s
  );

  await supabase
    .from('ai_analysis')
    .update({ rewrite_suggestions: updatedSuggestions })
    .eq('job_application_id', jobApplicationId);
}

export async function acceptAllRewrites(
  jobApplicationId: string
): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data: analysis, error: aErr } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (aErr || !analysis) throw new Error('Analysis not found');

  const suggestions = analysis.rewrite_suggestions as RewriteSuggestion[];
  const pending = suggestions.filter((s) => !s.accepted);

  if (pending.length === 0) return;

  const { data: variant, error: vErr } = await supabase
    .from('resume_variant')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId)
    .single();

  if (vErr || !variant) throw new Error('Resume variant not found');

  const experience = variant.experience as ExperienceEntry[];

  for (const suggestion of pending) {
    if (
      suggestion.section === 'experience' &&
      experience[suggestion.original_index]
    ) {
      const entry = experience[suggestion.original_index];
      if (entry.bullets[suggestion.bullet_index] !== undefined) {
        entry.bullets[suggestion.bullet_index] = suggestion.suggested_text;
      }
    }
  }

  await supabase
    .from('resume_variant')
    .update({
      experience,
      updated_at: new Date().toISOString(),
    })
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId);

  const updatedSuggestions = suggestions.map((s) => ({
    ...s,
    accepted: true,
  }));

  await supabase
    .from('ai_analysis')
    .update({ rewrite_suggestions: updatedSuggestions })
    .eq('job_application_id', jobApplicationId);
}

export async function rejectRewrite(
  jobApplicationId: string,
  suggestionId: string
): Promise<void> {
  await getAuthUserId();
  const supabase = createServerClient();

  const { data: analysis, error: aErr } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (aErr || !analysis) throw new Error('Analysis not found');

  const suggestions = analysis.rewrite_suggestions as RewriteSuggestion[];
  const updatedSuggestions = suggestions.filter((s) => s.id !== suggestionId);

  await supabase
    .from('ai_analysis')
    .update({ rewrite_suggestions: updatedSuggestions })
    .eq('job_application_id', jobApplicationId);
}
