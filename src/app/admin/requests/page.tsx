
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MissedClassRequest, PreApprovedEvent, RequestStatus } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { ListChecks, Search, Filter, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminRequestLogsPage() {
  const [requests, setRequests] = useState<MissedClassRequest[]>([]);
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const requestsSnapshot = await getDocs(collection(db, "requests"));
        const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest))
                                     .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRequests(requestsData);

        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.studentPrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.missedClasses.some(mc => mc.subjectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: MissedClassRequest['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-red-500 mr-1.5" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500 mr-1.5" />;
      default: return null;
    }
  };

  const getStatusBadgeVariant = (status: RequestStatus): "default" | "secondary" | "destructive" | "outline" => {
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
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><ListChecks className="mr-2 h-6 w-6 text-primary" />Absence Request Logs</CardTitle>
          <CardDescription>View and filter all student absence requests in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by student, PRN, subject..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>PRN</TableHead>
                  <TableHead>Missed Classes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Faculty Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="font-medium">{req.studentName}</TableCell>
                    <TableCell>{req.studentPrn}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-xs">
                        {req.missedClasses.map(mc => (
                          <li key={mc.classId} className="whitespace-nowrap">{`${mc.subjectName} (${mc.day.substring(0,3)} ${mc.timeSlot})`}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>{getEventName(req.eventId)}</TableCell>
                    <TableCell>
                       <Badge variant={getStatusBadgeVariant(req.status)} className="flex items-center whitespace-nowrap">
                        {getStatusIcon(req.status)}
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{req.facultyComment || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No requests found matching your criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
