'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useBreadcrumbLabel } from './BreadcrumbContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronLeft } from 'lucide-react';
import { Fragment } from 'react';

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

function useBreadcrumbs(): BreadcrumbEntry[] {
  const pathname = usePathname();
  const { dynamicLabel } = useBreadcrumbLabel();
  const tNav = useTranslations('nav');
  const tApps = useTranslations('applications');
  const tResume = useTranslations('resume');
  const path = pathname.replace(/\/$/, '') || '/';
  const appLabel = dynamicLabel || tApps('detail');

  // Top-level pages — single breadcrumb
  if (path === '/dashboard') return [{ label: tNav('dashboard') }];
  if (path === '/applications') return [{ label: tApps('title') }];
  if (path === '/resume') return [{ label: tResume('title') }];
  if (path === '/settings') return [{ label: tNav('settings') }];

  // /applications/new
  if (path === '/applications/new') {
    return [
      { label: tApps('title'), href: '/applications' },
      { label: tApps('new') },
    ];
  }

  // /applications/[id]
  const detailMatch = path.match(/^\/applications\/([^/]+)$/);
  if (detailMatch) {
    return [
      { label: tApps('title'), href: '/applications' },
      { label: appLabel },
    ];
  }

  // /applications/[id]/resume
  const resumeMatch = path.match(/^\/applications\/([^/]+)\/resume$/);
  if (resumeMatch) {
    return [
      { label: tApps('title'), href: '/applications' },
      { label: appLabel, href: `/applications/${resumeMatch[1]}` },
      { label: tResume('tailoredTitle') },
    ];
  }

  return [];
}

interface NavbarProps {
  showSidebarTrigger?: boolean;
}

export function Navbar({ showSidebarTrigger = true }: NavbarProps) {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 gap-2">
      {showSidebarTrigger && (
        <>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
        </>
      )}
      {/* Mobile: back button + current page (truncated) */}
      {breadcrumbs.length > 0 && (
        <div className="flex min-w-0 items-center gap-1 sm:hidden">
          {breadcrumbs.length > 1 && (
            <Link href={breadcrumbs[breadcrumbs.length - 2].href!} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          <span className="truncate text-sm font-normal">
            {breadcrumbs[breadcrumbs.length - 1].label}
          </span>
        </div>
      )}
      {/* Desktop: full breadcrumb trail */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className="max-w-48">
                    {isLast ? (
                      <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href!} className="truncate">{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
