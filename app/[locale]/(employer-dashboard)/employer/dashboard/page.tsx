import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, Eye, Clock, Plus } from 'lucide-react';
import { getJobPostingStats, getJobPostings } from '@/lib/actions/employer-jobs';
import { JobPostingCard } from '@/components/employer/jobs/JobPostingCard';

export default async function EmployerDashboardPage() {
  const t = await getTranslations('employer.dashboard');
  const [stats, recentPostings] = await Promise.all([
    getJobPostingStats(),
    getJobPostings(),
  ]);

  const recent = recentPostings.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href="/employer/jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('postNewJob')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPostings')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activePostings')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalApplicants')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgTimeToFill')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Postings or Empty State */}
      {recent.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('recentPostings')}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/employer/jobs">
                {t('recentPostings')} →
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {recent.map((posting) => (
              <JobPostingCard key={posting.id} posting={posting} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noPostingsYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">{t('getStarted')}</p>
            <Button asChild>
              <Link href="/employer/jobs/new">
                <Plus className="h-4 w-4 mr-2" />
                {t('postNewJob')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
