"use client";
import AppHeader from "@/components/layout/AppHeader";
import { getCurrentUser } from "@/data/mock-data"; // Mock, replace with actual auth

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In a real app, user data would come from context/session
  const currentUser = getCurrentUser('student'); 

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader currentRole="student" userName={currentUser.name} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
         AttendEase Student Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
