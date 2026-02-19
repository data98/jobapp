import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('dashboard')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Dashboard content will be built in Phase 3 */}
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">Dashboard coming soon.</p>
        </div>
      </div>
    </div>
  );
}
