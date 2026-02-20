import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication, getResumeVariant } from '@/lib/actions/applications';

export default async function ResumeVariantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const application = await getApplication(id);
  if (!application) notFound();

  const variant = await getResumeVariant(id);
  const t = await getTranslations('resume');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">
        {t('title')} — {application.job_title}
      </h1>
      {variant ? (
        <p className="text-muted-foreground">
          {application.company}
        </p>
      ) : (
        <p className="text-muted-foreground">{t('noResume')}</p>
      )}
    </div>
  );
}
