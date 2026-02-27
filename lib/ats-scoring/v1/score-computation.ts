import type {
  V1KeywordMatchResult,
  V1ExperienceRelevanceResult,
  V1HardRequirementsResult,
  V1ResumeQualityResult,
  V1SkillsDepthResult,
  V1DimensionScore,
  V1DimensionImpact,
  ScoreTier,
} from '@/types';

/**
 * Stage 3: Pure deterministic score computation.
 * Combines all sub-scores into a single ATS score (0-100).
 */

export const SCORE_WEIGHTS = {
  keyword_match: 0.35,
  experience_relevance: 0.25,
  hard_requirements: 0.20,
  resume_quality: 0.10,
  skills_depth: 0.10,
} as const;

export interface ATSScoreInput {
  keyword_match: V1KeywordMatchResult;
  experience_relevance: V1ExperienceRelevanceResult;
  hard_requirements: V1HardRequirementsResult;
  resume_quality: V1ResumeQualityResult;
  skills_depth: V1SkillsDepthResult;
}

export interface ATSScoreOutput {
  final_score: number;
  score_tier: ScoreTier;
  dimension_scores: V1DimensionScore[];
  weakest_areas: V1DimensionImpact[];
}

export function computeATSScore(results: ATSScoreInput): ATSScoreOutput {
  const dimensionScores: V1DimensionScore[] = [
    {
      name: 'keyword_match',
      score: results.keyword_match.score,
      weight: SCORE_WEIGHTS.keyword_match,
      weighted_contribution:
        results.keyword_match.score * SCORE_WEIGHTS.keyword_match,
    },
    {
      name: 'experience_relevance',
      score: results.experience_relevance.score,
      weight: SCORE_WEIGHTS.experience_relevance,
      weighted_contribution:
        results.experience_relevance.score *
        SCORE_WEIGHTS.experience_relevance,
    },
    {
      name: 'hard_requirements',
      score: results.hard_requirements.score,
      weight: SCORE_WEIGHTS.hard_requirements,
      weighted_contribution:
        results.hard_requirements.score * SCORE_WEIGHTS.hard_requirements,
    },
    {
      name: 'resume_quality',
      score: results.resume_quality.score,
      weight: SCORE_WEIGHTS.resume_quality,
      weighted_contribution:
        results.resume_quality.score * SCORE_WEIGHTS.resume_quality,
    },
    {
      name: 'skills_depth',
      score: results.skills_depth.score,
      weight: SCORE_WEIGHTS.skills_depth,
      weighted_contribution:
        results.skills_depth.score * SCORE_WEIGHTS.skills_depth,
    },
  ];

  const weightedScore = dimensionScores.reduce(
    (sum, d) => sum + d.weighted_contribution,
    0
  );
  const finalScore = Math.round(weightedScore);

  // Sort by impact (how much this dimension is reducing the total)
  const weakestAreas: V1DimensionImpact[] = dimensionScores
    .map((d) => ({
      name: d.name,
      score: d.score,
      weight: d.weight,
      impact: (100 - d.score) * d.weight,
    }))
    .sort((a, b) => b.impact - a.impact);

  const scoreTier: ScoreTier =
    finalScore >= 80
      ? 'excellent'
      : finalScore >= 65
        ? 'good'
        : finalScore >= 45
          ? 'needs_work'
          : 'poor';

  return {
    final_score: Math.min(100, Math.max(0, finalScore)),
    score_tier: scoreTier,
    dimension_scores: dimensionScores,
    weakest_areas: weakestAreas,
  };
}
