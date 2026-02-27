import type {
  ResumeVariant,
  JDProfile,
  V1KeywordMatchResult,
  V1ExperienceRelevanceResult,
  V1HardRequirementsResult,
  V1ResumeQualityResult,
  V1SkillsDepthResult,
  V1GapSummary,
} from '@/types';

/**
 * Assembles a gap summary from all Stage 2-3 results for Stage 4 input.
 * Trims arrays to prevent oversized prompts.
 */
export function assembleGapSummary(
  keywordResult: V1KeywordMatchResult,
  experienceResult: V1ExperienceRelevanceResult,
  hardReqResult: V1HardRequirementsResult,
  qualityResult: V1ResumeQualityResult,
  depthResult: V1SkillsDepthResult,
  jdProfile: JDProfile,
  resume: ResumeVariant
): V1GapSummary {
  // Get weakest experience entries (bottom 3 by relevance)
  const weakestExperience = [...experienceResult.experience_scores]
    .sort((a, b) => a.overall_relevance - b.overall_relevance)
    .slice(0, 3);

  // Seniority gap
  let seniorityGap: string | null = null;
  if (experienceResult.seniority_match === 'under_qualified') {
    seniorityGap = `JD targets ${jdProfile.seniority_level} level, candidate appears under-qualified`;
  } else if (experienceResult.seniority_match === 'over_qualified') {
    seniorityGap = `JD targets ${jdProfile.seniority_level} level, candidate may be over-qualified`;
  }

  // Education gap
  let educationGap: string | null = null;
  if (!hardReqResult.education.met) {
    const required = hardReqResult.education.required
      .filter((r) => r.importance === 'required')
      .map((r) => `${r.level}${r.field ? ` in ${r.field}` : ''}`)
      .join(', ');
    const candidateHas = hardReqResult.education.candidate_has
      .map((e) => e.degree)
      .join(', ') || 'none listed';
    educationGap = `JD requires ${required}; candidate has ${candidateHas}`;
  }

  // Years gap
  let yearsGap: string | null = null;
  if (!hardReqResult.years_of_experience.met && hardReqResult.years_of_experience.required_min != null) {
    yearsGap = `JD requires ${hardReqResult.years_of_experience.required_min}+ years, candidate has ~${hardReqResult.years_of_experience.candidate_has} years`;
  }

  // Claimed-only skills (not demonstrated in experience)
  const claimedOnly = depthResult.skill_evidence.filter(
    (s) => s.evidence_level === 'claimed'
  );

  return {
    missing_required_skills: keywordResult.required_missing,
    missing_preferred_skills: keywordResult.preferred_missing.slice(0, 10),
    weakest_experience_entries: weakestExperience,
    seniority_gap: seniorityGap,
    missing_certifications: hardReqResult.certifications.missing,
    education_gap: educationGap,
    years_gap: yearsGap,
    unquantified_bullets:
      qualityResult.checks.quantified_achievements.unquantified_bullets.slice(0, 10),
    weak_verb_bullets:
      qualityResult.checks.action_verbs.weak_bullets.slice(0, 10),
    missing_summary: !qualityResult.checks.has_summary.passed,
    claimed_only_skills: claimedOnly.slice(0, 10),
    jd_profile: jdProfile,
    resume,
  };
}
