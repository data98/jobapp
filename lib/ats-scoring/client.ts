import type {
  ResumeVariant,
  MasterResume,
  KeywordMap,
  KeywordEntry,
  IdealResume,
  IdealStructure,
  ClientScoreResult,
  ResumeSection,
} from '@/types';

// ─── Helper Types ────────────────────────────────────────────────────────────

export interface KeywordMatch {
  keyword: string;
  category: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  found_in: string[];
}

export interface KeywordMiss {
  keyword: string;
  category: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  in_master_resume: boolean;
}

export interface KeywordScoreResult {
  score: number;
  matched: KeywordMatch[];
  missing: KeywordMiss[];
}

export interface BulletAssessment {
  experience_index: number;
  bullet_index: number;
  has_metric: boolean;
  text: string;
}

export interface MeasurableResultsScoreResult {
  score: number;
  total_bullets: number;
  bullets_with_metrics: number;
  ideal_count: number;
  bullet_assessments: BulletAssessment[];
  summary_has_metric: boolean;
}

export interface StructureScoreResult {
  score: number;
  section_order_score: number;
  completeness_score: number;
  summary_score: number;
  bullet_count_score: number;
  page_length_score: number;
  current_order: string[];
  ideal_order: string[];
  missing_sections: string[];
  summary_word_count: number;
  bullet_count_details: { company: string; current: number; ideal: number }[];
  estimated_pages: number;
  ideal_pages: number;
}

// ─── Text Extraction ─────────────────────────────────────────────────────────

function extractAllText(variant: ResumeVariant): string {
  const parts: string[] = [];

  if (variant.personal_info?.summary) {
    parts.push(variant.personal_info.summary);
  }

  for (const exp of variant.experience ?? []) {
    for (const bullet of exp.bullets ?? []) {
      parts.push(bullet);
    }
  }

  for (const skill of variant.skills ?? []) {
    parts.push(skill.name);
  }

  for (const project of variant.projects ?? []) {
    if (project.description) parts.push(project.description);
    for (const bullet of project.bullets ?? []) {
      parts.push(bullet);
    }
  }

  for (const cert of variant.certifications ?? []) {
    parts.push(cert.name);
  }

  return parts.join(' ').toLowerCase();
}

// ─── Basic Stemming ──────────────────────────────────────────────────────────

function getStemVariants(word: string): string[] {
  const lower = word.toLowerCase();
  const variants = [lower];

  // Strip common suffixes
  if (lower.endsWith('ing') && lower.length > 5) {
    variants.push(lower.slice(0, -3));
    variants.push(lower.slice(0, -3) + 'e'); // e.g., managing -> manage
  }
  if (lower.endsWith('ed') && lower.length > 4) {
    variants.push(lower.slice(0, -2));
    variants.push(lower.slice(0, -1)); // e.g., managed -> manage
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) {
    variants.push(lower.slice(0, -1));
  }
  if (lower.endsWith('tion') && lower.length > 5) {
    variants.push(lower.slice(0, -4) + 't'); // e.g., optimization -> optimizat -> (partial)
    variants.push(lower.slice(0, -3) + 'e'); // e.g., generation -> generate
  }
  if (lower.endsWith('ment') && lower.length > 5) {
    variants.push(lower.slice(0, -4)); // e.g., management -> manage
  }

  return [...new Set(variants)];
}

function keywordMatchesText(keyword: string, text: string): boolean {
  const keywordLower = keyword.toLowerCase();
  const words = keywordLower.split(/\s+/);

  if (words.length === 1) {
    // Single word: check stem variants
    const variants = getStemVariants(keywordLower);
    for (const variant of variants) {
      if (text.includes(variant)) return true;
    }
    // Also check if any word in text stems to match
    const textWords = text.split(/[\s,;.!?()\[\]{}"'/\\-]+/);
    for (const tw of textWords) {
      const twVariants = getStemVariants(tw);
      for (const kv of variants) {
        if (twVariants.includes(kv)) return true;
      }
    }
    return false;
  }

  // Multi-word: check if all words appear in text
  return words.every((word) => {
    const variants = getStemVariants(word);
    return variants.some((v) => text.includes(v));
  });
}

// ─── 1. Keyword Score ────────────────────────────────────────────────────────

export function calculateKeywordScore(
  resumeVariant: ResumeVariant,
  keywordMap: KeywordMap
): KeywordScoreResult {
  const text = extractAllText(resumeVariant);
  const allKeywords: (KeywordEntry & { category: string })[] = [];

  for (const [category, entries] of Object.entries(keywordMap)) {
    for (const entry of entries) {
      allKeywords.push({ ...entry, category });
    }
  }

  const matched: KeywordMatch[] = [];
  const missing: KeywordMiss[] = [];
  const weights = { critical: 3, important: 2, nice_to_have: 1 };

  let weightedMatches = 0;
  let weightedTotal = 0;

  for (const kw of allKeywords) {
    const weight = weights[kw.importance];
    weightedTotal += weight;

    if (keywordMatchesText(kw.keyword, text)) {
      weightedMatches += weight;
      matched.push({
        keyword: kw.keyword,
        category: kw.category,
        importance: kw.importance,
        found_in: [], // simplified for client-side
      });
    } else {
      missing.push({
        keyword: kw.keyword,
        category: kw.category,
        importance: kw.importance,
        in_master_resume: false, // caller can override
      });
    }
  }

  const score = weightedTotal > 0
    ? Math.round((weightedMatches / weightedTotal) * 100)
    : 0;

  return { score, matched, missing };
}

// ─── 2. Measurable Results Score ─────────────────────────────────────────────

export function hasMeasurableResult(text: string): boolean {
  // Percentages
  if (/\d+(\.\d+)?%/.test(text)) return true;
  // Currency
  if (/[$€£]\s?[\d,]+(\.\d+)?[MmKkBb]?/.test(text)) return true;
  // Numbers with context
  if (/\b\d+[+]?\s*(users|clients|customers|employees|team members|projects|campaigns|markets|products|locations)/i.test(text)) return true;
  // Ranges
  if (/\d+\s*(to|-|–)\s*\d+/.test(text)) return true;
  // Significant numbers (not years)
  if (/\b(?!(?:19|20)\d{2}\b)\d{2,}[+]?\b/.test(text)) return true;

  return false;
}

export function calculateMeasurableResultsScore(
  resumeVariant: ResumeVariant,
  idealCount: number
): MeasurableResultsScoreResult {
  const bulletAssessments: BulletAssessment[] = [];
  let bulletsWithMetrics = 0;
  let totalBullets = 0;

  for (let expIdx = 0; expIdx < (resumeVariant.experience ?? []).length; expIdx++) {
    const exp = resumeVariant.experience[expIdx];
    for (let bulletIdx = 0; bulletIdx < (exp.bullets ?? []).length; bulletIdx++) {
      const text = exp.bullets[bulletIdx];
      totalBullets++;
      const hasMetric = hasMeasurableResult(text);
      if (hasMetric) bulletsWithMetrics++;
      bulletAssessments.push({
        experience_index: expIdx,
        bullet_index: bulletIdx,
        has_metric: hasMetric,
        text,
      });
    }
  }

  const summaryHasMetric = resumeVariant.personal_info?.summary
    ? hasMeasurableResult(resumeVariant.personal_info.summary)
    : false;

  if (summaryHasMetric) bulletsWithMetrics++;

  const score = idealCount > 0
    ? Math.min(100, Math.round((bulletsWithMetrics / idealCount) * 100))
    : 0;

  return {
    score,
    total_bullets: totalBullets,
    bullets_with_metrics: bulletsWithMetrics,
    ideal_count: idealCount,
    bullet_assessments: bulletAssessments,
    summary_has_metric: summaryHasMetric,
  };
}

// ─── 3. Structure Score ──────────────────────────────────────────────────────

function arrayLevenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function estimatePageCount(variant: ResumeVariant): number {
  let lineEstimate = 0;

  // Header ~3 lines
  lineEstimate += 3;

  // Summary
  if (variant.personal_info?.summary) {
    const words = variant.personal_info.summary.split(/\s+/).length;
    lineEstimate += Math.ceil(words / 12) + 1; // ~12 words per line + section header
  }

  // Experience
  for (const exp of variant.experience ?? []) {
    lineEstimate += 2; // company/title + dates
    lineEstimate += (exp.bullets ?? []).length;
  }
  if ((variant.experience ?? []).length > 0) lineEstimate += 1; // section header

  // Education
  for (const _edu of variant.education ?? []) {
    lineEstimate += 2;
  }
  if ((variant.education ?? []).length > 0) lineEstimate += 1;

  // Skills
  const skillCount = (variant.skills ?? []).length;
  lineEstimate += Math.ceil(skillCount / 6) + 1;

  // Projects
  for (const proj of variant.projects ?? []) {
    lineEstimate += 2;
    lineEstimate += (proj.bullets ?? []).length;
  }
  if ((variant.projects ?? []).length > 0) lineEstimate += 1;

  // Certifications & Languages
  lineEstimate += (variant.certifications ?? []).length;
  lineEstimate += (variant.languages ?? []).length;
  if ((variant.certifications ?? []).length > 0) lineEstimate += 1;
  if ((variant.languages ?? []).length > 0) lineEstimate += 1;

  // ~45 lines per page
  return Math.max(1, Math.ceil(lineEstimate / 45));
}

export function calculateStructureScore(
  resumeVariant: ResumeVariant,
  idealStructure: IdealStructure
): StructureScoreResult {
  // Current visible section order
  const includedSections = resumeVariant.included_sections ?? [];
  const sectionOrder = resumeVariant.section_order ?? includedSections;
  const visibleOrder = sectionOrder.filter((s: ResumeSection) =>
    includedSections.includes(s)
  );

  const idealOrder = idealStructure.section_order;

  // 1. Section order score (30%)
  const maxDist = Math.max(visibleOrder.length, idealOrder.length);
  const dist = arrayLevenshtein(visibleOrder, idealOrder);
  const sectionOrderScore = maxDist > 0
    ? Math.round((1 - dist / maxDist) * 100)
    : 100;

  // 2. Section completeness (25%)
  const idealSections = idealOrder;
  const presentCount = idealSections.filter((s: string) =>
    includedSections.includes(s as ResumeSection)
  ).length;
  const missingSections = idealSections.filter(
    (s: string) => !includedSections.includes(s as ResumeSection)
  );
  const completenessScore = idealSections.length > 0
    ? Math.round((presentCount / idealSections.length) * 100)
    : 100;

  // 3. Summary quality (15%)
  const summaryWords = resumeVariant.personal_info?.summary
    ? resumeVariant.personal_info.summary.split(/\s+/).filter(Boolean).length
    : 0;
  const [minWords, maxWords] = idealStructure.summary_length_range;
  let summaryScore: number;
  if (summaryWords === 0) {
    summaryScore = 0;
  } else if (summaryWords < minWords) {
    summaryScore = 50;
  } else if (summaryWords > maxWords) {
    summaryScore = 70;
  } else {
    summaryScore = 100;
  }

  // 4. Bullet count (15%)
  const bulletCountDetails: { company: string; current: number; ideal: number }[] = [];
  let bulletScoreSum = 0;
  const experiences = resumeVariant.experience ?? [];
  for (const exp of experiences) {
    const current = (exp.bullets ?? []).length;
    const ideal = idealStructure.bullet_count_per_experience;
    bulletCountDetails.push({ company: exp.company, current, ideal });
    if (current === ideal) {
      bulletScoreSum += 100;
    } else if (current < ideal) {
      bulletScoreSum += ideal > 0 ? Math.round((current / ideal) * 100) : 100;
    } else {
      const excess = current - ideal;
      bulletScoreSum += Math.max(70, 100 - excess * 10);
    }
  }
  const bulletCountScore = experiences.length > 0
    ? Math.round(bulletScoreSum / experiences.length)
    : 100;

  // 5. Page length (15%)
  const estimatedPages = estimatePageCount(resumeVariant);
  const idealPages = idealStructure.total_page_count;
  let pageLengthScore: number;
  if (estimatedPages === idealPages) {
    pageLengthScore = 100;
  } else if (estimatedPages === idealPages + 1) {
    pageLengthScore = 60;
  } else if (estimatedPages === idealPages - 1) {
    pageLengthScore = 40;
  } else {
    pageLengthScore = 20;
  }

  // Composite structure score
  const score = Math.round(
    sectionOrderScore * 0.3 +
    completenessScore * 0.25 +
    summaryScore * 0.15 +
    bulletCountScore * 0.15 +
    pageLengthScore * 0.15
  );

  return {
    score,
    section_order_score: sectionOrderScore,
    completeness_score: completenessScore,
    summary_score: summaryScore,
    bullet_count_score: bulletCountScore,
    page_length_score: pageLengthScore,
    current_order: visibleOrder,
    ideal_order: idealOrder,
    missing_sections: missingSections,
    summary_word_count: summaryWords,
    bullet_count_details: bulletCountDetails,
    estimated_pages: estimatedPages,
    ideal_pages: idealPages,
  };
}

// ─── 4. Composite Score ──────────────────────────────────────────────────────

export function calculateCompositeScore(
  keyword: number,
  measurableResults: number,
  structure: number
): number {
  return Math.round(keyword * 0.4 + measurableResults * 0.4 + structure * 0.2);
}

// ─── 5. Check Keyword In Master Resume ───────────────────────────────────────

export function checkKeywordInMasterResume(
  keyword: string,
  masterResume: MasterResume
): boolean {
  const parts: string[] = [];

  if (masterResume.personal_info?.summary) {
    parts.push(masterResume.personal_info.summary);
  }
  for (const exp of masterResume.experience ?? []) {
    for (const bullet of exp.bullets ?? []) {
      parts.push(bullet);
    }
  }
  for (const skill of masterResume.skills ?? []) {
    parts.push(skill.name);
  }
  for (const project of masterResume.projects ?? []) {
    if (project.description) parts.push(project.description);
    for (const bullet of project.bullets ?? []) {
      parts.push(bullet);
    }
  }
  for (const cert of masterResume.certifications ?? []) {
    parts.push(cert.name);
  }

  const text = parts.join(' ').toLowerCase();
  return keywordMatchesText(keyword, text);
}

// ─── 6. Orchestrator ─────────────────────────────────────────────────────────

export function calculateATSScore(
  resumeVariant: ResumeVariant,
  idealResume: IdealResume,
  masterResume?: MasterResume
): ClientScoreResult {
  const keywordResult = calculateKeywordScore(
    resumeVariant,
    idealResume.keyword_map
  );
  const measurableResult = calculateMeasurableResultsScore(
    resumeVariant,
    idealResume.ideal_measurable_results_count
  );
  const structureResult = calculateStructureScore(
    resumeVariant,
    idealResume.ideal_structure
  );

  const composite = calculateCompositeScore(
    keywordResult.score,
    measurableResult.score,
    structureResult.score
  );

  let maxAchievable: number | null = null;

  if (masterResume) {
    // Calculate max achievable by scoring the master resume
    const masterAsVariant: ResumeVariant = {
      ...resumeVariant,
      personal_info: masterResume.personal_info,
      experience: masterResume.experience,
      education: masterResume.education,
      skills: masterResume.skills,
      languages: masterResume.languages,
      certifications: masterResume.certifications,
      projects: masterResume.projects,
      included_sections: [
        'personal_info',
        'experience',
        'education',
        'skills',
        'languages',
        'certifications',
        'projects',
      ],
      section_order: idealResume.ideal_structure.section_order as ResumeSection[],
    };

    const maxKeyword = calculateKeywordScore(
      masterAsVariant,
      idealResume.keyword_map
    );
    const maxMeasurable = calculateMeasurableResultsScore(
      masterAsVariant,
      idealResume.ideal_measurable_results_count
    );
    // Assume optimal structure for max achievable
    const maxStructure = 100;

    maxAchievable = calculateCompositeScore(
      maxKeyword.score,
      maxMeasurable.score,
      maxStructure
    );
  }

  return {
    keyword_score: keywordResult.score,
    measurable_results_score: measurableResult.score,
    structure_score: structureResult.score,
    composite,
    max_achievable: maxAchievable,
    is_estimate: true,
  };
}
