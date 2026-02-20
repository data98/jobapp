import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { getApplicationStats, getApplications } from '@/lib/actions/applications';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  const [stats, recentApps] = await Promise.all([
    getApplicationStats(),
    getApplications(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <DashboardContent stats={stats} recentApplications={recentApps.slice(0, 5)} />
    </div>
  );
}
