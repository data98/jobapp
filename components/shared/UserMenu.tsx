'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { signOut } from '@/lib/auth-client';
import { useSession } from '@/hooks/use-session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function UserMenu() {
  const t = useTranslations('nav');
  const { user } = useSession();
  const router = useRouter();
  const locale = useLocale();

  async function handleSignOut() {
    await signOut();
    router.push('/login', { locale: locale as 'en' | 'ru' });
  }

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <p className="text-sm font-medium leading-none truncate">
            {user.name || user.email}
          </p>
          {user.name && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" asChild>
          <button className="w-full cursor-pointer" onClick={() => router.push('/settings', { locale: locale as 'en' | 'ru' })}>
            <User className="h-4 w-4" />
            {t('settings')}
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" asChild>
          <button className="w-full cursor-pointer" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
