import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Target,
  FileText,
  Download,
  Briefcase,
  LayoutTemplate,
  Search,
  Sparkles,
  Send,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  const features = [
    { icon: Brain, title: t('featureAiTitle'), desc: t('featureAiDesc'), colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    { icon: Target, title: t('featureAtsTitle'), desc: t('featureAtsDesc'), colorClass: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    { icon: Sparkles, title: t('featureOptimizeTitle'), desc: t('featureOptimizeDesc'), colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { icon: Download, title: t('featurePdfTitle'), desc: t('featurePdfDesc'), colorClass: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
    { icon: Briefcase, title: t('featureTrackTitle'), desc: t('featureTrackDesc'), colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
    { icon: LayoutTemplate, title: t('featureTemplatesTitle'), desc: t('featureTemplatesDesc'), colorClass: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' },
  ];

  const pillars = [
    {
      icon: Search,
      title: t('pillar1Title'),
      desc: t('pillar1Desc'),
      accent: 'landing-pillar-accent-purple',
    },
    {
      icon: Sparkles,
      title: t('pillar2Title'),
      desc: t('pillar2Desc'),
      accent: 'landing-pillar-accent-blue',
    },
    {
      icon: Send,
      title: t('pillar3Title'),
      desc: t('pillar3Desc'),
      accent: 'landing-pillar-accent-teal',
    },
  ];

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
  ];

  const testimonials = [
    {
      quote: t('testimonial1Quote'),
      author: t('testimonial1Author'),
      role: t('testimonial1Role'),
    },
    {
      quote: t('testimonial2Quote'),
      author: t('testimonial2Author'),
      role: t('testimonial2Role'),
    },
    {
      quote: t('testimonial3Quote'),
      author: t('testimonial3Author'),
      role: t('testimonial3Role'),
    },
  ];

  const steps = [
    { title: t('step1Title'), desc: t('step1Desc'), step: '01' },
    { title: t('step2Title'), desc: t('step2Desc'), step: '02' },
    { title: t('step3Title'), desc: t('step3Desc'), step: '03' },
  ];

  return (
    <>
      {/* ═══════════ Hero ═══════════ */}
      <section className="landing-hero-gradient relative overflow-hidden h-[100vh]">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-[10%] h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-28 md:py-40 text-center">
          <div className="landing-fade-in">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              {t('badge')}
            </Badge>
          </div>

          <h1 className="landing-fade-in landing-fade-in-delay-1 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
            {t('heroTitle')}
          </h1>

          <p className="landing-fade-in landing-fade-in-delay-2 mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="landing-fade-in landing-fade-in-delay-3 flex flex-wrap justify-center gap-3 mt-8">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup">
                {t('ctaPrimary')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <a href="#how-it-works">{t('ctaSecondary')}</a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="landing-fade-in landing-fade-in-delay-4 flex flex-wrap items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
            <span>{t('trustBadge1')}</span>
            <span className="text-border">·</span>
            <span>{t('trustBadge2')}</span>
            <span className="text-border">·</span>
            <span>{t('trustBadge3')}</span>
          </div>
        </div>
      </section>

      {/* ═══════════ Social Proof Stats ═══════════ */}
      <section className="py-16 px-6 border-b">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">
            {t('socialProofHeading')}
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-4xl sm:text-5xl font-bold landing-stat-value">{value}</p>
                <p className="text-muted-foreground mt-2 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Value Proposition Cards ═══════════ */}
      <section className="py-20 md:py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 tracking-tight">
            {t('valuePropHeading')}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1 */}
            <div className="landing-value-card rounded-2xl bg-card p-8 md:p-10">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                {t('valueProp1Eyebrow')}
              </p>
              <h3 className="text-2xl font-bold mb-4">{t('valueProp1Title')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('valueProp1Desc')}</p>
              <div className="mt-6">
                <Button variant="ghost" size="sm" className="group" asChild>
                  <a href="#features">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
            </div>
            {/* Card 2 */}
            <div className="landing-value-card landing-value-card-alt rounded-2xl bg-card p-8 md:p-10">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                {t('valueProp2Eyebrow')}
              </p>
              <h3 className="text-2xl font-bold mb-4">{t('valueProp2Title')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('valueProp2Desc')}</p>
              <div className="mt-6">
                <Button variant="ghost" size="sm" className="group" asChild>
                  <a href="#features">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Platform Pillars ═══════════ */}
      {/* <section id="how-it-works" className="py-20 md:py-28 px-6 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('pillarsHeading')}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('pillarsSubtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className={`landing-pillar-card ${accent} rounded-2xl bg-card p-8 shadow-sm`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ═══════════ How It Works Steps ═══════════ */}
      <section className="py-20 md:py-28 px-6 bg-background overflow-hidden relative">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('howItWorks')}
            </h2>
          </div>

          <div className="flex flex-col gap-16 md:gap-32">
            {/* Step 1 */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-24 items-center relative">
              <div className="flex flex-col gap-4 max-w-xl">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">{t('step1Title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{t('step1Desc')}</p>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    t('step1Bullet1'),
                    t('step1Bullet2'),
                    t('step1Bullet3'),
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-500 shrink-0" />
                      <span className="text-md text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative w-full">
                <div className="w-full rounded-2xl bg-muted/30 p-[0.35rem] shadow-sm border md:rounded-3xl lg:w-[160%] z-10">
                  <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl border bg-background shadow-sm">
                    <img
                      alt="Step 1 light mockup"
                      src="/images/how-it-works/step1-light.png"
                      width={3024}
                      height={1888}
                      className="w-full h-auto dark:hidden"
                    />
                    <img
                      alt="Step 1 dark mockup"
                      src="/images/how-it-works/step1-dark.png"
                      width={3024}
                      height={1888}
                      className="w-full h-auto hidden dark:block"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-24 items-center relative">
              <div className="flex flex-col gap-4 max-w-xl lg:order-last">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-2">
                  <Briefcase className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">{t('step2Title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{t('step2Desc')}</p>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    t('step2Bullet1'),
                    t('step2Bullet2'),
                    t('step2Bullet3'),
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-500 shrink-0" />
                      <span className="text-md text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative w-full">
                <div className="w-full rounded-2xl bg-muted/30 p-[0.35rem] shadow-sm border md:rounded-3xl lg:w-[160%] lg:-ml-[60%] z-10">
                  <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl border bg-background shadow-sm">
                    <img
                      alt="Step 2 light mockup"
                      src="/images/how-it-works/step2-light.png"
                      width={3024}
                      height={1888}
                      className="w-full h-auto dark:hidden"
                    />
                    <img
                      alt="Step 2 dark mockup"
                      src="/images/how-it-works/step2-dark.png"
                      width={3024}
                      height={1888}
                      className="w-full h-auto hidden dark:block"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-24 items-center relative">
              <div className="flex flex-col gap-4 max-w-xl">
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">{t('step3Title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{t('step3Desc')}</p>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    t('step3Bullet1'),
                    t('step3Bullet2'),
                    t('step3Bullet3'),
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500 shrink-0" />
                      <span className="text-md text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative w-full">
                <div className="w-full rounded-2xl bg-muted/30 p-[0.35rem] shadow-sm border md:rounded-3xl lg:w-[160%] z-10">
                  <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl border bg-background shadow-sm">
                    <img
                      alt="Step 3 light mockup"
                      src="/images/how-it-works/step3-light.png"
                      width={3024}
                      height={1888}
                      className="w-full h-auto dark:hidden"
                    />
                    <img
                      alt="Step 3 dark mockup"
                      src="/images/how-it-works/step3-dark.png"
                      width={3024}
                      height={1888}
                      className="w-full h-auto hidden dark:block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Feature Bento Grid ═══════════ */}
      <section id="features" className="py-20 md:py-28 px-6 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('featuresHeading')}
            </h2>
            <p className="text-muted-foreground text-lg">{t('featuresSubtitle')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, colorClass }) => (
              <div
                key={title}
                className="landing-card rounded-2xl bg-card border p-6 sm:p-8"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Testimonials ═══════════ */}
      <section id="testimonials" className="py-20 md:py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 tracking-tight">
            {t('testimonialsHeading')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ quote, author, role }) => (
              <div
                key={author}
                className="landing-testimonial-card rounded-2xl bg-card border p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                    {author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{author}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Final CTA ═══════════ */}
      <section className="landing-cta-gradient py-20 md:py-28 px-6 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t('ctaHeading')}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            {t('ctaSubtitle')}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="h-12 px-8 text-base"
            asChild
          >
            <Link href="/signup">
              {t('ctaPrimary')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
