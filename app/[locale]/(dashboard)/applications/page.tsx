import { setRequestLocale } from 'next-intl/server';
import { getApplications } from '@/lib/actions/applications';
import { getAtsScoresForApplications } from '@/lib/actions/analysis';
import { ApplicationList } from '@/components/applications/ApplicationList';

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [applications, atsScores] = await Promise.all([
    getApplications(),
    getAtsScoresForApplications(),
  ]);

  return <ApplicationList applications={applications} atsScores={atsScores} />;
}
