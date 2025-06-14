"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockRequests, getCurrentUser } from '@/data/mock-data';
import type { MissedClassRequest } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, ListFilter, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

export default function MyRequestsPage() {
  const currentUser = getCurrentUser('student');
  const [requests, setRequests] = useState<MissedClassRequest[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  useEffect(() => {
    const userRequests = mockRequests.filter(req => req.studentId === currentUser.id);
    setRequests(userRequests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [currentUser.id]);

  const filteredRequests = requests.filter(req => {
    if (filter === 'All') return true;
    return req.status === filter;
  });

  const getStatusIcon = (status: MissedClassRequest['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };
  
  const getStatusBadgeVariant = (status: MissedClassRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved': return 'default'; // Will use primary color
      case 'Rejected': return 'destructive';
      case 'Pending': return 'secondary'; // Will use yellow-ish if themed
      default: return 'outline';
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center"><FileText className="mr-3 h-8 w-8 text-primary" />My Absence Requests</CardTitle>
          <CardDescription>View the status of all your submitted absence requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center space-x-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by status:</span>
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(statusFilter => (
              <Button
                key={statusFilter}
                variant={filter === statusFilter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(statusFilter)}
                className={filter === statusFilter ? 'bg-primary text-primary-foreground' : ''}
              >
                {statusFilter}
              </Button>
            ))}
          </div>

          {filteredRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Missed Classes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Faculty Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-sm">
                        {req.missedClasses.map(mc => (
                          <li key={mc.classId}>{`${mc.subjectName} (${mc.day} ${mc.timeSlot})`}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(req.status)} className="flex items-center gap-1.5 whitespace-nowrap">
                        {getStatusIcon(req.status)}
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{req.facultyComment || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No requests match the current filter.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
