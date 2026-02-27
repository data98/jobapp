import { openai } from '@/lib/openai';
import { RECOMMENDATIONS_PROMPT } from '@/constants/prompts';
import type {
  ResumeVariant,
  JDProfile,
  V1GapSummary,
  V1RecommendationsResult,
  V1RewriteSuggestion,
  V1SummarySuggestion,
  V1SkillAddition,
} from '@/types';

/**
 * Stage 4: AI-generated targeted recommendations using gap data.
 */
export async function generateRecommendations(
  gapSummary: V1GapSummary,
  resume: ResumeVariant,
  jdProfile: JDProfile
): Promise<V1RecommendationsResult> {
  try {
    // Trim resume data to reduce prompt size — only send relevant sections
    const trimmedResume = {
      personal_info: {
        summary: resume.personal_info?.summary ?? '',
        fullName: resume.personal_info?.fullName ?? '',
      },
      experience: (resume.experience ?? [])
        .filter((e) => !e.hidden)
        .map((exp, idx) => ({
          index: idx,
          company: exp.company,
          title: exp.title,
          bullets: (exp.bullets ?? []).filter(
            (_, j) => !exp.hiddenBullets?.includes(j)
          ),
        })),
      skills: (resume.skills ?? [])
        .filter((s) => !s.hidden)
        .map((s) => s.name),
      projects: (resume.projects ?? [])
        .filter((p) => !p.hidden)
        .map((p, idx) => ({
          index: idx,
          name: p.name,
          bullets: (p.bullets ?? []).filter(
            (_, j) => !p.hiddenBullets?.includes(j)
          ),
        })),
    };

    // Trim gap summary for prompt
    const trimmedGap = {
      missing_required_skills: gapSummary.missing_required_skills.map(
        (s) => ({ name: s.name, category: s.category })
      ),
      missing_preferred_skills: gapSummary.missing_preferred_skills.map(
        (s) => ({ name: s.name, category: s.category })
      ),
      seniority_gap: gapSummary.seniority_gap,
      missing_certifications: gapSummary.missing_certifications,
      education_gap: gapSummary.education_gap,
      years_gap: gapSummary.years_gap,
      unquantified_bullets: gapSummary.unquantified_bullets,
      weak_verb_bullets: gapSummary.weak_verb_bullets,
      missing_summary: gapSummary.missing_summary,
      claimed_only_skills: gapSummary.claimed_only_skills.map((s) => ({
        skill_name: s.skill_name,
        evidence_level: s.evidence_level,
      })),
    };

    const trimmedProfile = {
      job_title_normalized: jdProfile.job_title_normalized,
      department_function: jdProfile.department_function,
      industry: jdProfile.industry,
      seniority_level: jdProfile.seniority_level,
      required_skills: jdProfile.required_skills.map((s) => s.name),
      preferred_skills: jdProfile.preferred_skills.map((s) => s.name),
      key_responsibilities: jdProfile.key_responsibilities,
    };

    const prompt = RECOMMENDATIONS_PROMPT
      .replace('{{gap_summary_json}}', JSON.stringify(trimmedGap, null, 2))
      .replace('{{resume_json}}', JSON.stringify(trimmedResume, null, 2))
      .replace(
        '{{jd_profile_json}}',
        JSON.stringify(trimmedProfile, null, 2)
      );

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = aiResponse.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content);

    // Process rewrite suggestions
    const rewriteSuggestions: V1RewriteSuggestion[] = (
      parsed.rewrite_suggestions ?? []
    ).map(
      (s: Partial<V1RewriteSuggestion>) => ({
        id: crypto.randomUUID(),
        type: s.type ?? 'bullet_rewrite',
        section: s.section ?? 'experience',
        experience_index: s.experience_index ?? null,
        bullet_index: s.bullet_index ?? null,
        original_text: s.original_text ?? '',
        suggested_text: s.suggested_text ?? '',
        keywords_addressed: s.keywords_addressed ?? [],
        improvement_types: s.improvement_types ?? [],
        impact_explanation: s.impact_explanation ?? '',
        estimated_score_impact: s.estimated_score_impact ?? 'medium',
        accepted: false,
      })
    );

    // Process summary suggestion
    let summarySuggestion: V1SummarySuggestion | null = null;
    if (parsed.summary_suggestion?.needed) {
      summarySuggestion = {
        needed: true,
        current: parsed.summary_suggestion.current ?? null,
        suggested: parsed.summary_suggestion.suggested ?? '',
        keywords_addressed:
          parsed.summary_suggestion.keywords_addressed ?? [],
      };
    }

    // Process skills to add
    const skillsToAdd: V1SkillAddition[] = (
      parsed.skills_to_add ?? []
    ).map((s: Partial<V1SkillAddition>) => ({
      name: s.name ?? '',
      reason: s.reason ?? '',
      importance: s.importance ?? 'preferred',
    }));

    return {
      rewrite_suggestions: rewriteSuggestions,
      summary_suggestion: summarySuggestion,
      skills_to_add: skillsToAdd,
      overall_strategy: parsed.overall_strategy ?? '',
    };
  } catch (error) {
    console.error('Recommendations generation failed:', error);

    // Return empty recommendations on failure
    return {
      rewrite_suggestions: [],
      summary_suggestion: null,
      skills_to_add: [],
      overall_strategy:
        'Unable to generate recommendations at this time. Please try again.',
    };
  }
}
