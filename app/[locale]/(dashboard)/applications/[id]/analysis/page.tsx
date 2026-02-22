import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication, getResumeVariant } from '@/lib/actions/applications';
import { getAnalysis } from '@/lib/actions/analysis';
import { AnalysisContent } from '@/components/analysis/AnalysisContent';
import { SetBreadcrumbLabel } from '@/components/shared/SetBreadcrumbLabel';

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const application = await getApplication(id);
  if (!application) notFound();

  const [analysis, variant] = await Promise.all([
    getAnalysis(id),
    getResumeVariant(id),
  ]);

  return (
    <div className="space-y-6">
      <SetBreadcrumbLabel label={`${application.job_title} · ${application.company}`} />
      <AnalysisContent
        application={application}
        analysis={analysis}
        hasResume={!!variant}
      />
    </div>
  );
}
