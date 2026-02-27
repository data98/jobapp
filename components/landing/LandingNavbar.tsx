'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function LandingNavbar() {
  const t = useTranslations('landing');
  const tAuth = useTranslations('auth');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-3">
        <nav className="flex h-14 items-center justify-between rounded-2xl border bg-background/80 backdrop-blur-xl px-4 shadow-sm">
          {/* Left — Brand */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg shrink-0">
            <Image src="/images/logo.svg" alt="Jobapp" width={32} height={32} className="h-8 w-8 rounded-sm" />
            <span>Jobapp</span>
          </Link>

          {/* Center — Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm absolute left-1/2 -translate-x-1/2">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navHowItWorks')}
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navFeatures')}
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navTestimonials')}
            </a>
          </div>

          {/* Right — Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <LocaleSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{tAuth('login')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">{tAuth('signup')}</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 rounded-2xl border bg-background/95 backdrop-blur-xl p-4 shadow-lg space-y-3">
            <a
              href="#features"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('navFeatures')}
            </a>
            <a
              href="#how-it-works"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('navHowItWorks')}
            </a>
            <a
              href="#testimonials"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('navTestimonials')}
            </a>
            <div className="flex items-center gap-2 pt-2 border-t">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">{tAuth('login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{tAuth('signup')}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
