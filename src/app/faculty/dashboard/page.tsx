
"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from '@/data/mock-data';
import type { MissedClassRequest, PreApprovedEvent } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCircle, CalendarClock, MessageSquare, Inbox, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';


export default function FacultyDashboardPage() {
  const { toast } = useToast();
  const currentUser = getCurrentUser('faculty'); 

  const [requests, setRequests] = useState<MissedClassRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({}); // { requestId: comment }
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFacultyData = async () => {
    setIsLoading(true);
    try {
      if (!currentUser || !currentUser.subjects || currentUser.subjects.length === 0) {
        setRequests([]);
        return;
      }
      
      const [requestsSnapshot, eventsSnapshot] = await Promise.all([
          query(collection(db, "requests"), where("status", "==", "Pending"), where("facultyId", "==", currentUser.id)),
          getDocs(collection(db, "events"))
      ]);

      const requestsDocs = await getDocs(requestsSnapshot);
      const facultyRequests = requestsDocs.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest))
        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setRequests(facultyRequests);
      setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent)));

    } catch (error) {
      console.error("Error fetching faculty requests:", error);
      toast({ title: "Error", description: "Could not load requests.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFacultyData();
  }, []);

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
            status: status,
            facultyComment: comment,
        });

        toast({ title: "Success", description: `Request ${status.toLowerCase()} successfully.` });
        await fetchFacultyData(); // Refresh list

    } catch (error) {
        console.error("Error updating request status:", error);
        toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
   const getEventName = (eventId?: string) => {
    if (!eventId) return 'N/A';
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center"><Inbox className="mr-3 h-8 w-8 text-primary" />Absence Requests for Approval</CardTitle>
          <CardDescription>Review pending absence requests from students for your subjects.</CardDescription>
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
            <p className="text-muted-foreground text-center py-10">No pending requests at the moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
