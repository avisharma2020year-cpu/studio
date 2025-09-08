"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/hooks/use-auth';
import type { MissedClassRequest, PreApprovedEvent } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCircle, CalendarClock, MessageSquare, Inbox, Loader2, BookOpen } from 'lucide-react';
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
  const [classes, setClasses] = useState<any[]>([]); // 👈 Faculty's timetable
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchFacultyData = async () => {
    if (!currentUser?.name) return;
    setIsLoading(true);
    try {
      // ---- Fetch Requests ----
      const requestsQuery = query(
        collection(db, "requests"),
        where("approverName", "==", currentUser.name),
        where("status", "==", "Pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest));
      setRequests(requestData);

      // ---- Fetch Events ----
      const eventsSnapshot = await getDocs(collection(db, "events"));
      setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent)));

      // ---- Fetch Faculty Timetable ----
      const classesQuery = query(
        collection(db, "timetables"),
        where("facultyName", "==", currentUser.name)
      );
      const classesSnapshot = await getDocs(classesQuery);
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
  }, [isClient, currentUser]);

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
      await fetchFacultyData();
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
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Faculty Classes */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <BookOpen className="mr-3 h-8 w-8 text-primary" /> My Classes
          </CardTitle>
          <CardDescription>Your scheduled classes from the uploaded timetable.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map(cls => (
                <Card key={cls.id} className="p-4 bg-muted/20 rounded-lg shadow">
                  <p className="font-semibold">{cls.subjectName}</p>
                  <p>{cls.day} | {cls.timeSlot}</p>
                  <p>Course: {cls.course} | Semester: {cls.semester}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No classes assigned to you.</p>
          )}
        </CardContent>
      </Card>

      {/* Absence Requests */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Inbox className="mr-3 h-8 w-8 text-primary" /> Absence Requests for Approval
          </CardTitle>
          <CardDescription>Review pending absence requests assigned to you.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => {
                return (
                  <Card key={req.id} className="flex flex-col bg-muted/20 shadow-md rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-headline flex items-center">
                        <UserCircle className="mr-2 h-6 w-6 text-primary" /> Request from: {req.studentName}
                      </CardTitle>
                      <CardDescription>PRN: {req.studentPrn} | Submitted: {format(new Date(req.timestamp), 'MMM dd, yyyy HH:mm')}</CardDescription>
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
                           <Badge variant="secondary" className="text-sm">{getEventName(req.eventId)}</Badge>
                        </div>
                      )}
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
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-3 pt-4 border-t mt-auto">
                      <Button variant="outline" onClick={() => handleUpdateRequestStatus(req.id, 'Rejected')} className="text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300" disabled={isLoading}>
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button onClick={() => handleUpdateRequestStatus(req.id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 dark:text-green-950" disabled={isLoading}>
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No pending requests assigned to you at the moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
