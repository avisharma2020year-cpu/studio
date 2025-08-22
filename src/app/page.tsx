
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLogo from '@/components/shared/AppLogo';
import { Users, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import type { UserRole } from '@/lib/types';

export default function HomePage() {
  const portals: { role: UserRole, title: string, description: string, href: string, icon: JSX.Element, image: string, imageHint: string }[] = [
    {
      role: 'student',
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Student Portal',
      description: 'Access your timetable, submit absence requests, and track their status.',
      href: '/login?role=student',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'students classroom'
    },
    {
      role: 'faculty',
      icon: <UserCheck className="h-10 w-10 text-primary" />,
      title: 'Faculty Portal',
      description: 'Review and manage absence requests for your assigned subjects.',
      href: '/login?role=faculty',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'teacher lecture'
    },
    {
      role: 'admin',
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: 'Admin Dashboard',
      description: 'Manage users, timetables, events, and view system-wide request logs.',
      href: '/login?role=admin',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'admin dashboard'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="py-6 px-4 md:px-8 flex justify-center">
        <AppLogo size="lg" />
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-16">
        <section className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-foreground">
            Welcome to AttendEase
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your streamlined solution for managing student attendance excuses. Select your portal to get started.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          {portals.map((portal) => (
            <Card key={portal.role} className="flex flex-col overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl">
              <CardHeader className="p-0">
                <Image 
                  src={portal.image} 
                  alt={`${portal.title} illustration`} 
                  width={600} 
                  height={400} 
                  className="w-full h-48 object-cover"
                  data-ai-hint={portal.imageHint}
                />
              </CardHeader>
              <CardContent className="flex flex-col flex-grow p-6">
                <div className="flex items-center mb-4">
                  {portal.icon}
                  <CardTitle className="ml-3 text-2xl font-headline">{portal.title}</CardTitle>
                </div>
                <CardDescription className="mb-6 text-base flex-grow">
                  {portal.description}
                </CardDescription>
                <Button asChild className="mt-auto w-full group bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href={portal.href}>
                    Login as {portal.title.split(' ')[0]} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="py-8 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
