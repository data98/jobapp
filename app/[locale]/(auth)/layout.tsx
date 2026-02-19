import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('common');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">J</span>
          </div>
          <span>{t('appName')}</span>
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
