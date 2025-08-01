"use client";
import AppHeader from "@/components/layout/AppHeader";
import { getCurrentUser } from "@/data/mock-data"; // Mock, replace with actual auth

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = getCurrentUser('faculty');

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader currentRole="faculty" userName={currentUser.name} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
         AttendEase Faculty Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
