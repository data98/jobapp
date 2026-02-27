'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { V1KeywordMatchResult } from '@/types';

interface KeywordDimensionDetailsProps {
  data: V1KeywordMatchResult;
}

export function KeywordDimensionDetails({ data }: KeywordDimensionDetailsProps) {
  const t = useTranslations('resumeView.matching');

  return (
    <div className="space-y-3 text-sm">
      {/* Required Keywords */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-medium text-xs text-muted-foreground uppercase">
            {t('requiredKeywords')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('matchedCount', {
              count: data.required_matched.length,
              total: data.total_required,
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.required_matched.map((m) => (
            <Badge key={m.skill.id} variant="default" className="text-xs bg-green-600">
              {m.skill.name}
            </Badge>
          ))}
          {data.required_missing.map((s) => (
            <Badge key={s.id} variant="destructive" className="text-xs">
              {s.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Preferred Keywords */}
      {data.total_preferred > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium text-xs text-muted-foreground uppercase">
              {t('preferredKeywords')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('matchedCount', {
                count: data.preferred_matched.length,
                total: data.total_preferred,
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.preferred_matched.map((m) => (
              <Badge
                key={m.skill.id}
                variant="secondary"
                className="text-xs bg-green-100 text-green-800"
              >
                {m.skill.name}
              </Badge>
            ))}
            {data.preferred_missing.map((s) => (
              <Badge key={s.id} variant="outline" className="text-xs text-orange-600 border-orange-300">
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
