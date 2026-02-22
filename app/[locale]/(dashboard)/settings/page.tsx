import { setRequestLocale } from 'next-intl/server';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <p className="text-muted-foreground">Settings — coming soon.</p>
    </div>
  );
}
