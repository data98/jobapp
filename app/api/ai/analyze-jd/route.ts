import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { JD_ANALYSIS_PROMPT } from '@/constants/prompts';
import type { JDProfile, SkillRequirement } from '@/types';

function assignSkillIds(skills: Omit<SkillRequirement, 'id' | 'importance'>[]): SkillRequirement[] {
  return skills.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    importance: 'required' as const,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { jobApplicationId } = await req.json();
    if (!jobApplicationId) {
      return NextResponse.json(
        { error: 'Missing jobApplicationId' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch the job application
    const { data: application, error: appError } = await supabase
      .from('job_application')
      .select('*')
      .eq('id', jobApplicationId)
      .eq('user_id', userId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }

    if (!application.job_description) {
      return NextResponse.json(
        { error: 'Job description is empty' },
        { status: 400 }
      );
    }

    // Check if a profile already exists
    const { data: existingProfile } = await supabase
      .from('jd_profiles')
      .select('*')
      .eq('job_application_id', jobApplicationId)
      .single();

    // If user has manually edited, don't overwrite
    if (existingProfile?.user_edited) {
      return NextResponse.json(existingProfile as JDProfile);
    }

    // Run AI extraction
    const prompt = JD_ANALYSIS_PROMPT.replace(
      '{{job_description}}',
      application.job_description
    );

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'AI returned empty response' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    // Assign UUIDs to skills and set importance
    const requiredSkills = assignSkillIds(parsed.required_skills || []).map(
      (s) => ({ ...s, importance: 'required' as const })
    );
    const preferredSkills = assignSkillIds(parsed.preferred_skills || []).map(
      (s) => ({ ...s, importance: 'preferred' as const })
    );

    const profileData = {
      job_application_id: jobApplicationId,
      required_skills: requiredSkills,
      preferred_skills: preferredSkills,
      min_years_experience: parsed.min_years_experience ?? null,
      max_years_experience: parsed.max_years_experience ?? null,
      seniority_level: parsed.seniority_level || 'mid',
      education_requirements: parsed.education_requirements || [],
      required_certifications: parsed.required_certifications || [],
      preferred_certifications: parsed.preferred_certifications || [],
      job_title_normalized: parsed.job_title_normalized || '',
      department_function: parsed.department_function || '',
      industry: parsed.industry || '',
      key_responsibilities: parsed.key_responsibilities || [],
      soft_skills: parsed.soft_skills || [],
      raw_jd_text: application.job_description,
      ai_model_used: 'gpt-4o-mini',
      user_edited: false,
      user_edited_at: null,
      updated_at: new Date().toISOString(),
    };

    let profile: JDProfile;

    if (existingProfile) {
      // Update existing (non-user-edited) profile
      const { data, error } = await supabase
        .from('jd_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update JD profile' },
          { status: 500 }
        );
      }
      profile = data as JDProfile;
    } else {
      // Insert new profile
      const { data, error } = await supabase
        .from('jd_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to save JD profile' },
          { status: 500 }
        );
      }
      profile = data as JDProfile;
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('JD Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
