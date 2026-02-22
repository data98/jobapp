'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type {
  JobApplication,
  ApplicationStatus,
  ResumeVariant,
} from '@/types';

async function getAuthUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function getApplications(
  statusFilter?: ApplicationStatus
): Promise<JobApplication[]> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  let query = supabase
    .from('job_application')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as JobApplication[];
}

export async function getApplication(id: string): Promise<JobApplication | null> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_application')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data as JobApplication | null;
}

export async function createApplication(input: {
  job_title: string;
  company: string;
  job_description?: string;
  job_url?: string;
  location?: string;
  salary_range?: string;
}): Promise<JobApplication> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_application')
    .insert({
      user_id: userId,
      job_title: input.job_title,
      company: input.company,
      job_description: input.job_description || null,
      job_url: input.job_url || null,
      location: input.location || null,
      salary_range: input.salary_range || null,
      status: 'bookmarked' as ApplicationStatus,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create resume variant as a copy of master resume
  const { data: masterResume } = await supabase
    .from('master_resume')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (masterResume) {
    await supabase.from('resume_variant').insert({
      job_application_id: data.id,
      user_id: userId,
      template_id: 'classic',
      personal_info: masterResume.personal_info,
      experience: masterResume.experience,
      education: masterResume.education,
      skills: masterResume.skills,
      languages: masterResume.languages,
      certifications: masterResume.certifications,
      projects: masterResume.projects,
    });
  }

  return data as JobApplication;
}

export async function updateApplication(
  id: string,
  updates: Partial<
    Pick<
      JobApplication,
      | 'job_title'
      | 'company'
      | 'job_description'
      | 'job_url'
      | 'status'
      | 'contact_name'
      | 'contact_email'
      | 'contact_phone'
      | 'notes'
      | 'salary_range'
      | 'location'
      | 'applied_date'
    >
  >
): Promise<JobApplication> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_application')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobApplication;
}

export async function deleteApplication(id: string): Promise<void> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { error } = await supabase
    .from('job_application')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function getResumeVariant(
  jobApplicationId: string
): Promise<ResumeVariant | null> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('resume_variant')
    .select('*')
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  if (data) {
    return data as ResumeVariant;
  }

  // No variant exists yet — try to create one from the master resume
  const { data: masterResume } = await supabase
    .from('master_resume')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!masterResume) {
    return null;
  }

  const { data: newVariant, error: insertError } = await supabase
    .from('resume_variant')
    .insert({
      job_application_id: jobApplicationId,
      user_id: userId,
      template_id: 'classic',
      personal_info: masterResume.personal_info,
      experience: masterResume.experience,
      education: masterResume.education,
      skills: masterResume.skills,
      languages: masterResume.languages,
      certifications: masterResume.certifications,
      projects: masterResume.projects,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return newVariant as ResumeVariant;
}

export async function saveResumeVariant(
  jobApplicationId: string,
  updates: Partial<
    Pick<
      ResumeVariant,
      | 'template_id'
      | 'personal_info'
      | 'experience'
      | 'education'
      | 'skills'
      | 'languages'
      | 'certifications'
      | 'projects'
      | 'included_sections'
      | 'design_settings'
      | 'section_order'
    >
  >
): Promise<ResumeVariant> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('resume_variant')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ResumeVariant;
}

export async function resetVariantToMaster(
  jobApplicationId: string
): Promise<ResumeVariant> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data: masterResume, error: mrError } = await supabase
    .from('master_resume')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (mrError || !masterResume) {
    throw new Error('Master resume not found');
  }

  const { data, error } = await supabase
    .from('resume_variant')
    .update({
      personal_info: masterResume.personal_info,
      experience: masterResume.experience,
      education: masterResume.education,
      skills: masterResume.skills,
      languages: masterResume.languages,
      certifications: masterResume.certifications,
      projects: masterResume.projects,
      updated_at: new Date().toISOString(),
    })
    .eq('job_application_id', jobApplicationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ResumeVariant;
}

export async function getApplicationStats(): Promise<{
  total: number;
  active: number;
  interviews: number;
  accepted: number;
}> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('job_application')
    .select('status')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const apps = data ?? [];
  const activeStatuses: ApplicationStatus[] = ['bookmarked', 'applying', 'applied', 'interviewing', 'negotiation'];

  return {
    total: apps.length,
    active: apps.filter((a) => activeStatuses.includes(a.status as ApplicationStatus)).length,
    interviews: apps.filter((a) => a.status === 'interviewing').length,
    accepted: apps.filter((a) => a.status === 'accepted').length,
  };
}
