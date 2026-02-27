import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import {
  computeKeywordMatch,
  assessExperienceRelevance,
  computeHardRequirements,
  computeResumeQuality,
  computeSkillsDepth,
  computeATSScore,
  assembleGapSummary,
  generateRecommendations,
} from '@/lib/ats-scoring/v1';
import type { JDProfile, ResumeVariant, ATSAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

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

    // 1. Fetch inputs in parallel
    const [appResult, profileResult, variantResult, masterResult] =
      await Promise.all([
        supabase
          .from('job_application')
          .select('*')
          .eq('id', jobApplicationId)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('jd_profiles')
          .select('*')
          .eq('job_application_id', jobApplicationId)
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
      ]);

    if (appResult.error || !appResult.data) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json(
        { error: 'JD profile not found. Run JD analysis first.' },
        { status: 400 }
      );
    }

    const jdProfile = profileResult.data as JDProfile;
    const resume = (variantResult.data ??
      masterResult.data) as ResumeVariant | null;

    if (!resume) {
      return NextResponse.json(
        { error: 'No resume found' },
        { status: 400 }
      );
    }

    // 2. Stage 2a: Keyword Matching (deterministic)
    const keywordResult = computeKeywordMatch(resume, jdProfile);

    // 3. Stage 2b: Experience Relevance (AI call)
    const experienceResult = await assessExperienceRelevance(
      resume,
      jdProfile
    );

    // 4. Stage 2c: Hard Requirements (deterministic)
    const hardReqResult = computeHardRequirements(
      resume,
      jdProfile,
      experienceResult.total_relevant_years
    );

    // 5. Stage 2d: Resume Quality (deterministic)
    const qualityResult = computeResumeQuality(resume);

    // 6. Stage 2e: Skills Depth (deterministic)
    const depthResult = computeSkillsDepth(resume, keywordResult);

    // 7. Stage 3: Compute final score (deterministic)
    const scoreResult = computeATSScore({
      keyword_match: keywordResult,
      experience_relevance: experienceResult,
      hard_requirements: hardReqResult,
      resume_quality: qualityResult,
      skills_depth: depthResult,
    });

    // 8. Assemble gap summary
    const gapSummary = assembleGapSummary(
      keywordResult,
      experienceResult,
      hardReqResult,
      qualityResult,
      depthResult,
      jdProfile,
      resume
    );

    // 9. Stage 4: Generate recommendations (AI call)
    const recommendations = await generateRecommendations(
      gapSummary,
      resume,
      jdProfile
    );

    const processingTimeMs = Date.now() - startTime;

    // 10. Build and save analysis
    const analysisData = {
      job_application_id: jobApplicationId,
      jd_profile_id: jdProfile.id,
      ats_score: scoreResult.final_score,
      score_tier: scoreResult.score_tier,
      scoring_version: 1,
      dimension_scores: scoreResult.dimension_scores,
      weakest_areas: scoreResult.weakest_areas,
      keyword_match: keywordResult,
      experience_relevance: experienceResult,
      hard_requirements: hardReqResult,
      resume_quality: qualityResult,
      skills_depth: depthResult,
      recommendations,
      ai_models_used: {
        stage2_experience: 'gpt-4o',
        stage4: 'gpt-4o',
      },
      total_ai_tokens_used: null, // Could track if needed
      processing_time_ms: processingTimeMs,
    };

    // Upsert (on conflict with job_application_id unique constraint)
    const { data: existing } = await supabase
      .from('ats_analysis')
      .select('id')
      .eq('job_application_id', jobApplicationId)
      .single();

    let savedAnalysis: ATSAnalysis;

    if (existing) {
      const { data, error } = await supabase
        .from('ats_analysis')
        .update({
          ...analysisData,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update ats_analysis:', error);
        return NextResponse.json(
          { error: 'Failed to save analysis' },
          { status: 500 }
        );
      }
      savedAnalysis = data as ATSAnalysis;
    } else {
      const { data, error } = await supabase
        .from('ats_analysis')
        .insert(analysisData)
        .select()
        .single();

      if (error) {
        console.error('Failed to insert ats_analysis:', error);
        return NextResponse.json(
          { error: 'Failed to save analysis' },
          { status: 500 }
        );
      }
      savedAnalysis = data as ATSAnalysis;
    }

    return NextResponse.json(savedAnalysis);
  } catch (error) {
    console.error('V1 Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
