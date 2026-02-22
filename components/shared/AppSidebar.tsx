'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
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
  { labelKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'applications', href: '/applications', icon: Briefcase },
  { labelKey: 'resume', href: '/resume', icon: FileText },
  { labelKey: 'settings', href: '/settings', icon: Settings },
] as const;

export function AppSidebar() {
  const t = useTranslations('nav');
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
      {/* Header: Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">J</span>
                </div>
                <span className="font-semibold text-lg">Jobapp</span>
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
