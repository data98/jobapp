'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobPostingCard } from './JobPostingCard';
import type { JobPosting, JobPostingStatus } from '@/types';

interface JobPostingListFilterProps {
  postings: JobPosting[];
}

const FILTER_STATUSES: (JobPostingStatus | 'all')[] = ['all', 'draft', 'published', 'paused', 'closed'];

export function JobPostingListFilter({ postings }: JobPostingListFilterProps) {
  const t = useTranslations('employer');
  const tCommon = useTranslations('common');
  const tJobs = useTranslations('employer.jobs');
  const [filter, setFilter] = useState<JobPostingStatus | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return postings;
    return postings.filter((p) => p.status === filter);
  }, [postings, filter]);

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as JobPostingStatus | 'all')}>
        <TabsList>
          {FILTER_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {status === 'all' ? tCommon('all') : t(`statuses.${status}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">{tJobs('noPostings')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((posting) => (
            <JobPostingCard key={posting.id} posting={posting} />
          ))}
        </div>
      )}
    </div>
  );
}
