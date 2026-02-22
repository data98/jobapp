'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
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
  const tAnalysis = useTranslations('analysis');

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

  // /applications/[id]/analysis
  const analysisMatch = path.match(/^\/applications\/([^/]+)\/analysis$/);
  if (analysisMatch) {
    return [
      { label: tApps('title'), href: '/applications' },
      { label: appLabel, href: `/applications/${analysisMatch[1]}` },
      { label: tAnalysis('title') },
    ];
  }

  // /applications/[id]/resume
  const resumeMatch = path.match(/^\/applications\/([^/]+)\/resume$/);
  if (resumeMatch) {
    return [
      { label: tApps('title'), href: '/applications' },
      { label: appLabel, href: `/applications/${resumeMatch[1]}` },
      { label: tResume('title') },
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
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href!}>{crumb.label}</Link>
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
        <UserMenu />
      </div>
    </header>
  );
}
