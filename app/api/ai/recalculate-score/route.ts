import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import {
  calculateKeywordScore,
  calculateMeasurableResultsScore,
  calculateStructureScore,
  calculateCompositeScore,
  calculateATSScore,
} from '@/lib/ats-scoring/client';
import type { ResumeVariant, IdealResume } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { job_application_id } = await req.json();
    if (!job_application_id) {
      return NextResponse.json(
        { error: 'Missing job_application_id' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch variant, analysis, and master resume in parallel
    const [variantResult, analysisResult, masterResult] = await Promise.all([
      supabase
        .from('resume_variant')
        .select('*')
        .eq('job_application_id', job_application_id)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('ai_analysis')
        .select('*')
        .eq('job_application_id', job_application_id)
        .single(),
      supabase
        .from('master_resume')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ]);

    const variant = variantResult.data as ResumeVariant | null;
    const analysis = analysisResult.data;
    const masterResume = masterResult.data;

    if (!variant) {
      return NextResponse.json(
        { error: 'Resume variant not found' },
        { status: 404 }
      );
    }

    if (!analysis?.ideal_resume) {
      return NextResponse.json(
        { error: 'No ideal resume found — run full analysis first' },
        { status: 400 }
      );
    }

    const idealResume = analysis.ideal_resume as IdealResume;

    // Run scoring functions (pure functions, no OpenAI call)
    const keywordResult = calculateKeywordScore(
      variant,
      idealResume.keyword_map
    );
    const measurableResult = calculateMeasurableResultsScore(
      variant,
      idealResume.ideal_measurable_results_count
    );
    const structureResult = calculateStructureScore(
      variant,
      idealResume.ideal_structure
    );

    const composite = calculateCompositeScore(
      keywordResult.score,
      measurableResult.score,
      structureResult.score
    );

    // Calculate max achievable if master resume available
    let maxAchievable: number | null = null;
    if (masterResume) {
      const fullResult = calculateATSScore(variant, idealResume, masterResume);
      maxAchievable = fullResult.max_achievable;
    }

    // Update ai_analysis scores
    const updatedScores = {
      ats_score: composite,
      keyword_score: keywordResult.score,
      measurable_results_score: measurableResult.score,
      structure_score: structureResult.score,
      max_achievable_score: maxAchievable,
      detailed_scores: {
        keyword_usage: {
          score: keywordResult.score,
          matched_keywords: keywordResult.matched,
          missing_keywords: keywordResult.missing,
          synonym_matches: [],
        },
        measurable_results: {
          score: measurableResult.score,
          total_bullets: measurableResult.total_bullets,
          bullets_with_metrics: measurableResult.bullets_with_metrics,
          ideal_count: measurableResult.ideal_count,
          bullet_assessments: measurableResult.bullet_assessments,
          summary_has_metric: measurableResult.summary_has_metric,
        },
        structure: {
          score: structureResult.score,
          section_order_score: structureResult.section_order_score,
          current_order: structureResult.current_order,
          ideal_order: structureResult.ideal_order,
          completeness_score: structureResult.completeness_score,
          missing_sections: structureResult.missing_sections,
          summary_score: structureResult.summary_score,
          summary_word_count: structureResult.summary_word_count,
          summary_ideal_range: idealResume.ideal_structure.summary_length_range,
          bullet_count_score: structureResult.bullet_count_score,
          bullet_count_details: structureResult.bullet_count_details,
          page_length_score: structureResult.page_length_score,
          estimated_pages: structureResult.estimated_pages,
          ideal_pages: structureResult.ideal_pages,
        },
        composite,
        max_achievable: maxAchievable ?? composite,
      },
    };

    const { error: updateError } = await supabase
      .from('ai_analysis')
      .update(updatedScores)
      .eq('id', analysis.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      keyword_score: keywordResult.score,
      measurable_results_score: measurableResult.score,
      structure_score: structureResult.score,
      composite,
      max_achievable: maxAchievable,
    });
  } catch (error) {
    console.error('Recalculate score error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate score' },
      { status: 500 }
    );
  }
}
