import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>© {year} {t('appName')}. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t('appName')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
