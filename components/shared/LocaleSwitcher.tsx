'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next as 'en' | 'ru' });
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((l) => (
        <Button
          key={l}
          variant={locale === l ? 'default' : 'ghost'}
          size="sm"
          className="h-7 px-2 text-xs font-medium uppercase"
          onClick={() => switchLocale(l)}
        >
          {l}
        </Button>
      ))}
    </div>
  );
}
