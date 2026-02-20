import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication } from '@/lib/actions/applications';

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const application = await getApplication(id);
  if (!application) notFound();

  const t = await getTranslations('analysis');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>
      <p className="text-muted-foreground">
        {application.job_title} — {application.company}
      </p>
    </div>
  );
}
