'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, TrendingUp, Calendar, CheckCircle, Plus } from 'lucide-react';
import { ApplicationCard } from '@/components/applications/ApplicationCard';
import type { JobApplication } from '@/types';

interface DashboardContentProps {
  stats: {
    total: number;
    active: number;
    interviews: number;
    accepted: number;
  };
  recentApplications: JobApplication[];
}

export function DashboardContent({ stats, recentApplications }: DashboardContentProps) {
  const t = useTranslations('dashboard');

  const statCards = [
    {
      label: t('totalApplications'),
      value: stats.total,
      icon: Briefcase,
    },
    {
      label: t('activeApplications'),
      value: stats.active,
      icon: TrendingUp,
    },
    {
      label: t('interviewsScheduled'),
      value: stats.interviews,
      icon: Calendar,
    },
    {
      label: t('acceptedOffers'),
      value: stats.accepted,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('recentApplications')}</CardTitle>
          {recentApplications.length > 0 && (
            <Link href="/applications">
              <Button variant="ghost" size="sm">
                {t('viewAll')}
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">{t('noApplicationsYet')}</p>
              <p className="text-sm text-muted-foreground">{t('getStarted')}</p>
              <Link href="/applications/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addApplication')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
