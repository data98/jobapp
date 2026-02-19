import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('applications');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>
      <p className="text-muted-foreground">{t('noApplications')}</p>
    </div>
  );
}
