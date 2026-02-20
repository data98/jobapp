import { setRequestLocale } from 'next-intl/server';
import { ApplicationForm } from '@/components/applications/ApplicationForm';

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ApplicationForm />;
}
