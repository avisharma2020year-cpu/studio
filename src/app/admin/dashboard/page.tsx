import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, CalendarCheck, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
// Mock data import - replace with actual data fetching
import { mockRequests, mockUsers, mockTimetable } from "@/data/mock-data";

export default function AdminDashboardPage() {
  const totalRequests = mockRequests.length;
  const pendingRequests = mockRequests.filter(r => r.status === 'Pending').length;
  const approvedRequests = mockRequests.filter(r => r.status === 'Approved').length;
  const totalUsers = mockUsers.length;
  const totalTimetableEntries = mockTimetable.length;

  const quickStats = [
    { title: "Total Requests", value: totalRequests, icon: <BarChart className="h-8 w-8 text-primary" />, color: "text-blue-500", href: "/admin/requests" },
    { title: "Pending Approval", value: pendingRequests, icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />, color: "text-yellow-500" , href: "/admin/requests?status=Pending"},
    { title: "Approved Requests", value: approvedRequests, icon: <CheckCircle className="h-8 w-8 text-green-500" />, color: "text-green-500", href: "/admin/requests?status=Approved" },
    { title: "Total Users", value: totalUsers, icon: <Users className="h-8 w-8 text-indigo-500" />, color: "text-indigo-500", href: "/admin/users" },
    { title: "Timetable Entries", value: totalTimetableEntries, icon: <CalendarCheck className="h-8 w-8 text-purple-500" />, color: "text-purple-500", href: "/admin/timetables" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-headline mb-2">Admin Overview</h2>
        <p className="text-muted-foreground">Key metrics and quick actions for managing the AttendEase system.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              {stat.href && (
                <Link href={stat.href} className="text-xs text-muted-foreground hover:text-primary pt-1">
                  View details &rarr;
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Quick Actions</CardTitle>
            <CardDescription>Perform common administrative tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild variant="outline" size="lg" className="justify-start text-left h-auto py-3">
              <Link href="/admin/users">
                <Users className="mr-3 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Manage Users</p>
                  <p className="text-xs text-muted-foreground">Add, edit, or remove users.</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="justify-start text-left h-auto py-3">
              <Link href="/admin/timetables">
                <CalendarCheck className="mr-3 h-5 w-5 text-primary" />
                 <div>
                  <p className="font-semibold">Manage Timetables</p>
                  <p className="text-xs text-muted-foreground">Upload or modify class schedules.</p>
                </div>
              </Link>
            </Button>
             <Button asChild variant="outline" size="lg" className="justify-start text-left h-auto py-3">
              <Link href="/admin/events">
                <CalendarCheck className="mr-3 h-5 w-5 text-primary" />
                 <div>
                  <p className="font-semibold">Manage Events</p>
                  <p className="text-xs text-muted-foreground">Add or edit pre-approved events.</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="justify-start text-left h-auto py-3">
              <Link href="/admin/requests">
                <BarChart className="mr-3 h-5 w-5 text-primary" />
                 <div>
                  <p className="font-semibold">View Request Logs</p>
                  <p className="text-xs text-muted-foreground">Monitor all absence requests.</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-headline">System Status</CardTitle>
             <CardDescription>A quick glance at system health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p>All systems operational.</p>
             </div>
             <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <p>{mockUsers.filter(u => u.role === 'student').length} Students, {mockUsers.filter(u => u.role === 'faculty').length} Faculty active.</p>
             </div>
             <div className="h-40 relative rounded-md overflow-hidden mt-2">
                <Image src="https://placehold.co/600x300.png" alt="System activity chart placeholder" layout="fill" objectFit="cover" data-ai-hint="data chart" />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
