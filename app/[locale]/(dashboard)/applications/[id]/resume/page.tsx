import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication, getResumeVariant } from '@/lib/actions/applications';
import { VariantEditor } from '@/components/resume/VariantEditor';
import { SetBreadcrumbLabel } from '@/components/shared/SetBreadcrumbLabel';

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

  const labels: Record<string, string> = {
    summary: t('summary'),
    experience: t('experience'),
    education: t('education'),
    skills: t('skills'),
    languages: t('languages'),
    certifications: t('certifications'),
    projects: t('projects'),
  };

  return (
    <div className="space-y-4 max-h-full">
      <SetBreadcrumbLabel label={`${application.job_title} · ${application.company}`} />
      {variant ? (
        <VariantEditor
          variant={variant}
          jobApplicationId={id}
          labels={labels}
        />
      ) : (
        <p className="text-muted-foreground">{t('noResume')}</p>
      )}
    </div>
  );
}
