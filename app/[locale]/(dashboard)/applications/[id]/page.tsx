import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication } from '@/lib/actions/applications';
import { getAnalysis, getV1Analysis } from '@/lib/actions/analysis';
import { getJDProfile } from '@/lib/actions/jd-profile';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';
import { SetBreadcrumbLabel } from '@/components/shared/SetBreadcrumbLabel';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [application, analysis, v1Analysis, jdProfile] = await Promise.all([
    getApplication(id),
    getAnalysis(id),
    getV1Analysis(id),
    getJDProfile(id),
  ]);
  if (!application) notFound();

  const atsScore = v1Analysis?.ats_score ?? analysis?.ats_score ?? null;

  return (
    <>
      <SetBreadcrumbLabel label={`${application.job_title} · ${application.company}`} />
      <ApplicationDetail
        application={application}
        atsScore={atsScore}
        jdProfile={jdProfile}
      />
    </>
  );
}
