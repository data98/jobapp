'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { V1ResumeQualityResult } from '@/types';

interface QualityDimensionDetailsProps {
  data: V1ResumeQualityResult;
}

export function QualityDimensionDetails({
  data,
}: QualityDimensionDetailsProps) {
  const t = useTranslations('resumeView.matching');

  const checks = [
    {
      label: t('hasSummary'),
      passed: data.checks.has_summary.passed,
      score: data.checks.has_summary.score,
      maxScore: 20,
      detail: data.checks.has_summary.detail,
    },
    {
      label: t('quantifiedAchievements'),
      passed: data.checks.quantified_achievements.passed,
      score: data.checks.quantified_achievements.score,
      maxScore: 25,
      detail: `${data.checks.quantified_achievements.quantified_count}/${data.checks.quantified_achievements.total_bullets} bullets quantified`,
    },
    {
      label: t('bulletDensity'),
      passed: data.checks.bullet_density.passed,
      score: data.checks.bullet_density.score,
      maxScore: 20,
      detail: `${data.checks.bullet_density.avg_bullets} avg bullets/role`,
    },
    {
      label: t('skillsPopulated'),
      passed: data.checks.skills_populated.passed,
      score: data.checks.skills_populated.score,
      maxScore: 15,
      detail: `${data.checks.skills_populated.count} skills listed`,
    },
    {
      label: t('contactComplete'),
      passed: data.checks.contact_complete.passed,
      score: data.checks.contact_complete.score,
      maxScore: 10,
      detail: data.checks.contact_complete.missing_fields.length > 0
        ? `Missing: ${data.checks.contact_complete.missing_fields.join(', ')}`
        : 'All fields present',
    },
    {
      label: t('actionVerbUsage'),
      passed: data.checks.action_verbs.passed,
      score: data.checks.action_verbs.score,
      maxScore: 10,
      detail: `${data.checks.action_verbs.weak_bullets.length} bullets need stronger verbs`,
    },
  ];

  return (
    <div className="space-y-2 text-sm">
      {checks.map((check, idx) => (
        <div key={idx} className="flex items-start gap-2">
          {check.passed ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-xs">{check.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {check.score}/{check.maxScore}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{check.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
