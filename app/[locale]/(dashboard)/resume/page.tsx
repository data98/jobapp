import { setRequestLocale } from 'next-intl/server';
import { getMasterResume } from '@/lib/actions/resume';
import { ResumeForm } from '@/components/resume/ResumeForm';

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const masterResume = await getMasterResume();

  return <ResumeForm initialData={masterResume} />;
}
