'use client';

import { useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import type { JobApplication, ApplicationStatus } from '@/types';

const iconBgMap: Record<string, string> = {
  gray: 'bg-gray-500/10',
  blue: 'bg-blue-500/10',
  indigo: 'bg-indigo-500/10',
  yellow: 'bg-yellow-500/10',
  orange: 'bg-orange-500/10',
  green: 'bg-green-500/10',
  red: 'bg-red-500/10',
};

const iconColorMap: Record<string, string> = {
  gray: 'text-gray-500',
  blue: 'text-blue-500',
  indigo: 'text-indigo-500',
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
  red: 'text-red-500',
};

function getStatusColor(status: ApplicationStatus): string {
  return APPLICATION_STATUSES.find((s) => s.value === status)?.color ?? 'gray';
}

interface ApplicationCardProps {
  application: JobApplication;
  atsScore?: number | null;
}

export function ApplicationCard({ application, atsScore }: ApplicationCardProps) {
  const format = useFormatter();

  return (
    <Link href={`/applications/${application.id}`}>
      <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4 py-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgMap[getStatusColor(application.status)]}`}>
            <Briefcase className={`h-5 w-5 ${iconColorMap[getStatusColor(application.status)]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{application.job_title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {application.company}
              {application.location ? ` · ${application.location}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              {atsScore != null && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    atsScore >= 75 ? 'bg-green-100 text-green-800' :
                    atsScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    atsScore >= 40 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  ATS {atsScore}
                </span>
              )}
              <StatusBadge status={application.status} />
            </div>
            <span className="text-xs text-muted-foreground">
              {format.dateTime(new Date(application.created_at), {
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
