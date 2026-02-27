import type {
  ResumeVariant,
  V1KeywordMatchResult,
  V1SkillsDepthResult,
  V1SkillEvidence,
  V1MatchLocation,
} from '@/types';

/**
 * Stage 2e: Deterministic skills depth assessment.
 * Evaluates whether matched skills are claimed, demonstrated, or proven.
 */

const METRIC_PATTERNS = [
  /\d+%/,
  /\$[\d,.]+/,
  /€[\d,.]+/,
  /£[\d,.]+/,
  /\d+[xX]\s/,
  /\d+\+?\s*(users|customers|clients|employees|members|team|people)/i,
  /\d+\+?\s*(projects|applications|services|systems)/i,
  /\d+\+?\s*(million|billion|thousand|k\b|m\b)/i,
  /reduced\s.*\d/i,
  /increased\s.*\d/i,
  /improved\s.*\d/i,
];

function hasMeasurableResult(text: string): boolean {
  return METRIC_PATTERNS.some((pattern) => pattern.test(text));
}

export function computeSkillsDepth(
  resume: ResumeVariant,
  keywordResult: V1KeywordMatchResult
): V1SkillsDepthResult {
  const allMatched = [
    ...keywordResult.required_matched,
    ...keywordResult.preferred_matched,
  ];

  if (allMatched.length === 0) {
    return { score: 0, skill_evidence: [] };
  }

  const skillEvidence: V1SkillEvidence[] = [];
  let totalPoints = 0;
  const maxPossible = allMatched.length * 5;

  for (const match of allMatched) {
    const evidence = classifyEvidence(match.found_in, resume);
    const points =
      evidence === 'proven' ? 5 : evidence === 'demonstrated' ? 3 : 1;

    totalPoints += points;
    skillEvidence.push({
      skill_name: match.skill.name,
      evidence_level: evidence,
      locations: match.found_in,
      points,
    });
  }

  const score =
    maxPossible > 0
      ? Math.round((totalPoints / maxPossible) * 100)
      : 0;

  return {
    score: Math.min(100, Math.max(0, score)),
    skill_evidence: skillEvidence,
  };
}

function classifyEvidence(
  locations: V1MatchLocation[],
  resume: ResumeVariant
): 'claimed' | 'demonstrated' | 'proven' {
  let hasExperienceBullet = false;
  let hasProvenMetric = false;

  for (const loc of locations) {
    if (
      (loc.section === 'experience' || loc.section === 'projects') &&
      loc.bullet_index !== undefined
    ) {
      hasExperienceBullet = true;

      // Check if this specific bullet has a measurable result
      let bulletText = '';
      if (loc.section === 'experience' && loc.entry_index !== undefined) {
        bulletText =
          resume.experience?.[loc.entry_index]?.bullets?.[loc.bullet_index] ??
          '';
      } else if (
        loc.section === 'projects' &&
        loc.entry_index !== undefined
      ) {
        bulletText =
          resume.projects?.[loc.entry_index]?.bullets?.[loc.bullet_index] ?? '';
      }

      if (bulletText && hasMeasurableResult(bulletText)) {
        hasProvenMetric = true;
      }
    }
  }

  if (hasProvenMetric) return 'proven';
  if (hasExperienceBullet) return 'demonstrated';
  return 'claimed';
}
