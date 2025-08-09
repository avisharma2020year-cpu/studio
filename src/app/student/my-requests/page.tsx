"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { MissedClassRequest, PreApprovedEvent } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, ListFilter, FileText, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export default function MyRequestsPage() {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<MissedClassRequest[]>([]);
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const requestsQuery = query(
          collection(db, "requests"),
          where("studentId", "==", currentUser.id),
          orderBy("timestamp", "desc")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        setRequests(requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest)));

        const eventsSnapshot = await getDocs(collection(db, "events"));
        setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent)));
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  const filteredRequests = requests.filter(req => {
    if (filter === 'All') return true;
    return req.status === filter;
  });

  const getStatusIcon = (status: MissedClassRequest['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusBadgeVariant = (status: MissedClassRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Rejected': return 'destructive';
      case 'Pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getEventName = (eventId?: string) => {
    if (!eventId) return 'N/A';
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-3xl font-headline flex items-center"><FileText className="mr-3 h-8 w-8 text-primary" />My Absence Requests</CardTitle>
          <CardDescription>View the status of all your submitted absence requests.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center space-x-2 border-b pb-4">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(statusFilter => (
              <Button
                key={statusFilter}
                variant={filter === statusFilter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(statusFilter)}
                className={`transition-colors duration-150 ${filter === statusFilter ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/80'}`}
              >
                {statusFilter}
              </Button>
            ))}
          </div>

          {isLoading ? (
             <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Date Submitted</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Missed Classes</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Faculty Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(req => (
                    <TableRow key={req.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs">{format(new Date(req.timestamp), 'dd MMM yyyy, HH:mm')}</TableCell>
                      <TableCell className="font-medium">{req.approverName}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                          {req.missedClasses.map(mc => (
                            <li key={mc.classId} className="whitespace-nowrap">{`${mc.subjectName} (${mc.day.substring(0,3)} ${mc.timeSlot})`}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{req.reason}</TableCell>
                      <TableCell className="text-xs">{getEventName(req.eventId)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(req.status)} className="flex items-center gap-1.5 whitespace-nowrap text-xs py-1 px-2">
                          {getStatusIcon(req.status)}
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs italic text-muted-foreground">{req.facultyComment || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No requests match the current filter. Try selecting 'All'.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
