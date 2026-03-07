'use client';

import { useTranslations } from 'next-intl';
import { useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { JobPostingStatusBadge } from './JobPostingStatusBadge';
import { MapPin, Users, Eye } from 'lucide-react';
import type { JobPosting } from '@/types';

interface JobPostingCardProps {
  posting: JobPosting;
}

export function JobPostingCard({ posting }: JobPostingCardProps) {
  const t = useTranslations('employer.jobs');
  const format = useFormatter();

  const locationLabel = [
    posting.location,
    posting.location_type ? t(
      posting.location_type === 'remote' ? 'remote' :
      posting.location_type === 'hybrid' ? 'hybrid' : 'onsite'
    ) : null,
  ].filter(Boolean).join(' · ');

  return (
    <Link href={`/employer/jobs/${posting.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{posting.title}</h3>
              <JobPostingStatusBadge status={posting.status} />
            </div>
            {locationLabel && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </p>
            )}
            {posting.employment_type && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  posting.employment_type === 'full-time' ? 'fullTime' :
                  posting.employment_type === 'part-time' ? 'partTime' :
                  posting.employment_type === 'contract' ? 'contract' : 'internship'
                )}
                {posting.department ? ` · ${posting.department}` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {posting.applications_count}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {posting.views_count}
            </span>
            <span className="text-xs">
              {format.dateTime(new Date(posting.created_at), {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
