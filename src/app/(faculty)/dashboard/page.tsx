"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { mockRequests, mockUsers, getCurrentUser } from '@/data/mock-data';
import type { MissedClassRequest, User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCircle, CalendarClock, MessageSquare, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function FacultyDashboardPage() {
  const { toast } = useToast();
  const currentUser = getCurrentUser('faculty'); // Mock current user

  const [requests, setRequests] = useState<MissedClassRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({}); // { requestId: comment }

  useEffect(() => {
    // Simulate fetching requests relevant to this faculty member
    // This logic needs to be robust: check facultyId on request, or match subject with faculty's subjects
    const facultyRequests = mockRequests.filter(req => 
      req.status === 'Pending' && 
      (req.facultyId === currentUser.id || 
       req.missedClasses.some(mc => currentUser.subjects?.includes(mc.subjectName)))
    ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setRequests(facultyRequests);
  }, [currentUser.id, currentUser.subjects]);

  const handleUpdateRequestStatus = (requestId: string, status: 'Approved' | 'Rejected') => {
    const comment = comments[requestId] || '';
    if (status === 'Rejected' && !comment.trim()) {
      toast({ title: "Error", description: "Please provide a comment for rejection.", variant: "destructive" });
      return;
    }

    // Simulate API call
    console.log(`Updating request ${requestId} to ${status} with comment: "${comment}"`);
    
    // Update mock data (in real app, this would be a server action and re-fetch)
    const requestIndex = mockRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      mockRequests[requestIndex].status = status;
      mockRequests[requestIndex].facultyComment = comment;
    }
    
    setRequests(prev => prev.filter(req => req.id !== requestId));
    setComments(prev => {
      const newComments = {...prev};
      delete newComments[requestId];
      return newComments;
    });

    toast({ title: "Success", description: `Request ${status.toLowerCase()} successfully.` });
  };

  const getStudentDetails = (studentId: string): User | undefined => {
    return mockUsers.find(user => user.id === studentId);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center"><Inbox className="mr-3 h-8 w-8 text-primary" />Absence Requests for Approval</CardTitle>
          <CardDescription>Review pending absence requests from students for your subjects.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => {
                const student = getStudentDetails(req.studentId);
                return (
                  <Card key={req.id} className="flex flex-col bg-muted/20">
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
                        <p className="text-sm pl-1">{req.reason}</p>
                      </div>
                      {req.eventId && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Pre-approved Event:</h4>
                           <Badge variant="secondary">{mockEvents.find(e => e.id === req.eventId)?.name || 'Unknown Event'}</Badge>
                        </div>
                      )}
                      <div>
                        <Label htmlFor={`comment-${req.id}`} className="font-semibold text-sm mb-1">Your Comment (Required for Rejection):</Label>
                        <Textarea 
                          id={`comment-${req.id}`}
                          value={comments[req.id] || ''}
                          onChange={(e) => setComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Add a comment..."
                          className="mt-1 min-h-[80px]"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => handleUpdateRequestStatus(req.id, 'Rejected')} className="text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700">
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button onClick={() => handleUpdateRequestStatus(req.id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white">
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
