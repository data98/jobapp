import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { FileText } from 'lucide-react';

export function LandingFooter() {
  const t = useTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span>{t('appName')}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered resume optimization platform. Tailor your resume for every job, maximize your ATS score, and land more interviews.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">Create Account</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-xs text-muted-foreground">
          <p>© {year} {t('appName')}. {t('allRightsReserved')}</p>
          <p>Built with AI for job seekers everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
