
"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/hooks/use-auth';
import type { MissedClassRequest, PreApprovedEvent, RequestStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCircle, CalendarClock, MessageSquare, Inbox, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

export default function FacultyDashboardPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [requests, setRequests] = useState<MissedClassRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchFacultyData = async () => {
    if (!currentUser?.name) return;
    setIsLoading(true);
    try {
      // ---- Fetch All Requests for this faculty member ----
      const requestsQuery = query(
        collection(db, "requests"),
        where("approverName", "==", currentUser.name)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestData = requestsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by most recent
      setRequests(requestData);

      // ---- Fetch Events ----
      const eventsSnapshot = await getDocs(collection(db, "events"));
      setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent)));

    } catch (error) {
      console.error("Error fetching faculty data:", error);
      toast({ title: "Error", description: "Could not load your dashboard data.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient && currentUser) {
      fetchFacultyData();
    }
  }, [isClient, currentUser, toast]);

  const handleUpdateRequestStatus = async (requestId: string, status: 'Approved' | 'Rejected') => {
    const comment = comments[requestId] || '';
    if (status === 'Rejected' && !comment.trim()) {
      toast({ title: "Error", description: "Please provide a comment for rejection.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const requestDocRef = doc(db, "requests", requestId);
      await updateDoc(requestDocRef, {
        status,
        facultyComment: comment
      });
      toast({ title: "Success", description: `Request ${status.toLowerCase()} successfully.` });
      await fetchFacultyData(); // Refresh the list
    } catch (error) {
      console.error("Error updating request:", error);
      toast({ title: "Error", description: "Could not update the request status.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  };

  const getEventName = (eventId?: string) => {
    if (!eventId) return 'N/A';
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  };

  const getStatusBadgeVariant = (status: RequestStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Rejected': return 'destructive';
      case 'Pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4 mr-1.5" />;
      case 'Rejected': return <XCircle className="h-4 w-4 mr-1.5" />;
      case 'Pending': return <Clock className="h-4 w-4 mr-1.5" />;
      default: return null;
    }
  };

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Inbox className="mr-3 h-8 w-8 text-primary" /> Absence Requests
          </CardTitle>
          <CardDescription>Review pending and completed absence requests assigned to you.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => {
                return (
                  <Card key={req.id} className="flex flex-col bg-muted/20 shadow-md rounded-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                           <CardTitle className="text-xl font-headline flex items-center">
                            <UserCircle className="mr-2 h-6 w-6 text-primary" /> {req.studentName}
                          </CardTitle>
                          <CardDescription>PRN: {req.studentPrn} | {format(new Date(req.timestamp), 'MMM dd, yyyy')}</CardDescription>
                        </div>
                         <Badge variant={getStatusBadgeVariant(req.status)} className="flex items-center whitespace-nowrap">
                            {getStatusIcon(req.status)}
                            {req.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-grow">
                      <div>
                        <h4 className="font-semibold text-sm mb-1 flex items-center"><CalendarClock className="mr-1.5 h-4 w-4 text-muted-foreground"/>Missed Classes:</h4>
                        <ul className="list-disc list-inside pl-1 text-sm space-y-0.5">
                          {req.missedClasses.map(mc => (
                            <li key={mc.classId}>{mc.subjectName} ({mc.day} {mc.timeSlot})</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1 flex items-center"><MessageSquare className="mr-1.5 h-4 w-4 text-muted-foreground"/>Reason:</h4>
                        <p className="text-sm pl-1 bg-background/50 p-2 rounded-md border">{req.reason}</p>
                      </div>
                      {req.eventId && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Pre-approved Event:</h4>
                           <Badge variant="outline" className="text-sm">{getEventName(req.eventId)}</Badge>
                        </div>
                      )}
                      
                      {req.status === 'Pending' ? (
                        <div className="pt-2">
                          <Label htmlFor={`comment-${req.id}`} className="font-semibold text-sm mb-1">Your Comment (Required for Rejection):</Label>
                          <Textarea
                            id={`comment-${req.id}`}
                            value={comments[req.id] || ''}
                            onChange={(e) => setComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="Add a comment..."
                            className="mt-1 min-h-[80px] bg-background"
                            disabled={isLoading}
                          />
                        </div>
                      ) : (
                        req.facultyComment && (
                           <div className="pt-2">
                             <h4 className="font-semibold text-sm mb-1">Your Comment:</h4>
                             <p className="text-sm pl-1 bg-background/50 p-2 rounded-md border italic text-muted-foreground">"{req.facultyComment}"</p>
                           </div>
                        )
                      )}
                    </CardContent>
                    {req.status === 'Pending' && (
                      <CardFooter className="flex justify-end space-x-3 pt-4 border-t mt-auto">
                        <Button variant="outline" onClick={() => handleUpdateRequestStatus(req.id, 'Rejected')} className="text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700" disabled={isLoading}>
                          <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button onClick={() => handleUpdateRequestStatus(req.id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No absence requests assigned to you.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
