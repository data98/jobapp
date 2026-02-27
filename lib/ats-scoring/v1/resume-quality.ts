import type { ResumeVariant, V1ResumeQualityResult, V1BulletReference } from '@/types';

/**
 * Stage 2d: Fully deterministic resume quality assessment.
 * 6 checks summing to max 100 points.
 */

const ACTION_VERBS = new Set([
  // Leadership
  'led', 'managed', 'directed', 'coordinated', 'oversaw', 'supervised',
  'spearheaded', 'championed', 'mentored', 'guided',
  // Achievement
  'achieved', 'delivered', 'completed', 'exceeded', 'surpassed',
  'accomplished', 'attained',
  // Creation
  'built', 'created', 'designed', 'developed', 'established',
  'implemented', 'launched', 'initiated', 'introduced', 'founded',
  // Improvement
  'improved', 'enhanced', 'optimized', 'streamlined', 'reduced',
  'increased', 'accelerated', 'automated', 'modernized', 'revamped',
  // Technical
  'engineered', 'architected', 'deployed', 'configured', 'integrated',
  'migrated', 'refactored', 'debugged', 'programmed',
  // Analysis
  'analyzed', 'evaluated', 'assessed', 'researched', 'identified',
  'investigated', 'diagnosed', 'audited', 'measured',
  // Communication
  'presented', 'published', 'authored', 'documented', 'reported',
  'communicated', 'negotiated', 'collaborated',
]);

const METRIC_PATTERNS = [
  /\d+%/,           // percentages
  /\$[\d,.]+/,      // dollar amounts
  /€[\d,.]+/,       // euro amounts
  /£[\d,.]+/,       // pound amounts
  /\d+[xX]\s/,      // multipliers like "3x"
  /\d+\+?\s*(users|customers|clients|employees|members|team|people|engineers|developers)/i,
  /\d+\+?\s*(projects|applications|services|systems|platforms|servers|databases)/i,
  /\d+\+?\s*(million|billion|thousand|k\b|m\b)/i,
  /reduced\s.*\d/i,
  /increased\s.*\d/i,
  /improved\s.*\d/i,
  /saved\s.*\d/i,
  /grew\s.*\d/i,
  /generated\s.*\d/i,
];

function hasMeasurableResult(text: string): boolean {
  return METRIC_PATTERNS.some((pattern) => pattern.test(text));
}

export function computeResumeQuality(
  resume: ResumeVariant
): V1ResumeQualityResult {
  const summaryCheck = checkSummary(resume);
  const quantifiedCheck = checkQuantifiedAchievements(resume);
  const densityCheck = checkBulletDensity(resume);
  const skillsCheck = checkSkillsPopulated(resume);
  const contactCheck = checkContactComplete(resume);
  const actionVerbCheck = checkActionVerbs(resume);

  const score = Math.min(
    100,
    summaryCheck.score +
      quantifiedCheck.score +
      densityCheck.score +
      skillsCheck.score +
      contactCheck.score +
      actionVerbCheck.score
  );

  return {
    score: Math.max(0, score),
    checks: {
      has_summary: summaryCheck,
      quantified_achievements: quantifiedCheck,
      bullet_density: densityCheck,
      skills_populated: skillsCheck,
      contact_complete: contactCheck,
      action_verbs: actionVerbCheck,
    },
  };
}

// Check 1: Has professional summary? (max 20 pts)
function checkSummary(resume: ResumeVariant): {
  passed: boolean;
  score: number;
  detail: string;
} {
  const summary = resume.personal_info?.summary ?? '';
  if (summary.length >= 50) {
    return {
      passed: true,
      score: 20,
      detail: `Summary present (${summary.length} chars)`,
    };
  }
  return {
    passed: false,
    score: 0,
    detail: summary.length > 0
      ? `Summary too short (${summary.length} chars, need 50+)`
      : 'No professional summary',
  };
}

// Check 2: Quantified achievements (max 25 pts)
function checkQuantifiedAchievements(resume: ResumeVariant): {
  passed: boolean;
  score: number;
  quantified_count: number;
  total_bullets: number;
  unquantified_bullets: V1BulletReference[];
} {
  let totalBullets = 0;
  let quantifiedCount = 0;
  const unquantified: V1BulletReference[] = [];

  for (let i = 0; i < (resume.experience?.length ?? 0); i++) {
    const exp = resume.experience[i];
    if (exp.hidden) continue;
    for (let j = 0; j < (exp.bullets?.length ?? 0); j++) {
      if (exp.hiddenBullets?.includes(j)) continue;
      totalBullets++;
      if (hasMeasurableResult(exp.bullets[j])) {
        quantifiedCount++;
      } else {
        unquantified.push({
          experience_index: i,
          bullet_index: j,
          text: exp.bullets[j],
        });
      }
    }
  }

  if (totalBullets === 0) {
    return {
      passed: false,
      score: 0,
      quantified_count: 0,
      total_bullets: 0,
      unquantified_bullets: [],
    };
  }

  const pct = quantifiedCount / totalBullets;
  const score = Math.round(pct * 25);

  return {
    passed: pct >= 0.3,
    score,
    quantified_count: quantifiedCount,
    total_bullets: totalBullets,
    unquantified_bullets: unquantified.slice(0, 10), // Limit for prompt size
  };
}

// Check 3: Bullet density per role (max 20 pts)
function checkBulletDensity(resume: ResumeVariant): {
  passed: boolean;
  score: number;
  avg_bullets: number;
} {
  const visibleExperience = (resume.experience ?? []).filter((e) => !e.hidden);
  if (visibleExperience.length === 0) {
    return { passed: false, score: 0, avg_bullets: 0 };
  }

  const totalBullets = visibleExperience.reduce((sum, exp) => {
    const visible = (exp.bullets ?? []).filter(
      (_, idx) => !exp.hiddenBullets?.includes(idx)
    );
    return sum + visible.length;
  }, 0);

  const avgBullets = totalBullets / visibleExperience.length;

  let score: number;
  if (avgBullets >= 4) {
    score = 20;
  } else if (avgBullets >= 2) {
    score = 10;
  } else {
    score = 0;
  }

  return {
    passed: avgBullets >= 2,
    score,
    avg_bullets: Math.round(avgBullets * 10) / 10,
  };
}

// Check 4: Skills section populated (max 15 pts)
function checkSkillsPopulated(resume: ResumeVariant): {
  passed: boolean;
  score: number;
  count: number;
} {
  const visibleSkills = (resume.skills ?? []).filter((s) => !s.hidden);
  const count = visibleSkills.length;

  let score: number;
  if (count >= 8) {
    score = 15;
  } else if (count >= 4) {
    score = 10;
  } else if (count > 0) {
    score = 5;
  } else {
    score = 0;
  }

  return { passed: count >= 4, score, count };
}

// Check 5: Contact info complete (max 10 pts)
function checkContactComplete(resume: ResumeVariant): {
  passed: boolean;
  score: number;
  missing_fields: string[];
} {
  const info = resume.personal_info;
  const missing: string[] = [];
  let score = 0;

  if (info?.email) score += 3;
  else missing.push('email');

  if (info?.phone) score += 3;
  else missing.push('phone');

  if (info?.location) score += 2;
  else missing.push('location');

  if (info?.linkedIn) score += 2;
  else missing.push('linkedIn');

  return {
    passed: missing.length <= 1,
    score: Math.min(10, score),
    missing_fields: missing,
  };
}

// Check 6: Action verbs (max 10 pts)
function checkActionVerbs(resume: ResumeVariant): {
  passed: boolean;
  score: number;
  weak_bullets: V1BulletReference[];
} {
  let totalBullets = 0;
  let actionVerbCount = 0;
  const weakBullets: V1BulletReference[] = [];

  for (let i = 0; i < (resume.experience?.length ?? 0); i++) {
    const exp = resume.experience[i];
    if (exp.hidden) continue;
    for (let j = 0; j < (exp.bullets?.length ?? 0); j++) {
      if (exp.hiddenBullets?.includes(j)) continue;
      totalBullets++;
      const bullet = exp.bullets[j].trim();
      const firstWord = bullet.split(/\s+/)[0]?.toLowerCase();
      if (firstWord && ACTION_VERBS.has(firstWord)) {
        actionVerbCount++;
      } else {
        weakBullets.push({
          experience_index: i,
          bullet_index: j,
          text: bullet,
        });
      }
    }
  }

  if (totalBullets === 0) {
    return { passed: false, score: 0, weak_bullets: [] };
  }

  const pct = actionVerbCount / totalBullets;
  let score: number;
  if (pct >= 0.8) {
    score = 10;
  } else if (pct >= 0.5) {
    score = 5;
  } else {
    score = 0;
  }

  return {
    passed: pct >= 0.5,
    score,
    weak_bullets: weakBullets.slice(0, 10),
  };
}
