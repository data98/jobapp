'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { V1ExperienceRelevanceResult } from '@/types';

interface ExperienceDimensionDetailsProps {
  data: V1ExperienceRelevanceResult;
}

const SENIORITY_MATCH_KEYS = {
  under_qualified: 'underQualified',
  match: 'match',
  over_qualified: 'overQualified',
} as const;

export function ExperienceDimensionDetails({
  data,
}: ExperienceDimensionDetailsProps) {
  const t = useTranslations('resumeView.matching');

  return (
    <div className="space-y-3 text-sm">
      {/* Seniority & Years */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          variant={
            data.seniority_match === 'match'
              ? 'default'
              : data.seniority_match === 'over_qualified'
                ? 'secondary'
                : 'destructive'
          }
          className="text-xs"
        >
          {t('seniorityMatch')}: {t(SENIORITY_MATCH_KEYS[data.seniority_match])}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {t('yearsFound', { years: data.total_relevant_years.toFixed(1) })}
        </Badge>
        {!data.years_requirement_met && (
          <Badge variant="destructive" className="text-xs">
            {t('yearsRequired')} ⚠
          </Badge>
        )}
      </div>

      {/* Career trajectory */}
      <p className="text-xs text-muted-foreground italic">
        {data.career_trajectory_note}
      </p>

      {/* Per-entry scores */}
      <div className="space-y-2">
        {data.experience_scores.map((score) => (
          <div key={score.entry_index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate">
                {score.title} — {score.company}
              </span>
              <span className="text-xs font-bold tabular-nums ml-2">
                {score.overall_relevance}%
              </span>
            </div>
            <Progress
              value={score.overall_relevance}
              className={`h-1 ${
                score.overall_relevance >= 70
                  ? '[&>div]:bg-green-500'
                  : score.overall_relevance >= 40
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-red-500'
              }`}
            />
            <p className="text-xs text-muted-foreground">{score.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
