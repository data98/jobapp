'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import type { ApplicationStatus } from '@/types';

const colorMap: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('statuses');
  const statusConfig = APPLICATION_STATUSES.find((s) => s.value === status);
  const colorClass = colorMap[statusConfig?.color ?? 'gray'] ?? colorMap.gray;

  return (
    <Badge variant="secondary" className={colorClass}>
      {t(status)}
    </Badge>
  );
}
