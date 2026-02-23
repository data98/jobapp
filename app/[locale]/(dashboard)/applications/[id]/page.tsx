import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication } from '@/lib/actions/applications';
import { getAnalysis } from '@/lib/actions/analysis';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';
import { SetBreadcrumbLabel } from '@/components/shared/SetBreadcrumbLabel';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [application, analysis] = await Promise.all([
    getApplication(id),
    getAnalysis(id),
  ]);
  if (!application) notFound();

  return (
    <>
      <SetBreadcrumbLabel label={`${application.job_title} · ${application.company}`} />
      <ApplicationDetail application={application} atsScore={analysis?.ats_score ?? null} />
    </>
  );
}
