import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import {
  calculateKeywordScore,
  calculateMeasurableResultsScore,
  calculateStructureScore,
  calculateCompositeScore,
  calculateJobTitleMatchScore,
  calculateContextDepthScore,
  calculateAntiSpamPenalty,
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
        { error: 'No ideal resume found - run full analysis first' },
        { status: 400 }
      );
    }

    const idealResume = analysis.ideal_resume as IdealResume;

    // Run current client-side scoring
    const jobTitleResult = calculateJobTitleMatchScore(
      variant,
      idealResume.jd_job_title ?? ''
    );
    const keywordResult = calculateKeywordScore(
      variant,
      idealResume.keyword_map
    );
    const contextDepthResult = calculateContextDepthScore(
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
    const antiSpamResult = calculateAntiSpamPenalty(variant);

    const clientComposite = calculateCompositeScore(
      jobTitleResult.score,
      keywordResult.score,
      measurableResult.score,
      structureResult.score,
      antiSpamResult.penalty
    );

    // ── Delta-based scoring ──────────────────────────────────────────
    // Use the baseline snapshot taken at analysis time to compute deltas
    // displayed = AI_score + (client_current - client_baseline)
    const baseline = analysis.client_baseline_scores as {
      keyword_score?: number;
      measurable_results_score?: number;
      structure_score?: number;
      job_title_match_score?: number;
      composite?: number;
      anti_spam_penalty?: number;
    } | null;

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    let finalComposite: number;
    let finalKeyword: number;
    let finalMeasurable: number;
    let finalStructure: number;
    let finalJobTitle: number;
    let finalAntiSpam: number;

    if (baseline) {
      // Delta approach: AI score + (current - baseline)
      const aiComposite = analysis.ats_score ?? 0;
      const aiKeyword = analysis.keyword_score ?? 0;
      const aiMeasurable = analysis.measurable_results_score ?? 0;
      const aiStructure = analysis.structure_score ?? 0;
      const aiJobTitle = analysis.job_title_match_score ?? 0;
      const aiAntiSpam = analysis.anti_spam_penalty ?? 0;

      finalComposite = clamp(aiComposite + (clientComposite - (baseline.composite ?? 0)));
      finalKeyword = clamp(aiKeyword + (keywordResult.score - (baseline.keyword_score ?? 0)));
      finalMeasurable = clamp(aiMeasurable + (measurableResult.score - (baseline.measurable_results_score ?? 0)));
      finalStructure = clamp(aiStructure + (structureResult.score - (baseline.structure_score ?? 0)));
      finalJobTitle = clamp(aiJobTitle + (jobTitleResult.score - (baseline.job_title_match_score ?? 0)));
      finalAntiSpam = antiSpamResult.penalty; // penalty is absolute, not delta
    } else {
      // No baseline (old analysis) — fall back to raw client scores
      finalComposite = clientComposite;
      finalKeyword = keywordResult.score;
      finalMeasurable = measurableResult.score;
      finalStructure = structureResult.score;
      finalJobTitle = jobTitleResult.score;
      finalAntiSpam = antiSpamResult.penalty;
    }

    // Preserve the AI's original max_achievable — it doesn't change when accepting suggestions
    const maxAchievable: number | null = analysis.max_achievable_score ?? null;

    // Update ai_analysis scores
    const updatedScores = {
      ats_score: finalComposite,
      keyword_score: finalKeyword,
      measurable_results_score: finalMeasurable,
      structure_score: finalStructure,
      job_title_match_score: finalJobTitle,
      anti_spam_penalty: finalAntiSpam,
      max_achievable_score: maxAchievable,
      detailed_scores: {
        job_title_match: {
          score: jobTitleResult.score,
          jd_title: jobTitleResult.jd_title,
          matched_title: jobTitleResult.matched_title,
          matched_recency: jobTitleResult.matched_recency,
        },
        keyword_usage: {
          score: keywordResult.score,
          matched_keywords: keywordResult.matched,
          missing_keywords: keywordResult.missing,
          synonym_matches: [],
          required_skills_score: 0,
          preferred_skills_score: 0,
          context_depth_score: contextDepthResult.score,
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
        composite: finalComposite,
        max_achievable: maxAchievable ?? finalComposite,
        anti_spam_penalty: finalAntiSpam,
      },
    };

    const { error: updateError } = await supabase
      .from('ai_analysis')
      .update(updatedScores)
      .eq('id', analysis.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      job_title_match_score: finalJobTitle,
      keyword_score: finalKeyword,
      measurable_results_score: finalMeasurable,
      structure_score: finalStructure,
      context_depth_score: contextDepthResult.score,
      anti_spam_penalty: finalAntiSpam,
      composite: finalComposite,
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

