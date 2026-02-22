import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication } from '@/lib/actions/applications';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';
import { SetBreadcrumbLabel } from '@/components/shared/SetBreadcrumbLabel';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <>
      <SetBreadcrumbLabel label={`${application.job_title} · ${application.company}`} />
      <ApplicationDetail application={application} />
    </>
  );
}
