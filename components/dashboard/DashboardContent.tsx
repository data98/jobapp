'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, TrendingUp, Calendar, CheckCircle, Plus } from 'lucide-react';
import { ApplicationCard } from '@/components/applications/ApplicationCard';
import { StatusBreakdownBar } from '@/components/dashboard/StatusBreakdownBar';
import type { JobApplication, ApplicationStatus } from '@/types';

interface DashboardContentProps {
  stats: {
    total: number;
    active: number;
    interviews: number;
    accepted: number;
    byStatus: Record<ApplicationStatus, number>;
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
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      label: t('activeApplications'),
      value: stats.active,
      icon: TrendingUp,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      label: t('interviewsScheduled'),
      value: stats.interviews,
      icon: Calendar,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      label: t('acceptedOffers'),
      value: stats.accepted,
      icon: CheckCircle,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6 py-0">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline breakdown */}
      <StatusBreakdownBar byStatus={stats.byStatus} total={stats.total} />

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
            <div className="flex flex-col gap-3">
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
