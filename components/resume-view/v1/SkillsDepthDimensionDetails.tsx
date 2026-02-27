'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { V1SkillsDepthResult } from '@/types';

interface SkillsDepthDimensionDetailsProps {
  data: V1SkillsDepthResult;
}

export function SkillsDepthDimensionDetails({
  data,
}: SkillsDepthDimensionDetailsProps) {
  const t = useTranslations('resumeView.matching');

  const proven = data.skill_evidence.filter(
    (s) => s.evidence_level === 'proven'
  );
  const demonstrated = data.skill_evidence.filter(
    (s) => s.evidence_level === 'demonstrated'
  );
  const claimed = data.skill_evidence.filter(
    (s) => s.evidence_level === 'claimed'
  );

  return (
    <div className="space-y-3 text-sm">
      {proven.length > 0 && (
        <div>
          <span className="text-xs font-medium text-green-700 uppercase">
            {t('skillEvidenceProven')} ({proven.length})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {proven.map((s) => (
              <Badge
                key={s.skill_name}
                className="text-xs bg-green-100 text-green-800 border-green-200"
                variant="outline"
              >
                {s.skill_name}
                <span className="ml-1 opacity-60">{s.points}pt</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {demonstrated.length > 0 && (
        <div>
          <span className="text-xs font-medium text-blue-700 uppercase">
            {t('skillEvidenceDemonstrated')} ({demonstrated.length})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {demonstrated.map((s) => (
              <Badge
                key={s.skill_name}
                className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                variant="outline"
              >
                {s.skill_name}
                <span className="ml-1 opacity-60">{s.points}pt</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {claimed.length > 0 && (
        <div>
          <span className="text-xs font-medium text-orange-700 uppercase">
            {t('skillEvidenceClaimed')} ({claimed.length})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {claimed.map((s) => (
              <Badge
                key={s.skill_name}
                className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                variant="outline"
              >
                {s.skill_name}
                <span className="ml-1 opacity-60">{s.points}pt</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.skill_evidence.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No matched skills to analyze depth for.
        </p>
      )}
    </div>
  );
}
