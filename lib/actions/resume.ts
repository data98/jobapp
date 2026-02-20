'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type {
  MasterResume,
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillGroup,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
} from '@/types';

async function getAuthUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function getMasterResume(): Promise<MasterResume | null> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('master_resume')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data as MasterResume | null;
}

export async function saveMasterResume(resumeData: {
  personal_info: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
}): Promise<MasterResume> {
  const userId = await getAuthUserId();
  const supabase = createServerClient();

  // Check if resume exists
  const { data: existing } = await supabase
    .from('master_resume')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('master_resume')
      .update({
        ...resumeData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as MasterResume;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('master_resume')
      .insert({
        user_id: userId,
        ...resumeData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as MasterResume;
  }
}
