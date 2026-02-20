import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { AI_ANALYSIS_PROMPT } from '@/constants/prompts';
import type { AiAnalysis, ResumeVariant, MasterResume } from '@/types';

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
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (!application.job_description) {
      return NextResponse.json(
        { error: 'No job description provided' },
        { status: 400 }
      );
    }

    // Fetch resume variant, fall back to master resume
    let resumeData: Partial<ResumeVariant | MasterResume> | null = null;

    const { data: variant } = await supabase
      .from('resume_variant')
      .select('*')
      .eq('job_application_id', jobApplicationId)
      .eq('user_id', userId)
      .single();

    if (variant) {
      resumeData = variant;
    } else {
      const { data: master } = await supabase
        .from('master_resume')
        .select('*')
        .eq('user_id', userId)
        .single();
      resumeData = master;
    }

    if (!resumeData) {
      return NextResponse.json(
        { error: 'No resume found' },
        { status: 400 }
      );
    }

    // Build the resume JSON for the prompt
    const resumeJson = JSON.stringify({
      personal_info: resumeData.personal_info,
      experience: resumeData.experience,
      education: resumeData.education,
      skills: resumeData.skills,
      languages: resumeData.languages,
      certifications: resumeData.certifications,
      projects: resumeData.projects,
    });

    // Build the prompt
    const prompt = AI_ANALYSIS_PROMPT
      .replace('{{job_description}}', application.job_description)
      .replace('{{resume_json}}', resumeJson);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const analysisResult = JSON.parse(rawContent);

    // Upsert into ai_analysis table
    const { data: existing } = await supabase
      .from('ai_analysis')
      .select('id')
      .eq('job_application_id', jobApplicationId)
      .single();

    let savedAnalysis: AiAnalysis;

    if (existing) {
      const { data, error } = await supabase
        .from('ai_analysis')
        .update({
          ats_score: analysisResult.ats_score,
          summary: analysisResult.summary,
          missing_keywords: analysisResult.missing_keywords,
          improvement_areas: analysisResult.improvement_areas,
          matching_strengths: analysisResult.matching_strengths,
          rewrite_suggestions: (analysisResult.rewrite_suggestions || []).map(
            (s: Record<string, unknown>) => ({ ...s, accepted: false })
          ),
          raw_response: analysisResult,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      savedAnalysis = data as AiAnalysis;
    } else {
      const { data, error } = await supabase
        .from('ai_analysis')
        .insert({
          job_application_id: jobApplicationId,
          ats_score: analysisResult.ats_score,
          summary: analysisResult.summary,
          missing_keywords: analysisResult.missing_keywords,
          improvement_areas: analysisResult.improvement_areas,
          matching_strengths: analysisResult.matching_strengths,
          rewrite_suggestions: (analysisResult.rewrite_suggestions || []).map(
            (s: Record<string, unknown>) => ({ ...s, accepted: false })
          ),
          raw_response: analysisResult,
        })
        .select()
        .single();

      if (error) throw error;
      savedAnalysis = data as AiAnalysis;
    }

    return NextResponse.json(savedAnalysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze' },
      { status: 500 }
    );
  }
}
