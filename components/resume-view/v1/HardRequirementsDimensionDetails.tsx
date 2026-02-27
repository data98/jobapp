'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { V1HardRequirementsResult } from '@/types';

interface HardRequirementsDimensionDetailsProps {
  data: V1HardRequirementsResult;
}

export function HardRequirementsDimensionDetails({
  data,
}: HardRequirementsDimensionDetailsProps) {
  const t = useTranslations('resumeView.matching');

  return (
    <div className="space-y-3 text-sm">
      {/* Education */}
      <div className="flex items-start gap-2">
        {data.education.met ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
        )}
        <div>
          <span className="font-medium">
            {data.education.met ? t('educationMet') : t('educationNotMet')}
          </span>
          <div className="text-xs text-muted-foreground mt-0.5">
            {data.education.required.length > 0 ? (
              data.education.required.map((req, idx) => (
                <span key={idx}>
                  {req.level !== 'any' ? req.level.replace('_', ' ') : 'Any'}{' '}
                  {req.field && `in ${req.field}`}{' '}
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {req.importance}
                  </Badge>
                </span>
              ))
            ) : (
              <span>No education requirements listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Certifications */}
      {data.certifications.total_required > 0 && (
        <div className="flex items-start gap-2">
          {data.certifications.missing.length === 0 ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-medium">
              {t('certsMet', {
                matched: data.certifications.matched.length,
                total: data.certifications.total_required,
              })}
            </span>
            {data.certifications.missing.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {data.certifications.missing.map((cert, idx) => (
                  <Badge key={idx} variant="destructive" className="text-xs">
                    {cert}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Years of Experience */}
      <div className="flex items-start gap-2">
        {data.years_of_experience.met ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
        )}
        <div>
          <span className="font-medium">{t('yearsRequired')}</span>
          <div className="text-xs text-muted-foreground mt-0.5">
            {data.years_of_experience.required_min != null
              ? `${data.years_of_experience.required_min}+ years required, ${data.years_of_experience.candidate_has} years found`
              : 'No minimum years requirement'}
          </div>
        </div>
      </div>
    </div>
  );
}
