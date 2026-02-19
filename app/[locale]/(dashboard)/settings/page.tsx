import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('settings')}</h1>
      <p className="text-muted-foreground">Settings — coming soon.</p>
    </div>
  );
}
