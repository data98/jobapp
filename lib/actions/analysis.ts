'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { AiAnalysis, RewriteSuggestion, ExperienceEntry } from '@/types';

async function getAuthUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
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

export async function acceptRewrite(
  jobApplicationId: string,
  suggestionId: string
): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  // Get the analysis
  const { data: analysis, error: aErr } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (aErr || !analysis) throw new Error('Analysis not found');

  const suggestions = analysis.rewrite_suggestions as RewriteSuggestion[];
  const suggestion = suggestions.find((s) => s.id === suggestionId);
  if (!suggestion) throw new Error('Suggestion not found');

  // Get the resume variant
  const { data: variant, error: vErr } = await supabase
    .from('resume_variant')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId)
    .single();

  if (vErr || !variant) throw new Error('Resume variant not found');

  // Apply the rewrite to the variant's experience bullets
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

  // Update the variant
  await supabase
    .from('resume_variant')
    .update({
      experience,
      updated_at: new Date().toISOString(),
    })
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId);

  // Mark the suggestion as accepted
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
