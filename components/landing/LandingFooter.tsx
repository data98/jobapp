import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';

export function LandingFooter() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Image src="/images/logo.svg" alt="Jobapp" width={32} height={32} className="h-8 w-8 rounded-lg" />
              <span>{tCommon('appName')}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('product')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">{t('features')}</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">{t('howItWorks')}</a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-foreground transition-colors">{t('testimonials')}</a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('account')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">{t('signIn')}</Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">{t('createAccount')}</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">{t('privacyPolicy')}</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">{t('termsOfService')}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-xs text-muted-foreground">
          <p>&copy; {year} {tCommon('appName')}. {tCommon('allRightsReserved')}</p>
          <p>{t('tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
