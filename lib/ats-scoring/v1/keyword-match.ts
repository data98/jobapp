import type {
  ResumeVariant,
  JDProfile,
  SkillRequirement,
  V1KeywordMatchResult,
  V1SkillMatch,
  V1MatchLocation,
} from '@/types';

/**
 * Stage 2a: Deterministic keyword matching with fuzzy resolution.
 * Compares resume content against JD Profile required/preferred skills.
 */
export function computeKeywordMatch(
  resume: ResumeVariant,
  jdProfile: JDProfile
): V1KeywordMatchResult {
  const requiredMatched: V1SkillMatch[] = [];
  const requiredMissing: SkillRequirement[] = [];
  const preferredMatched: V1SkillMatch[] = [];
  const preferredMissing: SkillRequirement[] = [];

  for (const skill of jdProfile.required_skills) {
    const locations = findSkillInResume(skill, resume);
    if (locations.length > 0) {
      requiredMatched.push({ skill, found_in: locations });
    } else {
      requiredMissing.push(skill);
    }
  }

  for (const skill of jdProfile.preferred_skills) {
    const locations = findSkillInResume(skill, resume);
    if (locations.length > 0) {
      preferredMatched.push({ skill, found_in: locations });
    } else {
      preferredMissing.push(skill);
    }
  }

  const totalRequired = jdProfile.required_skills.length;
  const totalPreferred = jdProfile.preferred_skills.length;

  const requiredPct =
    totalRequired > 0 ? requiredMatched.length / totalRequired : 1;
  const preferredPct =
    totalPreferred > 0 ? preferredMatched.length / totalPreferred : 1;

  // Required keywords count 3x more than preferred
  const score = Math.round(
    (requiredPct * 0.75 + preferredPct * 0.25) * 100
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    required_matched: requiredMatched,
    required_missing: requiredMissing,
    preferred_matched: preferredMatched,
    preferred_missing: preferredMissing,
    total_required: totalRequired,
    total_preferred: totalPreferred,
  };
}

function findSkillInResume(
  skill: SkillRequirement,
  resume: ResumeVariant
): V1MatchLocation[] {
  const locations: V1MatchLocation[] = [];
  const searchTerms = [skill.name, ...skill.aliases];

  // Search skills section
  for (const resumeSkill of resume.skills ?? []) {
    if (resumeSkill.hidden) continue;
    const matchType = findMatch(resumeSkill.name, searchTerms);
    if (matchType) {
      locations.push({
        section: 'skills',
        match_type: matchType,
        matched_text: resumeSkill.name,
      });
    }
  }

  // Search summary
  const summary = resume.personal_info?.summary;
  if (summary) {
    const matchType = findMatchInText(summary, searchTerms);
    if (matchType) {
      locations.push({
        section: 'summary',
        match_type: matchType.type,
        matched_text: matchType.text,
      });
    }
  }

  // Search experience
  for (let i = 0; i < (resume.experience?.length ?? 0); i++) {
    const exp = resume.experience[i];
    if (exp.hidden) continue;

    // Check title
    const titleMatch = findMatchInText(exp.title, searchTerms);
    if (titleMatch) {
      locations.push({
        section: 'experience',
        entry_index: i,
        match_type: titleMatch.type,
        matched_text: titleMatch.text,
      });
    }

    // Check bullets
    for (let j = 0; j < (exp.bullets?.length ?? 0); j++) {
      if (exp.hiddenBullets?.includes(j)) continue;
      const bullet = exp.bullets[j];
      const bulletMatch = findMatchInText(bullet, searchTerms);
      if (bulletMatch) {
        locations.push({
          section: 'experience',
          entry_index: i,
          bullet_index: j,
          match_type: bulletMatch.type,
          matched_text: bulletMatch.text,
        });
      }
    }
  }

  // Search projects
  for (let i = 0; i < (resume.projects?.length ?? 0); i++) {
    const proj = resume.projects[i];
    if (proj.hidden) continue;

    for (let j = 0; j < (proj.bullets?.length ?? 0); j++) {
      if (proj.hiddenBullets?.includes(j)) continue;
      const bullet = proj.bullets[j];
      const bulletMatch = findMatchInText(bullet, searchTerms);
      if (bulletMatch) {
        locations.push({
          section: 'projects',
          entry_index: i,
          bullet_index: j,
          match_type: bulletMatch.type,
          matched_text: bulletMatch.text,
        });
      }
    }
  }

  // Search certifications
  for (let i = 0; i < (resume.certifications?.length ?? 0); i++) {
    const cert = resume.certifications[i];
    if (cert.hidden) continue;
    const certMatch = findMatchInText(cert.name, searchTerms);
    if (certMatch) {
      locations.push({
        section: 'certifications',
        entry_index: i,
        match_type: certMatch.type,
        matched_text: certMatch.text,
      });
    }
  }

  return locations;
}

type MatchType = 'exact' | 'alias' | 'fuzzy';

function findMatch(
  text: string,
  searchTerms: string[]
): MatchType | null {
  const normalizedText = normalize(text);
  const primaryTerm = normalize(searchTerms[0]);
  const aliasTerms = searchTerms.slice(1).map(normalize);

  // Exact match against primary term
  if (normalizedText === primaryTerm) return 'exact';

  // Alias match
  for (const alias of aliasTerms) {
    if (normalizedText === alias) return 'alias';
  }

  // Fuzzy match (Levenshtein)
  for (const term of [primaryTerm, ...aliasTerms]) {
    if (term.length <= 4) {
      if (levenshtein(normalizedText, term) <= 1) return 'fuzzy';
    } else {
      if (levenshtein(normalizedText, term) <= 2) return 'fuzzy';
    }
  }

  return null;
}

function findMatchInText(
  text: string,
  searchTerms: string[]
): { type: MatchType; text: string } | null {
  if (!text) return null;
  const normalizedText = normalize(text);
  const words = normalizedText.split(/\s+/);
  const primaryTerm = normalize(searchTerms[0]);
  const aliasTerms = searchTerms.slice(1).map(normalize);

  // Check if any search term appears as a substring (for multi-word terms)
  if (normalizedText.includes(primaryTerm)) {
    return { type: 'exact', text: searchTerms[0] };
  }
  for (let i = 0; i < aliasTerms.length; i++) {
    if (normalizedText.includes(aliasTerms[i])) {
      return { type: 'alias', text: searchTerms[i + 1] };
    }
  }

  // Check individual words for single-word terms
  for (const word of words) {
    for (const term of [primaryTerm, ...aliasTerms]) {
      // Only fuzzy match single-word terms against single words
      if (!term.includes(' ') && !word.includes(' ')) {
        if (term.length <= 4) {
          if (levenshtein(word, term) <= 1) {
            return { type: 'fuzzy', text: word };
          }
        } else {
          if (levenshtein(word, term) <= 2) {
            return { type: 'fuzzy', text: word };
          }
        }
      }
    }
  }

  return null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, '')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}
