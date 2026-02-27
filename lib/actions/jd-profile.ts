'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { JDProfile } from '@/types';

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

export async function analyzeJobDescription(
  jobApplicationId: string
): Promise<JDProfile> {
  await getAuthUserId();
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${getBaseUrl()}/api/ai/analyze-jd`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ jobApplicationId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze job description');
  }

  return res.json();
}

export async function getJDProfile(
  jobApplicationId: string
): Promise<JDProfile | null> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  // Verify user owns this application
  const { data: app } = await supabase
    .from('job_application')
    .select('id')
    .eq('id', jobApplicationId)
    .eq('user_id', userId)
    .single();

  if (!app) return null;

  const { data, error } = await supabase
    .from('jd_profiles')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .single();

  if (error || !data) return null;

  return data as JDProfile;
}

export async function updateJDProfile(
  profileId: string,
  updates: Partial<JDProfile>
): Promise<JDProfile> {
  await getAuthUserId();
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${getBaseUrl()}/api/jd-profile/${profileId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update JD profile');
  }

  return res.json();
}

export async function reextractJDProfile(
  jobApplicationId: string
): Promise<JDProfile> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  // Reset user_edited flag so the AI can overwrite
  await supabase
    .from('jd_profiles')
    .update({
      user_edited: false,
      user_edited_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('job_application_id', jobApplicationId);

  // Re-run analysis
  return analyzeJobDescription(jobApplicationId);
}
