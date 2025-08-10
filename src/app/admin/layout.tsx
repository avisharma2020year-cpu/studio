"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from "@/components/layout/AppHeader";
import AdminSidebarNav from "@/components/layout/AdminSidebarNav";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import AppLogo from "@/components/shared/AppLogo";
import { Button } from '@/components/ui/button';
import { Bell, UserCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/login?role=admin');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-4 border-b">
            <div className="group-data-[collapsible=icon]:hidden">
                <AppLogo size="md" />
            </div>
             <div className="hidden group-data-[collapsible=icon]:block text-center">
                <AppLogo size="sm" />
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <AdminSidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col bg-muted/30">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center">
              <SidebarTrigger className="md:hidden mr-2" />
              <h1 className="text-lg font-semibold md:text-xl font-headline hidden md:block">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full" disabled>
                <Bell className="h-5 w-5" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
              <AppHeader />
            </div>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
          <footer className="py-4 px-6 text-center text-sm text-muted-foreground border-t">
            AttendEase Admin Panel &copy; {new Date().getFullYear()}
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
