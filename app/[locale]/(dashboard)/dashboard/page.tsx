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

  const [stats, recentApps] = await Promise.all([
    getApplicationStats(),
    getApplications(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardContent stats={stats} recentApplications={recentApps.slice(0, 5)} />
    </div>
  );
}
