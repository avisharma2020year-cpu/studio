
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/shared/AppLogo";
import Link from "next/link";
import { ArrowRight, UserCog, Shield, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Portal = {
  role: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const portals: Portal[] = [
  {
    role: "Student",
    description: "Submit and track your absence requests.",
    href: "/login",
    icon: GraduationCap,
  },
  {
    role: "Faculty",
    description: "Review and approve student requests.",
    href: "/login",
    icon: UserCog,
  },
  {
    role: "Admin",
    description: "Manage users, timetables, and system settings.",
    href: "/login",
    icon: Shield,
  },
];

export default function PortalSelectionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="py-6 px-4 md:px-8 flex justify-center">
        <AppLogo size="lg" />
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-3">Welcome to AttendEase</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            The smart attendance excuse system. Please select your portal to log in.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card key={portal.role} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl overflow-hidden group">
                <CardHeader className="text-center p-8 bg-card">
                  <div className="mb-4 flex justify-center items-center h-16 w-16 bg-primary/10 rounded-full mx-auto">
                      <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-headline">{portal.role} Portal</CardTitle>
                  <CardDescription className="text-base">{portal.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-muted/40">
                  <Button asChild className="w-full text-lg py-6 group-hover:bg-primary/90 transition-colors">
                    <Link href={portal.href}>
                      Login <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <footer className="text-center py-6 text-muted-foreground">
        AttendEase &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
