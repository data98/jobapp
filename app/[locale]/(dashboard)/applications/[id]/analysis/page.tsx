import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication, getResumeVariant } from '@/lib/actions/applications';
import { getAnalysis } from '@/lib/actions/analysis';
import { AnalysisContent } from '@/components/analysis/AnalysisContent';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

  const t = await getTranslations('analysis');
  const tc = await getTranslations('common');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/applications/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tc('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {application.job_title} — {application.company}
          </p>
        </div>
      </div>

      <AnalysisContent
        application={application}
        analysis={analysis}
        hasResume={!!variant}
      />
    </div>
  );
}
