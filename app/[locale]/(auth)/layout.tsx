import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

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
          <Image src="/images/logo.svg" alt={t('appName')} width={28} height={28} className="w-7 h-7 rounded-sm" />
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
