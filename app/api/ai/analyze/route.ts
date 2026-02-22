import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import {
  AI_ANALYSIS_V2_PROMPT,
  IDEAL_RESUME_PROMPT,
} from '@/constants/prompts';
import type { AiAnalysis, IdealResume } from '@/types';

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

    // Fetch job_application, resume_variant, master_resume in parallel
    const [appResult, variantResult, masterResult, analysisResult] =
      await Promise.all([
        supabase
          .from('job_application')
          .select('*')
          .eq('id', jobApplicationId)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('resume_variant')
          .select('*')
          .eq('job_application_id', jobApplicationId)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('master_resume')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('ai_analysis')
          .select('*')
          .eq('job_application_id', jobApplicationId)
          .single(),
      ]);

    const application = appResult.data;
    if (!application) {
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

    const resumeVariant = variantResult.data;
    const masterResume = masterResult.data;

    if (!resumeVariant && !masterResume) {
      return NextResponse.json(
        { error: 'No resume found' },
        { status: 400 }
      );
    }

    const resumeData = resumeVariant || masterResume;

    // Get or generate ideal resume
    let idealResume: IdealResume | null =
      analysisResult.data?.ideal_resume ?? null;

    if (!idealResume) {
      const idealPrompt = IDEAL_RESUME_PROMPT.replace(
        '{{job_description}}',
        application.job_description
      );

      const idealCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: idealPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const idealContent = idealCompletion.choices[0]?.message?.content;
      if (!idealContent) {
        return NextResponse.json(
          { error: 'Failed to generate ideal resume' },
          { status: 500 }
        );
      }

      idealResume = JSON.parse(idealContent) as IdealResume;
    }

    // Build resume JSON for the prompt
    const resumeJson = JSON.stringify({
      personal_info: resumeData!.personal_info,
      experience: resumeData!.experience,
      education: resumeData!.education,
      skills: resumeData!.skills,
      languages: resumeData!.languages,
      certifications: resumeData!.certifications,
      projects: resumeData!.projects,
    });

    const masterJson = masterResume
      ? JSON.stringify({
          personal_info: masterResume.personal_info,
          experience: masterResume.experience,
          education: masterResume.education,
          skills: masterResume.skills,
          languages: masterResume.languages,
          certifications: masterResume.certifications,
          projects: masterResume.projects,
        })
      : '{}';

    // Build the analysis prompt
    const prompt = AI_ANALYSIS_V2_PROMPT
      .replace('{{job_description}}', application.job_description)
      .replace('{{resume_variant_json}}', resumeJson)
      .replace('{{master_resume_json}}', masterJson)
      .replace('{{ideal_resume_json}}', JSON.stringify(idealResume));

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

    const result = JSON.parse(rawContent);

    // Map suggestions to rewrite_suggestions format for backward compatibility
    const rewriteSuggestions = (result.suggestions || [])
      .filter(
        (s: { type: string }) =>
          s.type === 'bullet_rewrite' || s.type === 'summary_rewrite'
      )
      .map((s: Record<string, unknown>) => ({
        id: s.id,
        section: s.target_section,
        original_index: s.target_index ?? 0,
        bullet_index: s.bullet_index ?? 0,
        original_text: s.original_text ?? '',
        suggested_text: s.suggested_text ?? '',
        keywords_addressed: s.keywords_addressed ?? [],
        accepted: false,
      }));

    // Prepare upsert data
    const upsertData = {
      job_application_id: jobApplicationId,
      ats_score: result.scores?.composite ?? 0,
      summary: result.summary ?? '',
      missing_keywords: result.missing_keywords ?? [],
      matching_strengths: result.matching_strengths ?? [],
      improvement_areas: [], // V2 uses suggestions instead
      rewrite_suggestions: rewriteSuggestions,
      raw_response: result,
      ideal_resume: idealResume,
      keyword_score: result.scores?.keyword_usage?.score ?? null,
      measurable_results_score:
        result.scores?.measurable_results?.score ?? null,
      structure_score: result.scores?.structure?.score ?? null,
      max_achievable_score: result.scores?.max_achievable ?? null,
      detailed_scores: result.scores ?? null,
    };

    let savedAnalysis: AiAnalysis;

    if (analysisResult.data) {
      const { data, error } = await supabase
        .from('ai_analysis')
        .update({
          ...upsertData,
          created_at: new Date().toISOString(),
        })
        .eq('id', analysisResult.data.id)
        .select()
        .single();

      if (error) throw error;
      savedAnalysis = data as AiAnalysis;
    } else {
      const { data, error } = await supabase
        .from('ai_analysis')
        .insert(upsertData)
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
