'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { signIn } from '@/lib/auth-client';
import { getUserRole } from '@/lib/actions/employer-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function EmployerLoginPage() {
  const t = useTranslations('employerAuth');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(t('loginError'));
        return;
      }

      // Check user role and redirect accordingly
      const role = await getUserRole();
      if (role === 'employer') {
        router.push('/employer/dashboard' as never);
      } else {
        // Seeker trying to use employer login — redirect to seeker dashboard
        router.push('/dashboard' as never);
      }
    } catch {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('login')}</CardTitle>
        <CardDescription>
          {t('noAccount')}{' '}
          <Link
            href="/employer/signup"
            className="underline underline-offset-4 hover:text-primary font-medium"
          >
            {t('signup')}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('workEmail')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{tAuth('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('login')}
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}
