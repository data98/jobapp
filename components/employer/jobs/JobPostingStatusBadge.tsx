'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { JOB_POSTING_STATUSES } from '@/constants/employer-statuses';
import type { JobPostingStatus } from '@/types';

const colorMap: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface JobPostingStatusBadgeProps {
  status: JobPostingStatus;
}

export function JobPostingStatusBadge({ status }: JobPostingStatusBadgeProps) {
  const t = useTranslations('employer.statuses');
  const config = JOB_POSTING_STATUSES.find((s) => s.value === status);
  const colorClass = colorMap[config?.color ?? 'gray'] ?? colorMap.gray;

  return (
    <Badge variant="secondary" className={colorClass}>
      {t(status)}
    </Badge>
  );
}
