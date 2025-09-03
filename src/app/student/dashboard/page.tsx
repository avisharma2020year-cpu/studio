
"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/use-auth';
import type { TimetableEntry, PreApprovedEvent, MissedClassRequest, User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, Clock, ListPlus, Send, History, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, orderBy, limit, doc } from 'firebase/firestore';

// Helper to group timetable by day
const groupTimetableByDay = (timetable: TimetableEntry[]) => {
  return timetable.reduce((acc, entry) => {
    const day = entry.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);
};

const daysOrder: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const staticApprovers = [
  { id: 'Dr. Ravi Kiran', name: 'Dr. Ravi Kiran' },
  { id: 'Dr. Ishaq Ahmed Dar', name: 'Dr. Ishaq Ahmed Dar' },
  { id: 'Dr. Rajnikanth', name: 'Dr. Rajnikanth' },
  { id: 'Dr. Disha Pathak', name: 'Dr. Disha Pathak' },
  { id: 'Dr. Meera', name: 'Dr. Meera' },
  { id: 'Dr. Syed Masroor', name: 'Dr. Syed Masroor' },
];


export default function StudentDashboardPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]>>({});
  const [allTimetableEntries, setAllTimetableEntries] = useState<TimetableEntry[]>([]);
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(undefined);
  const [studentRequests, setStudentRequests] = useState<MissedClassRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<string | undefined>(undefined);
  const [otherApproverName, setOtherApproverName] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser?.course || !currentUser?.semester) {
          setIsLoading(false);
          return; // Early exit if essential user data is missing
      }
      setIsLoading(true);
      try {
          const timetableQuery = query(
            collection(db, "timetables"),
            where("course", "==", currentUser.course),
            where("semester", "==", currentUser.semester)
          );
          
          const timetableSnapshot = await getDocs(timetableQuery);
          const userTimetable = timetableSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry));
          
          setAllTimetableEntries(userTimetable);
          setTimetable(groupTimetableByDay(userTimetable));
          
          const requestsQuery = query(
            collection(db, "requests"), 
            where("studentId", "==", currentUser.id),
            orderBy("timestamp", "desc"),
            limit(3)
          );
          const requestsSnapshot = await getDocs(requestsQuery);
          const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest));
          setStudentRequests(requestsData);

          const eventsSnapshot = await getDocs(collection(db, "events"));
          setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent)));

      } catch (error) {
          console.error("Error fetching student data:", error);
          toast({ title: "Error", description: "Could not load your dashboard data.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
    };
    if (currentUser) {
        fetchStudentData();
    }
  }, [toast, currentUser]);

  const handleClassSelection = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmitRequest = async () => {
    if (!currentUser) {
        toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
        return;
    }

    if (selectedClasses.length === 0) {
      toast({ title: "Error", description: "Please select at least one class.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for absence.", variant: "destructive" });
      return;
    }
    if (!selectedApprover) {
        toast({ title: "Error", description: "Please select a faculty member to approve your request.", variant: "destructive"});
        return;
    }
     if (selectedApprover === 'other' && !otherApproverName.trim()) {
      toast({ title: "Error", description: "Please enter the name of the 'Other' approver.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const selectedClassDetails = selectedClasses.map(classId => {
      const cls = allTimetableEntries.find(c => c.id === classId)!;
      return { classId: cls.id, subjectName: cls.subjectName, timeSlot: cls.timeSlot, day: cls.day };
    });

    const approver = staticApprovers.find(a => a.id === selectedApprover);
    const approverName = selectedApprover === 'other' ? otherApproverName : approver?.name;
    const facultyIdForRequest = selectedApprover === 'other' ? 'admin-queue' : selectedApprover;

    const newRequest: Omit<MissedClassRequest, 'id'> = {
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentPrn: currentUser.prn || 'N/A',
        missedClasses: selectedClassDetails,
        reason,
        eventId: selectedEvent || '',
        timestamp: new Date().toISOString(),
        status: 'Pending' as const,
        facultyId: facultyIdForRequest,
        facultyComment: '',
        approverName: approverName,
    };

    try {
        const docRef = await addDoc(collection(db, "requests"), newRequest);
        toast({ title: "Success", description: `Absence request submitted to ${approverName}.` });
        
        const newReqDoc = { id: docRef.id, ...newRequest };
        setStudentRequests(prev => [newReqDoc as MissedClassRequest, ...prev]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3));
        
        setSelectedClasses([]);
        setReason('');
        setSelectedEvent(undefined);
        setSelectedApprover(undefined);
        setOtherApproverName('');
    } catch (error) {
        console.error("Error submitting request:", error);
        toast({ title: "Submission Failed", description: "Could not submit your request.", variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };

  const getStatusBadgeClasses = (status: MissedClassRequest['status']) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

   const getStatusIcon = (status: MissedClassRequest['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="mr-1.5 h-3.5 w-3.5" />;
      case 'Pending': return <Clock className="mr-1.5 h-3.5 w-3.5" />;
      case 'Rejected': return <XCircle className="mr-1.5 h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const getEventName = (eventId?: string) => {
    if (!eventId) return 'N/A';
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  };
  
  const studentInfo = currentUser 
    ? `Your course: ${currentUser.course}, Semester: ${currentUser.semester}.`
    : "Loading student data...";

  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-3xl font-headline flex items-center"><CalendarDays className="mr-3 h-8 w-8 text-primary" />Weekly Timetable</CardTitle>
          <CardDescription>Select classes you missed and submit an absence request below. {studentInfo}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
             <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : Object.keys(timetable).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {daysOrder.filter(day => timetable[day] && timetable[day].length > 0).map(day => (
                <Card key={day} className="bg-background/50 shadow-md rounded-lg">
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-xl font-headline text-primary">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timetable[day].sort((a,b) => a.timeSlot.localeCompare(b.timeSlot)).map(entry => (
                      <div key={entry.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors shadow-sm">
                        <Checkbox
                          id={`class-${entry.id}`}
                          checked={selectedClasses.includes(entry.id)}
                          onCheckedChange={() => handleClassSelection(entry.id)}
                          aria-label={`Select class ${entry.subjectName} at ${entry.timeSlot}`}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor={`class-${entry.id}`} className="flex-grow cursor-pointer">
                          <span className="block font-semibold">{entry.subjectName}</span>
                          <span className="block text-sm text-muted-foreground">{entry.timeSlot}</span>
                          <span className="block text-xs text-muted-foreground">Prof. {entry.facultyName || 'N/A'}</span>
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Your timetable is not yet available. Please check back later or contact administration.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl">
        <CardHeader  className="bg-muted/30">
          <CardTitle className="text-2xl font-headline flex items-center"><ListPlus className="mr-3 h-7 w-7 text-primary" />Submit Absence Request</CardTitle>
          <CardDescription>Fill in the details for your missed classes. Selected: {selectedClasses.length} class(es).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label htmlFor="reason" className="text-lg font-medium">Reason for Absence</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Medical appointment, family emergency, etc."
              className="mt-2 min-h-[100px] shadow-sm"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="event" className="text-lg font-medium">Pre-approved Event (Optional)</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event" className="mt-2 shadow-sm">
                <SelectValue placeholder="Select an event if applicable" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="approver" className="text-lg font-medium">Request Approval From</Label>
            <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                 <SelectTrigger id="approver" className="mt-2 shadow-sm">
                    <SelectValue placeholder="Select a faculty member..." />
                </SelectTrigger>
                <SelectContent>
                    {staticApprovers.map(approver => (
                        <SelectItem key={approver.id} value={approver.id}>{approver.name}</SelectItem>
                    ))}
                     <SelectItem value="other">Other (Admin/Warden)</SelectItem>
                </SelectContent>
            </Select>
          </div>

          {selectedApprover === 'other' && (
              <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="other-approver" className="text-lg font-medium">Name of Approver</Label>
                  <Input
                    id="other-approver"
                    value={otherApproverName}
                    onChange={(e) => setOtherApproverName(e.target.value)}
                    placeholder="e.g., AO Sir, Warden"
                    className="shadow-sm"
                  />
              </div>
          )}

          <Button onClick={handleSubmitRequest} size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </CardContent>
      </Card>

       <Card className="shadow-lg rounded-xl">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-2xl font-headline flex items-center">
            <History className="mr-3 h-7 w-7 text-primary" /> My Recent Requests
          </CardTitle>
           <CardDescription>A quick look at your latest absence request submissions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : studentRequests.length > 0 ? (
            <ul className="space-y-4">
              {studentRequests.map(req => ( 
                <li key={req.id} className="p-4 border rounded-md bg-background/70 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="flex-grow">
                      <p className="font-semibold text-primary">Request to: {req.approverName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submitted: {new Date(req.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-1">
                        Classes: {req.missedClasses.map(mc => `${mc.subjectName}`).join(', ')}
                      </p>
                      <p className="text-sm mt-1">Reason: <span className="text-muted-foreground">{req.reason}</span></p>
                      {req.eventId && <p className="text-sm mt-1">Event: <span className="text-muted-foreground">{getEventName(req.eventId)}</span></p>}
                    </div>
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center self-start sm:self-center whitespace-nowrap ${getStatusBadgeClasses(req.status)}`}>
                      {getStatusIcon(req.status)}
                      {req.status}
                    </span>
                  </div>
                   {req.facultyComment && <p className="text-sm mt-2 pt-2 border-t border-dashed text-muted-foreground italic">Faculty Comment: "{req.facultyComment}"</p>}
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-muted-foreground text-center py-6">No requests submitted yet.</p>
          )}
          {studentRequests.length > 0 && (
            <Button variant="link" asChild className="mt-4 px-0 text-primary">
              <Link href="/student/my-requests">
                View All My Requests &rarr;
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
