'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ApplicationStatus } from '@/types';

const barColorMap: Record<string, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

const dotColorMap: Record<string, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

interface StatusBreakdownBarProps {
  byStatus: Record<ApplicationStatus, number>;
  total: number;
}

export function StatusBreakdownBar({ byStatus, total }: StatusBreakdownBarProps) {
  const t = useTranslations('dashboard');
  const ts = useTranslations('statuses');

  if (total === 0) return null;

  const segments = APPLICATION_STATUSES
    .filter((s) => byStatus[s.value] > 0)
    .map((s) => ({
      status: s.value,
      count: byStatus[s.value],
      color: s.color,
      percent: (byStatus[s.value] / total) * 100,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('pipeline')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <TooltipProvider delayDuration={0}>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {segments.map((seg) => (
              <Tooltip key={seg.status}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/applications?status=${seg.status}`}
                    className={`${barColorMap[seg.color]} transition-opacity hover:opacity-80 block`}
                    style={{ width: `${seg.percent}%`, minWidth: seg.percent > 0 ? '6px' : undefined }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <span>{ts(seg.status)}: {seg.count}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {APPLICATION_STATUSES.map((s) => {
            const count = byStatus[s.value];
            return (
              <Link
                key={s.value}
                href={`/applications?status=${s.value}`}
                className={`flex items-center gap-1.5 text-xs transition-opacity ${count === 0 ? 'opacity-40' : 'hover:opacity-70'}`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${dotColorMap[s.color]}`} />
                <span className="text-muted-foreground">{ts(s.value)}</span>
                <span className="font-medium">{count}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
