import { setRequestLocale } from 'next-intl/server';
import { getApplications } from '@/lib/actions/applications';
import { ApplicationList } from '@/components/applications/ApplicationList';

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const applications = await getApplications();

  return <ApplicationList applications={applications} />;
}
