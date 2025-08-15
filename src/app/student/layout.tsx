
"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from "@/components/layout/AppHeader";
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished before checking for user
    if (!loading) {
      if (!user || user.role !== 'student') {
        // If no user or wrong role, redirect to login
        router.replace('/login?role=student');
      }
    }
  }, [user, loading, router]);

  // While loading, or if the user is not a student, show a loader.
  // This prevents content flashing before the redirect happens.
  if (loading || !user || user.role !== 'student') {
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
         AttendEase Student Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
