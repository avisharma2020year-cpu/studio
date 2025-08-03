
"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// No longer using mock data directly for timetable/events, will be fetched from Firestore
import { getCurrentUser } from '@/data/mock-data'; 
import type { TimetableEntry, PreApprovedEvent, MissedClassRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, Clock, ListPlus, Send, History, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, where, query, addDoc } from 'firebase/firestore';


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


export default function StudentDashboardPage() {
  const { toast } = useToast();
  const currentUser = getCurrentUser('student'); 

  const [isLoading, setIsLoading] = useState(true);
  const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]>>({});
  const [allTimetableEntries, setAllTimetableEntries] = useState<TimetableEntry[]>([]);
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(undefined);
  const [studentRequests, setStudentRequests] = useState<MissedClassRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch Timetable from Firestore
            const timetableQuery = query(collection(db, "timetables"), 
              where("course", "==", currentUser.course), 
              where("semester", "==", currentUser.semester)
            );
            const timetableSnapshot = await getDocs(timetableQuery);
            const userTimetable = timetableSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry));
            
            setAllTimetableEntries(userTimetable);
            setTimetable(groupTimetableByDay(userTimetable));

            // Fetch Events from Firestore
            const eventsSnapshot = await getDocs(collection(db, "events"));
            const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEvent));
            setEvents(eventsData);

            // Fetch student's previous requests
            const requestsQuery = query(collection(db, "requests"), where("studentId", "==", currentUser.id));
            const requestsSnapshot = await getDocs(requestsQuery);
            const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest))
                                     .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setStudentRequests(requestsData);

        } catch (error) {
            console.error("Error fetching data from Firestore:", error);
            toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    fetchInitialData();
  }, [currentUser.course, currentUser.semester, currentUser.id, toast]);

  const handleClassSelection = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmitRequest = async () => {
    if (selectedClasses.length === 0) {
      toast({ title: "Error", description: "Please select at least one class.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for absence.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);

    const selectedClassDetails = selectedClasses.map(classId => {
      return allTimetableEntries.find(cls => cls.id === classId)!;
    });

    const requestsByFaculty = selectedClassDetails.reduce((acc, classDetail) => {
      const facultyId = classDetail.facultyId;
      if (!facultyId) return acc; 
      if (!acc[facultyId]) acc[facultyId] = [];
      acc[facultyId].push({
        classId: classDetail.id,
        subjectName: classDetail.subjectName,
        timeSlot: classDetail.timeSlot,
        day: classDetail.day,
      });
      return acc;
    }, {} as Record<string, MissedClassRequest['missedClasses']>);

    try {
      const requestPromises = Object.entries(requestsByFaculty).map(([facultyId, missedClasses]) => {
          const newRequestPayload = {
            studentId: currentUser.id,
            studentName: currentUser.name,
            studentPrn: currentUser.prn!,
            missedClasses: missedClasses,
            reason,
            eventId: selectedEvent || '',
            timestamp: new Date().toISOString(),
            status: 'Pending' as const,
            facultyId: facultyId,
            facultyComment: ''
          };
          return addDoc(collection(db, "requests"), newRequestPayload);
      });

      await Promise.all(requestPromises);

      toast({ title: "Success", description: `${requestPromises.length} absence request(s) submitted.` });
      // Reset form state
      setSelectedClasses([]);
      setReason('');
      setSelectedEvent(undefined);
      // Refresh requests list
      const requestsQuery = query(collection(db, "requests"), where("studentId", "==", currentUser.id));
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissedClassRequest))
                                     .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setStudentRequests(requestsData);

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

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-3xl font-headline flex items-center"><CalendarDays className="mr-3 h-8 w-8 text-primary" />Weekly Timetable</CardTitle>
          <CardDescription>Select classes you missed and submit an absence request below. Your course: {currentUser.course}, Semester: {currentUser.semester}.</CardDescription>
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
                    {timetable[day].map(entry => (
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
                          <span className="block text-xs text-muted-foreground">Prof. {entry.facultyName}</span>
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
          {studentRequests.length > 0 ? (
            <ul className="space-y-4">
              {studentRequests.slice(0, 3).map(req => ( // Show 3 most recent
                <li key={req.id} className="p-4 border rounded-md bg-background/70 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="flex-grow">
                      <p className="font-semibold text-primary">Request ID: {req.id.substring(req.id.length-6)}</p>
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
          {studentRequests.length > 0 && ( // Always show if any requests exist for consistency
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

    