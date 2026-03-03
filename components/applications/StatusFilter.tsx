'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import type { ApplicationStatus } from '@/types';

interface StatusFilterProps {
  value: ApplicationStatus | 'all';
  onChange: (status: ApplicationStatus | 'all') => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const t = useTranslations('statuses');
  const tc = useTranslations('common');

  const allOptions = [
    { value: 'all' as const, label: tc('all') },
    ...APPLICATION_STATUSES.map((s) => ({ value: s.value, label: t(s.value) })),
  ];

  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="sm:hidden">
        <Select value={value} onValueChange={(v) => onChange(v as ApplicationStatus | 'all')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <div className="hidden sm:block">
        <Tabs value={value} onValueChange={(v) => onChange(v as ApplicationStatus | 'all')}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {allOptions.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
