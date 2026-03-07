import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { Navbar } from '@/components/shared/Navbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbProvider } from '@/components/shared/BreadcrumbContext';
import { NavigationGuardProvider } from '@/components/shared/NavigationGuardProvider';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Role check: verify this user is a seeker, not an employer
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('user')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (user?.role === 'employer') {
    redirect(`/${locale}/employer/dashboard`);
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <NavigationGuardProvider>
      <BreadcrumbProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <Navbar />
            <main className="flex-1 overflow-y-auto bg-muted/30 p-6 pb-2">
              {children}
            </main>
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
      </BreadcrumbProvider>
    </NavigationGuardProvider>
  );
}
