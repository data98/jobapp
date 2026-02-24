'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function LandingNavbar() {
  const t = useTranslations('landing');
  const tAuth = useTranslations('auth');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-3">
        <nav className="flex h-14 items-center justify-between rounded-2xl border bg-background/80 backdrop-blur-xl px-4 shadow-sm">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <span>Jobapp</span>
          </Link>
          <div className="ml-3 flex items-center gap-4">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{tAuth('login')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">{t('ctaPrimary')}</Link>
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
              Features
            </a>
            <a
              href="#how-it-works"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Testimonials
            </a>
            <div className="flex items-center gap-2 pt-2 border-t">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">{tAuth('login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t('ctaPrimary')}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
