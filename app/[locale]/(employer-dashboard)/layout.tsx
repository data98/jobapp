import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { EmployerSidebar } from '@/components/employer/EmployerSidebar';
import { EmployerNavbar } from '@/components/employer/EmployerNavbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbProvider } from '@/components/shared/BreadcrumbContext';

export default async function EmployerDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/${locale}/employer/login`);
  }

  // Role check: verify this user is actually an employer
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('user')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!user || user.role !== 'employer') {
    // If a seeker accidentally navigates here, send them to seeker dashboard
    redirect(`/${locale}/dashboard`);
  }

  // Fetch organization for sidebar display
  const { data: membership } = await supabase
    .from('organization_member')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single();

  let companyName: string | undefined;
  if (membership) {
    const { data: org } = await supabase
      .from('organization')
      .select('name')
      .eq('id', membership.organization_id)
      .single();
    companyName = org?.name;
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <BreadcrumbProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <EmployerSidebar companyName={companyName} />
        <SidebarInset>
          <EmployerNavbar />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6 pb-2">
            {children}
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
