
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, CalendarCheck, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where,getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface QuickStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  totalUsers: number;
  totalTimetableEntries: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const requestsRef = collection(db, "requests");
        const usersRef = collection(db, "users");
        const timetablesRef = collection(db, "timetables");

        const totalRequestsSnapshot = await getCountFromServer(requestsRef);
        const pendingRequestsSnapshot = await getCountFromServer(query(requestsRef, where("status", "==", "Pending")));
        const approvedRequestsSnapshot = await getCountFromServer(query(requestsRef, where("status", "==", "Approved")));
        const totalUsersSnapshot = await getCountFromServer(usersRef);
        const totalTimetableEntriesSnapshot = await getCountFromServer(timetablesRef);
        
        const studentCountSnapshot = await getCountFromServer(query(usersRef, where("role", "==", "student")));
        const facultyCountSnapshot = await getCountFromServer(query(usersRef, where("role", "==", "faculty")));


        setStats({
          totalRequests: totalRequestsSnapshot.data().count,
          pendingRequests: pendingRequestsSnapshot.data().count,
          approvedRequests: approvedRequestsSnapshot.data().count,
          totalUsers: totalUsersSnapshot.data().count,
          totalTimetableEntries: totalTimetableEntriesSnapshot.data().count,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);


  const quickStatsConfig = [
    { title: "Total Requests", value: stats?.totalRequests, icon: <BarChart className="h-8 w-8 text-primary" />, color: "text-blue-500", href: "/admin/requests" },
    { title: "Pending Approval", value: stats?.pendingRequests, icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />, color: "text-yellow-500" , href: "/admin/requests?status=Pending"},
    { title: "Approved Requests", value: stats?.approvedRequests, icon: <CheckCircle className="h-8 w-8 text-green-500" />, color: "text-green-500", href: "/admin/requests?status=Approved" },
    { title: "Total Users", value: stats?.totalUsers, icon: <Users className="h-8 w-8 text-indigo-500" />, color: "text-indigo-500", href: "/admin/users" },
    { title: "Timetable Entries", value: stats?.totalTimetableEntries, icon: <CalendarCheck className="h-8 w-8 text-purple-500" />, color: "text-purple-500", href: "/admin/timetables" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-headline mb-2">Admin Overview</h2>
        <p className="text-muted-foreground">Key metrics and quick actions for managing the AttendEase system.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickStatsConfig.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value ?? 0}</div>
              )}
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
            <Button asChild variant="outline" size="lg" className="h-auto py-3">
              <Link href="/admin/users" className="flex items-center text-left">
                <Users className="mr-3 h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">Manage Users</p>
                  <p className="text-xs text-muted-foreground">Add, edit, or remove users.</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-3">
              <Link href="/admin/timetables" className="flex items-center text-left">
                <CalendarCheck className="mr-3 h-5 w-5 text-primary shrink-0" />
                 <div>
                  <p className="font-semibold">Manage Timetables</p>
                  <p className="text-xs text-muted-foreground">Upload or modify class schedules.</p>
                </div>
              </Link>
            </Button>
             <Button asChild variant="outline" size="lg" className="h-auto py-3">
              <Link href="/admin/events" className="flex items-center text-left">
                <CalendarCheck className="mr-3 h-5 w-5 text-primary shrink-0" />
                 <div>
                  <p className="font-semibold">Manage Events</p>
                  <p className="text-xs text-muted-foreground">Add or edit pre-approved events.</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-3">
              <Link href="/admin/requests" className="flex items-center text-left">
                <BarChart className="mr-3 h-5 w-5 text-primary shrink-0" />
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
                 {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Users className="h-5 w-5 text-muted-foreground mr-2" />}
                <p>{isLoading ? 'Loading user counts...' : `${stats?.totalUsers ?? 0} total users active.`}</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
