'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { signUp } from '@/lib/auth-client';
import { completeEmployerSignup } from '@/lib/actions/employer-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

export default function EmployerSignupPage() {
  const t = useTranslations('employerAuth');
  const tAuth = useTranslations('auth');
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Create user via Better Auth
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(t('signupError'));
        return;
      }

      // 2. Complete employer setup (set role, create org)
      await completeEmployerSignup({
        companyName,
        website: companyWebsite || undefined,
        companySize,
      });

      // 3. Redirect to employer dashboard
      router.push('/employer/dashboard' as never);
    } catch {
      setError(t('signupError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('signup')}</CardTitle>
        <CardDescription>
          {t('hasAccount')}{' '}
          <Link
            href="/employer/login"
            className="underline underline-offset-4 hover:text-primary font-medium"
          >
            {t('login')}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{tAuth('name')}</Label>
            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">{t('companyName')}</Label>
            <Input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">{t('companyWebsite')}</Label>
            <Input
              id="companyWebsite"
              type="url"
              placeholder="https://company.com"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companySize">{t('companySize')}</Label>
            <Select value={companySize} onValueChange={setCompanySize} required>
              <SelectTrigger id="companySize" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !companySize}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('signup')}
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}
