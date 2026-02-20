'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import type { ApplicationStatus } from '@/types';

interface StatusFilterProps {
  value: ApplicationStatus | 'all';
  onChange: (status: ApplicationStatus | 'all') => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const t = useTranslations('statuses');
  const tc = useTranslations('common');

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ApplicationStatus | 'all')}>
      <TabsList className="flex flex-wrap h-auto gap-1">
        <TabsTrigger value="all">{tc('all')}</TabsTrigger>
        {APPLICATION_STATUSES.map((status) => (
          <TabsTrigger key={status.value} value={status.value}>
            {t(status.value)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
