'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { JobPosting, JobPostingStatus } from '@/types';

async function getAuthUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

async function getUserOrgId(): Promise<string> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('organization_member')
    .select('organization_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('No organization found');
  return data.organization_id;
}

function generateJobSlug(title: string, companyName: string): string {
  const base = `${title}-${companyName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 60);
  const hash = Math.random().toString(36).substring(2, 8);
  return `${base}-${hash}`;
}

// ─── Read ────────────────────────────────────────────────────────────

export async function getJobPostings(
  statusFilter?: JobPostingStatus
): Promise<JobPosting[]> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  let query = supabase
    .from('job_posting')
    .select('*')
    .eq('organization_id', orgId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as JobPosting[];
}

export async function getJobPosting(id: string): Promise<JobPosting | null> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_posting')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data as JobPosting | null;
}

export async function getJobPostingStats(): Promise<{
  total: number;
  active: number;
  totalApplicants: number;
  byStatus: Record<JobPostingStatus, number>;
}> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const { data: postings, error } = await supabase
    .from('job_posting')
    .select('status, applications_count')
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  const items = postings ?? [];
  const byStatus: Record<JobPostingStatus, number> = {
    draft: 0,
    published: 0,
    paused: 0,
    closed: 0,
    archived: 0,
  };
  let totalApplicants = 0;

  for (const p of items) {
    const s = p.status as JobPostingStatus;
    if (s in byStatus) byStatus[s]++;
    totalApplicants += p.applications_count ?? 0;
  }

  return {
    total: items.length,
    active: byStatus.published,
    totalApplicants,
    byStatus,
  };
}

// ─── Create / Update ─────────────────────────────────────────────────

export interface JobPostingInput {
  title: string;
  description: string;
  short_description?: string;
  location?: string;
  location_type?: 'remote' | 'hybrid' | 'onsite';
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship';
  department?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  show_salary?: boolean;
  seniority_level?: string;
  min_years_experience?: number;
  max_years_experience?: number;
  required_skills?: unknown[];
  preferred_skills?: unknown[];
  education_requirements?: unknown[];
  key_responsibilities?: string[];
  soft_skills?: string[];
  closes_at?: string;
  allow_external_apply?: boolean;
}

export async function createJobPosting(
  input: JobPostingInput,
  publish?: boolean
): Promise<JobPosting> {
  const userId = await getAuthUserId();
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  // Get org name for slug
  const { data: org } = await supabase
    .from('organization')
    .select('name')
    .eq('id', orgId)
    .single();

  const slug = generateJobSlug(input.title, org?.name || 'company');
  const status: JobPostingStatus = publish ? 'published' : 'draft';

  const { data, error } = await supabase
    .from('job_posting')
    .insert({
      organization_id: orgId,
      created_by: userId,
      title: input.title,
      slug,
      description: input.description,
      short_description: input.short_description || null,
      location: input.location || null,
      location_type: input.location_type || null,
      employment_type: input.employment_type || null,
      department: input.department || null,
      salary_min: input.salary_min || null,
      salary_max: input.salary_max || null,
      salary_currency: input.salary_currency || 'USD',
      show_salary: input.show_salary ?? false,
      seniority_level: input.seniority_level || null,
      min_years_experience: input.min_years_experience || null,
      max_years_experience: input.max_years_experience || null,
      required_skills: input.required_skills || [],
      preferred_skills: input.preferred_skills || [],
      education_requirements: input.education_requirements || [],
      key_responsibilities: input.key_responsibilities || [],
      soft_skills: input.soft_skills || [],
      closes_at: input.closes_at || null,
      allow_external_apply: input.allow_external_apply ?? true,
      status,
      published_at: publish ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobPosting;
}

export async function updateJobPosting(
  id: string,
  input: Partial<JobPostingInput>
): Promise<JobPosting> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Map input fields to DB columns
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.short_description !== undefined) updateData.short_description = input.short_description || null;
  if (input.location !== undefined) updateData.location = input.location || null;
  if (input.location_type !== undefined) updateData.location_type = input.location_type || null;
  if (input.employment_type !== undefined) updateData.employment_type = input.employment_type || null;
  if (input.department !== undefined) updateData.department = input.department || null;
  if (input.salary_min !== undefined) updateData.salary_min = input.salary_min || null;
  if (input.salary_max !== undefined) updateData.salary_max = input.salary_max || null;
  if (input.salary_currency !== undefined) updateData.salary_currency = input.salary_currency;
  if (input.show_salary !== undefined) updateData.show_salary = input.show_salary;
  if (input.seniority_level !== undefined) updateData.seniority_level = input.seniority_level || null;
  if (input.min_years_experience !== undefined) updateData.min_years_experience = input.min_years_experience || null;
  if (input.max_years_experience !== undefined) updateData.max_years_experience = input.max_years_experience || null;
  if (input.required_skills !== undefined) updateData.required_skills = input.required_skills;
  if (input.preferred_skills !== undefined) updateData.preferred_skills = input.preferred_skills;
  if (input.education_requirements !== undefined) updateData.education_requirements = input.education_requirements;
  if (input.key_responsibilities !== undefined) updateData.key_responsibilities = input.key_responsibilities;
  if (input.soft_skills !== undefined) updateData.soft_skills = input.soft_skills;
  if (input.closes_at !== undefined) updateData.closes_at = input.closes_at || null;
  if (input.allow_external_apply !== undefined) updateData.allow_external_apply = input.allow_external_apply;

  const { data, error } = await supabase
    .from('job_posting')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobPosting;
}

// ─── Status Transitions ──────────────────────────────────────────────

export async function publishJobPosting(id: string): Promise<JobPosting> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_posting')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobPosting;
}

export async function pauseJobPosting(id: string): Promise<JobPosting> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_posting')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobPosting;
}

export async function closeJobPosting(id: string): Promise<JobPosting> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_posting')
    .update({
      status: 'closed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobPosting;
}

export async function deleteJobPosting(id: string): Promise<void> {
  const orgId = await getUserOrgId();
  const supabase = createServerClient();

  const { error } = await supabase
    .from('job_posting')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);
}
