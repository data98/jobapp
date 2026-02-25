/**
 * Suggestion Simulation — computes accurate estimated_score_impact
 * by simulating each suggestion against the client-side scoring engine.
 */

import type {
  ResumeVariant,
  IdealResume,
  MasterResume,
  ATSSuggestion,
  SkillEntry,
  ResumeSection,
} from '@/types';
import { calculateATSScore } from './client';

/**
 * Apply a suggestion to a copy of the variant and return the modified variant.
 */
export function simulateSuggestion(
  variant: ResumeVariant,
  suggestion: ATSSuggestion
): ResumeVariant {
  const copy = structuredClone(variant);

  switch (suggestion.type) {
    case 'keyword_addition':
    case 'master_resume_content': {
      const keywords = suggestion.keywords_addressed ?? [];
      for (const kw of keywords) {
        const exists = copy.skills.some(
          (s) => s.name.toLowerCase() === kw.toLowerCase()
        );
        if (!exists) {
          copy.skills.push({ id: `sim-${kw}`, name: kw });
        }
      }
      break;
    }

    case 'bullet_rewrite': {
      const expIdx = suggestion.target_index;
      const bulletIdx = suggestion.bullet_index;
      if (
        expIdx != null &&
        bulletIdx != null &&
        suggestion.suggested_text &&
        copy.experience?.[expIdx]?.bullets?.[bulletIdx] != null
      ) {
        copy.experience[expIdx].bullets[bulletIdx] = suggestion.suggested_text;
      }
      break;
    }

    case 'summary_rewrite': {
      if (suggestion.suggested_text && copy.personal_info) {
        copy.personal_info.summary = suggestion.suggested_text;
      }
      break;
    }

    case 'section_reorder': {
      if (suggestion.suggested_text) {
        try {
          const newOrder = JSON.parse(suggestion.suggested_text) as ResumeSection[];
          copy.section_order = newOrder;
        } catch {
          // ignore parse errors
        }
      }
      break;
    }

    case 'section_addition': {
      const section = suggestion.target_section as ResumeSection;
      if (section && !copy.included_sections?.includes(section)) {
        copy.included_sections = [...(copy.included_sections ?? []), section];
      }
      break;
    }
  }

  return copy;
}

/**
 * Compute the actual score impact of a suggestion by simulating it
 * against the client-side scoring engine.
 *
 * @returns The composite score delta (can be negative if suggestion hurts)
 */
export function computeSuggestionImpact(
  variant: ResumeVariant,
  idealResume: IdealResume,
  suggestion: ATSSuggestion,
  baselineComposite: number,
  masterResume?: MasterResume
): number {
  const simulated = simulateSuggestion(variant, suggestion);
  const simResult = calculateATSScore(simulated, idealResume, masterResume);
  return simResult.composite - baselineComposite;
}

/**
 * Compute accurate estimated_score_impact for all suggestions in-place.
 * After computing raw impacts, normalizes them so they sum to the gap
 * between the AI's current composite and max_achievable.
 *
 * Mutates the suggestions array.
 */
export function computeAllSuggestionImpacts(
  variant: ResumeVariant,
  idealResume: IdealResume,
  suggestions: ATSSuggestion[],
  baselineComposite: number,
  masterResume?: MasterResume,
  aiComposite?: number,
  aiMaxAchievable?: number
): void {
  // 1. Compute raw impacts
  const rawImpacts: number[] = [];
  for (const suggestion of suggestions) {
    const impact = computeSuggestionImpact(
      variant,
      idealResume,
      suggestion,
      baselineComposite,
      masterResume
    );
    rawImpacts.push(Math.max(0, impact));
  }

  // 2. Normalize to the gap between max_achievable and current score
  const gap = (aiMaxAchievable != null && aiComposite != null)
    ? Math.max(0, aiMaxAchievable - aiComposite)
    : null;

  const rawTotal = rawImpacts.reduce((sum, v) => sum + v, 0);

  for (let i = 0; i < suggestions.length; i++) {
    if (gap != null && rawTotal > 0) {
      // Scale proportionally so all impacts sum to exactly the gap
      suggestions[i].estimated_score_impact = Math.round(
        (rawImpacts[i] / rawTotal) * gap
      );
    } else {
      suggestions[i].estimated_score_impact = rawImpacts[i];
    }
  }
}
