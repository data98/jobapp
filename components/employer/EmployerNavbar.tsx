'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { UserMenu } from '@/components/shared/UserMenu';
import { useBreadcrumbLabel } from '@/components/shared/BreadcrumbContext';
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

function useEmployerBreadcrumbs(): BreadcrumbEntry[] {
  const pathname = usePathname();
  const { dynamicLabel } = useBreadcrumbLabel();
  const tNav = useTranslations('employerNav');
  const tJobs = useTranslations('employer.jobs');

  const path = pathname.replace(/\/$/, '') || '/';

  // Top-level pages
  if (path === '/employer/dashboard') return [{ label: tNav('dashboard') }];
  if (path === '/employer/jobs') return [{ label: tNav('jobPostings') }];
  if (path === '/employer/candidates') return [{ label: tNav('candidates') }];
  if (path === '/employer/analytics') return [{ label: tNav('analytics') }];
  if (path === '/employer/settings') return [{ label: tNav('settings') }];

  // /employer/jobs/new
  if (path === '/employer/jobs/new') {
    return [
      { label: tNav('jobPostings'), href: '/employer/jobs' },
      { label: tJobs('new') },
    ];
  }

  // /employer/jobs/[id]
  const detailMatch = path.match(/^\/employer\/jobs\/([^/]+)$/);
  if (detailMatch) {
    return [
      { label: tNav('jobPostings'), href: '/employer/jobs' },
      { label: dynamicLabel || tJobs('detail') },
    ];
  }

  return [];
}

export function EmployerNavbar() {
  const breadcrumbs = useEmployerBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 gap-2">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      {/* Mobile: back button + current page (truncated) */}
      {breadcrumbs.length > 0 && (
        <div className="flex min-w-0 items-center gap-1 lg:hidden">
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
        <Breadcrumb className="hidden lg:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
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
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
