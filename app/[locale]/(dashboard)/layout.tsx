import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { Navbar } from '@/components/shared/Navbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbProvider } from '@/components/shared/BreadcrumbContext';

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

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <BreadcrumbProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
