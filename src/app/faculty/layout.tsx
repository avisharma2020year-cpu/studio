"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from "@/components/layout/AppHeader";
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && (!user || user.role !== 'faculty')) {
      router.replace('/login?role=faculty');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'faculty') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
         AttendEase Faculty Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
