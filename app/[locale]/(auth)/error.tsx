'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tc = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <p className="text-lg text-muted-foreground">{tc('error')}</p>
      <Button onClick={reset}>{tc('retry')}</Button>
    </div>
  );
}
