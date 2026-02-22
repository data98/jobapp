'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ApplicationCard } from './ApplicationCard';
import { StatusFilter } from './StatusFilter';
import type { JobApplication, ApplicationStatus } from '@/types';

interface ApplicationListProps {
  applications: JobApplication[];
}

export function ApplicationList({ applications }: ApplicationListProps) {
  const t = useTranslations('applications');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <Link href="/applications/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('new')}
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">{t('noApplications')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
