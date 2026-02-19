import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Brain, Target, FileText, Download, Briefcase, LayoutTemplate } from 'lucide-react';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  const steps = [
    { title: t('step1Title'), desc: t('step1Desc'), step: '01' },
    { title: t('step2Title'), desc: t('step2Desc'), step: '02' },
    { title: t('step3Title'), desc: t('step3Desc'), step: '03' },
  ];

  const features = [
    { icon: Brain, title: 'AI Analysis', desc: 'GPT-4o analyzes your resume against any job description' },
    { icon: Target, title: 'ATS Scoring', desc: 'Instant ATS score so you know where you stand' },
    { icon: FileText, title: 'One-Click Optimize', desc: 'Accept AI rewrites with a single click' },
    { icon: Download, title: 'PDF Export', desc: 'Download a polished resume in seconds' },
    { icon: Briefcase, title: 'Application Tracking', desc: 'Track every application from bookmarked to accepted' },
    { icon: LayoutTemplate, title: 'Multiple Templates', desc: 'Choose from Classic, Modern, or Minimal layouts' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-32 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <Badge variant="secondary" className="mb-2">AI-Powered</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href="/signup">{t('ctaPrimary')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">{t('ctaSecondary')}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ title, desc, step }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  {step}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <div className="mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="text-3xl font-bold">{t('heroTitle')}</h2>
          <p className="opacity-80">{t('heroSubtitle')}</p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">{t('ctaPrimary')}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
