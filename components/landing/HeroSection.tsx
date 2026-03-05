'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function HeroSection() {
  const t = useTranslations('landing');
  const words = t('heroRotatingWords').split(',');
  const [currentIndex, setCurrentIndex] = useState(0);

  const rotate = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % words.length);
  }, [words.length]);

  useEffect(() => {
    const interval = setInterval(rotate, 2000);
    return () => clearInterval(interval);
  }, [rotate]);

  return (
    <section className="landing-hero-gradient relative overflow-hidden min-h-[100vh] flex items-center">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-10 right-[10%] h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-28 md:py-40 text-center">
        <div className="landing-fade-in">
          <Badge variant="secondary" className="mb-4 sm:mb-6 px-4 py-1.5 text-sm font-medium">
            {t('badge')}
          </Badge>
        </div>

        <h1 className="landing-fade-in landing-fade-in-delay-1 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
          <span className="block sm:inline text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 sm:mb-0">{t('heroTitleStatic')}</span>{' '}
          <span className="relative inline-block overflow-hidden h-[1.15em] align-bottom w-full">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={words[currentIndex]}
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -150, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 50 }}
                className="absolute inset-x-0 text-primary"
              >
                {words[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        <p className="landing-fade-in landing-fade-in-delay-2 mt-8 sm:mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t('heroSubtitle')}
        </p>

        <div className="landing-fade-in landing-fade-in-delay-3 flex flex-wrap justify-center gap-3 mt-10 sm:mt-8">
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
        <div className="landing-fade-in landing-fade-in-delay-4 flex flex-wrap items-center justify-center gap-2 mt-10 sm:mt-8 text-sm text-muted-foreground">
          <span>{t('trustBadge1')}</span>
          <span className="text-border">·</span>
          <span>{t('trustBadge2')}</span>
          <span className="text-border">·</span>
          <span>{t('trustBadge3')}</span>
        </div>
      </div>
    </section>
  );
}
