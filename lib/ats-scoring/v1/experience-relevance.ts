import { openai } from '@/lib/openai';
import { EXPERIENCE_RELEVANCE_PROMPT } from '@/constants/prompts';
import type {
  ResumeVariant,
  JDProfile,
  V1ExperienceRelevanceResult,
  V1ExperienceScore,
} from '@/types';

/**
 * Stage 2b: AI-assisted experience relevance scoring.
 * Calls GPT-4o to semantically compare experience against the JD.
 */
export async function assessExperienceRelevance(
  resume: ResumeVariant,
  jdProfile: JDProfile
): Promise<V1ExperienceRelevanceResult> {
  const visibleExperience = (resume.experience ?? [])
    .map((exp, idx) => ({ ...exp, _original_index: idx }))
    .filter((exp) => !exp.hidden);

  if (visibleExperience.length === 0) {
    return {
      score: 0,
      experience_scores: [],
      total_relevant_years: 0,
      seniority_match: 'under_qualified',
      years_requirement_met: jdProfile.min_years_experience == null,
      career_trajectory_note: 'No experience entries found.',
    };
  }

  // Build the experience JSON for the prompt
  const experienceForPrompt = visibleExperience.map((exp) => ({
    index: exp._original_index,
    company: exp.company,
    title: exp.title,
    startDate: exp.startDate,
    endDate: exp.endDate,
    current: exp.current,
    bullets: (exp.bullets ?? []).filter(
      (_, idx) => !exp.hiddenBullets?.includes(idx)
    ),
  }));

  try {
    const prompt = EXPERIENCE_RELEVANCE_PROMPT
      .replace('{{job_title_normalized}}', jdProfile.job_title_normalized)
      .replace('{{department_function}}', jdProfile.department_function)
      .replace('{{industry}}', jdProfile.industry)
      .replace('{{seniority_level}}', jdProfile.seniority_level)
      .replace(
        '{{key_responsibilities}}',
        JSON.stringify(jdProfile.key_responsibilities)
      )
      .replace(
        '{{resume_experience_json}}',
        JSON.stringify(experienceForPrompt, null, 2)
      );

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = aiResponse.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content);

    // Map AI scores back to original indices
    const experienceScores: V1ExperienceScore[] = (
      parsed.experience_scores ?? []
    ).map((score: V1ExperienceScore, idx: number) => ({
      entry_index:
        score.entry_index ?? visibleExperience[idx]?._original_index ?? idx,
      company:
        score.company ?? visibleExperience[idx]?.company ?? 'Unknown',
      title: score.title ?? visibleExperience[idx]?.title ?? 'Unknown',
      title_relevance: clamp(score.title_relevance ?? 0),
      responsibility_overlap: clamp(score.responsibility_overlap ?? 0),
      industry_match: clamp(score.industry_match ?? 0),
      overall_relevance: clamp(score.overall_relevance ?? 0),
      reasoning: score.reasoning ?? '',
    }));

    const totalRelevantYears = parsed.total_relevant_years ?? 0;
    const seniorityMatch = validateSeniorityMatch(parsed.seniority_match);
    const careerNote =
      parsed.career_trajectory_note ?? 'Unable to assess career trajectory.';

    // Apply recency weighting: most recent roles weighted 2x
    const baseScore = computeWeightedScore(experienceScores);

    // Seniority modifier
    let seniorityPenalty = 0;
    if (seniorityMatch === 'under_qualified') seniorityPenalty = -10;
    if (seniorityMatch === 'over_qualified') seniorityPenalty = -5;

    // Years penalty
    let yearsPenalty = 0;
    const yearsRequirementMet =
      jdProfile.min_years_experience == null ||
      totalRelevantYears >= jdProfile.min_years_experience;
    if (!yearsRequirementMet) yearsPenalty = -15;

    const finalScore = Math.min(
      100,
      Math.max(0, baseScore + seniorityPenalty + yearsPenalty)
    );

    return {
      score: Math.round(finalScore),
      experience_scores: experienceScores,
      total_relevant_years: totalRelevantYears,
      seniority_match: seniorityMatch,
      years_requirement_met: yearsRequirementMet,
      career_trajectory_note: careerNote,
    };
  } catch (error) {
    console.error('Experience relevance AI call failed:', error);

    // Fallback: return a neutral score
    return {
      score: 50,
      experience_scores: visibleExperience.map((exp) => ({
        entry_index: exp._original_index,
        company: exp.company,
        title: exp.title,
        title_relevance: 50,
        responsibility_overlap: 50,
        industry_match: 50,
        overall_relevance: 50,
        reasoning: 'AI assessment unavailable — using neutral score.',
      })),
      total_relevant_years: 0,
      seniority_match: 'match',
      years_requirement_met: true,
      career_trajectory_note:
        'AI assessment was unavailable. Scores are estimated.',
    };
  }
}

function computeWeightedScore(scores: V1ExperienceScore[]): number {
  if (scores.length === 0) return 0;

  // Most recent entry gets weight 2, rest get weight 1
  // Assuming scores are in chronological order (most recent first)
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < scores.length; i++) {
    const weight = i === 0 ? 2 : 1; // First entry is most recent
    weightedSum += scores[i].overall_relevance * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function validateSeniorityMatch(
  value: string
): 'under_qualified' | 'match' | 'over_qualified' {
  if (value === 'under_qualified' || value === 'over_qualified') return value;
  return 'match';
}
