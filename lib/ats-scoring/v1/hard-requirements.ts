import type {
  ResumeVariant,
  JDProfile,
  V1HardRequirementsResult,
  V1EducationRequirement,
  EducationEntry,
} from '@/types';

/**
 * Stage 2c: Fully deterministic hard requirements check.
 * Education, certifications, and years of experience.
 */
export function computeHardRequirements(
  resume: ResumeVariant,
  jdProfile: JDProfile,
  totalRelevantYears?: number
): V1HardRequirementsResult {
  const educationResult = checkEducation(
    resume.education ?? [],
    jdProfile.education_requirements
  );
  const certResult = checkCertifications(
    resume.certifications ?? [],
    jdProfile.required_certifications
  );
  const yearsResult = checkYearsOfExperience(
    resume.experience ?? [],
    jdProfile.min_years_experience,
    totalRelevantYears
  );

  // Average the three sub-scores (if a subcategory has no requirement, it scores 100)
  const score = Math.round(
    (educationResult.score + certResult.score + yearsResult.score) / 3
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    education: educationResult,
    certifications: certResult,
    years_of_experience: yearsResult,
  };
}

// ─── Education ──────────────────────────────────────────────────────────────────

const EDUCATION_HIERARCHY: Record<string, number> = {
  high_school: 1,
  'high school': 1,
  associate: 2,
  "associate's": 2,
  bachelor: 3,
  "bachelor's": 3,
  'b.s.': 3,
  'b.a.': 3,
  'b.sc': 3,
  bs: 3,
  ba: 3,
  bsc: 3,
  master: 4,
  "master's": 4,
  'm.s.': 4,
  'm.a.': 4,
  ms: 4,
  ma: 4,
  msc: 4,
  mba: 4,
  phd: 5,
  'ph.d.': 5,
  'ph.d': 5,
  doctorate: 5,
  doctoral: 5,
};

function normalizeEducationLevel(degree: string): number {
  const lower = degree.toLowerCase().trim();

  // Direct lookup
  if (EDUCATION_HIERARCHY[lower] !== undefined) {
    return EDUCATION_HIERARCHY[lower];
  }

  // Substring matching
  for (const [key, value] of Object.entries(EDUCATION_HIERARCHY)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  // Default to bachelor level if we can't parse
  return 3;
}

function checkEducation(
  candidateEducation: EducationEntry[],
  requirements: V1EducationRequirement[]
): {
  met: boolean;
  required: V1EducationRequirement[];
  candidate_has: EducationEntry[];
  score: number;
} {
  const requiredReqs = requirements.filter((r) => r.importance === 'required');

  // No requirements = 100%
  if (requiredReqs.length === 0) {
    return {
      met: true,
      required: requirements,
      candidate_has: candidateEducation.filter((e) => !e.hidden),
      score: 100,
    };
  }

  const visibleEducation = candidateEducation.filter((e) => !e.hidden);
  const candidateHighest = Math.max(
    0,
    ...visibleEducation.map((e) => normalizeEducationLevel(e.degree))
  );

  let met = true;
  for (const req of requiredReqs) {
    if (req.level === 'any') continue;
    const requiredLevel = EDUCATION_HIERARCHY[req.level] ?? 3;
    if (candidateHighest < requiredLevel) {
      met = false;
      break;
    }
  }

  return {
    met,
    required: requirements,
    candidate_has: visibleEducation,
    score: met ? 100 : 30,
  };
}

// ─── Certifications ─────────────────────────────────────────────────────────────

function checkCertifications(
  candidateCerts: { name: string; hidden?: boolean }[],
  requiredCerts: string[]
): {
  matched: string[];
  missing: string[];
  total_required: number;
  score: number;
} {
  if (requiredCerts.length === 0) {
    return { matched: [], missing: [], total_required: 0, score: 100 };
  }

  const visibleCerts = candidateCerts
    .filter((c) => !c.hidden)
    .map((c) => c.name.toLowerCase().trim());

  const matched: string[] = [];
  const missing: string[] = [];

  for (const required of requiredCerts) {
    const reqLower = required.toLowerCase().trim();
    const found = visibleCerts.some(
      (cert) =>
        cert.includes(reqLower) ||
        reqLower.includes(cert) ||
        fuzzyMatch(cert, reqLower)
    );
    if (found) {
      matched.push(required);
    } else {
      missing.push(required);
    }
  }

  const matchPct = matched.length / requiredCerts.length;
  return {
    matched,
    missing,
    total_required: requiredCerts.length,
    score: Math.round(matchPct * 100),
  };
}

function fuzzyMatch(a: string, b: string): boolean {
  // Simple word overlap check
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const maxWords = Math.max(wordsA.size, wordsB.size);
  return maxWords > 0 && overlap / maxWords >= 0.5;
}

// ─── Years of Experience ────────────────────────────────────────────────────────

function checkYearsOfExperience(
  experience: { startDate: string; endDate: string; current?: boolean; hidden?: boolean }[],
  requiredMin: number | null,
  totalRelevantYears?: number
): {
  met: boolean;
  required_min: number | null;
  candidate_has: number;
  score: number;
} {
  if (requiredMin == null) {
    const totalYears = totalRelevantYears ?? calculateTotalYears(experience);
    return {
      met: true,
      required_min: null,
      candidate_has: totalYears,
      score: 100,
    };
  }

  const candidateYears =
    totalRelevantYears ?? calculateTotalYears(experience);
  const met = candidateYears >= requiredMin;

  let score: number;
  if (met) {
    score = 100;
  } else {
    // Proportional with floor of 30
    score = Math.max(30, Math.round((candidateYears / requiredMin) * 100));
  }

  return {
    met,
    required_min: requiredMin,
    candidate_has: Math.round(candidateYears * 10) / 10,
    score,
  };
}

function calculateTotalYears(
  experience: { startDate: string; endDate: string; current?: boolean; hidden?: boolean }[]
): number {
  let totalMonths = 0;

  for (const exp of experience) {
    if (exp.hidden) continue;
    if (!exp.startDate) continue;

    const start = new Date(exp.startDate);
    const end = exp.current ? new Date() : new Date(exp.endDate || Date.now());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }

  return totalMonths / 12;
}
