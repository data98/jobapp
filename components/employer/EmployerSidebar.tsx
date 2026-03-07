'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { labelKey: 'dashboard', href: '/employer/dashboard', icon: LayoutDashboard },
  { labelKey: 'jobPostings', href: '/employer/jobs', icon: Briefcase },
  { labelKey: 'candidates', href: '/employer/candidates', icon: Users },
  { labelKey: 'analytics', href: '/employer/analytics', icon: BarChart3 },
  { labelKey: 'settings', href: '/employer/settings', icon: Settings },
] as const;

interface EmployerSidebarProps {
  companyName?: string;
}

export function EmployerSidebar({ companyName }: EmployerSidebarProps) {
  const t = useTranslations('employerNav');
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const isHoverExpanded = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (!open) {
      isHoverExpanded.current = true;
      setOpen(true);
    }
  }, [open, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (isHoverExpanded.current) {
      isHoverExpanded.current = false;
      setOpen(false);
    }
  }, [setOpen]);

  return (
    <Sidebar
      collapsible="icon"
      side="left"
      variant="sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header: Logo + Company Name */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/employer/dashboard">
                <Image src="/images/logo.svg" alt="Jobapp" width={32} height={32} className="aspect-square size-8 rounded-sm" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{companyName || 'Jobapp'}</span>
                  <span className="text-xs text-muted-foreground">Employer</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ labelKey, href, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={t(labelKey)}
                    >
                      <Link href={href}>
                        <Icon />
                        <span>{t(labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
