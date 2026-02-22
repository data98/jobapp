import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication, getResumeVariant } from '@/lib/actions/applications';
import { getAnalysis } from '@/lib/actions/analysis';
import { getMasterResume } from '@/lib/actions/resume';
import { ResumeViewPage } from '@/components/resume-view/ResumeViewPage';
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

  const [variant, analysis, masterResume] = await Promise.all([
    getResumeVariant(id),
    getAnalysis(id),
    getMasterResume(),
  ]);

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
    <div className="h-full">
      <SetBreadcrumbLabel label={`${application.job_title} · ${application.company}`} />
      {variant ? (
        <ResumeViewPage
          application={application}
          variant={variant}
          masterResume={masterResume}
          analysis={analysis}
          labels={labels}
        />
      ) : (
        <p className="text-muted-foreground">{t('noResume')}</p>
      )}
    </div>
  );
}
