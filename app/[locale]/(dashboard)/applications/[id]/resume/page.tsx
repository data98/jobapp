import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getApplication, getResumeVariant } from '@/lib/actions/applications';
import { VariantEditor } from '@/components/resume/VariantEditor';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function ResumeVariantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const application = await getApplication(id);
  if (!application) notFound();

  const variant = await getResumeVariant(id);
  const t = await getTranslations('resume');
  const tc = await getTranslations('common');

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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href={`/applications/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tc('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">
            {t('title')} — {application.job_title}
          </h1>
          <p className="text-sm text-muted-foreground">{application.company}</p>
        </div>
      </div>

      {variant ? (
        <VariantEditor
          variant={variant}
          jobApplicationId={id}
          labels={labels}
        />
      ) : (
        <p className="text-muted-foreground">{t('noResume')}</p>
      )}
    </div>
  );
}
