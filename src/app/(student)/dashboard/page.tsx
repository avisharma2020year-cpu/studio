"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTimetable, mockEvents, getCurrentUser, mockRequests } from '@/data/mock-data';
import type { TimetableEntry, PreApprovedEvent, MissedClassRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, Clock, ListPlus, Send } from 'lucide-react';

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
  const currentUser = getCurrentUser('student'); // Mock current user

  const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]>>({});
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(undefined);
  const [studentRequests, setStudentRequests] = useState<MissedClassRequest[]>([]);

  useEffect(() => {
    // Simulate fetching data
    const userTimetable = mockTimetable.filter(
      entry => entry.course === currentUser.course && entry.semester === currentUser.semester
    );
    setTimetable(groupTimetableByDay(userTimetable));
    setEvents(mockEvents);
    setStudentRequests(mockRequests.filter(req => req.studentId === currentUser.id));
  }, [currentUser.course, currentUser.semester, currentUser.id]);

  const handleClassSelection = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmitRequest = () => {
    if (selectedClasses.length === 0) {
      toast({ title: "Error", description: "Please select at least one class.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for absence.", variant: "destructive" });
      return;
    }

    const newRequestId = `req${Date.now()}`;
    const missedClassDetails = selectedClasses.map(classId => {
      const entry = Object.values(timetable).flat().find(cls => cls.id === classId);
      return { 
        classId: entry!.id, 
        subjectName: entry!.subjectName, 
        timeSlot: entry!.timeSlot,
        day: entry!.day
      };
    });

    const newRequest: MissedClassRequest = {
      id: newRequestId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentPrn: currentUser.prn!,
      missedClasses: missedClassDetails,
      reason,
      eventId: selectedEvent,
      timestamp: new Date().toISOString(),
      status: 'Pending',
      facultyId: Object.values(timetable).flat().find(cls => cls.id === selectedClasses[0])?.facultyId // Simplified logic for demo
    };

    // Simulate API call
    console.log("Submitting request:", newRequest);
    // Add to mock data (in real app, this would be a server action)
    mockRequests.push(newRequest); 
    setStudentRequests(prev => [...prev, newRequest]);

    toast({ title: "Success", description: "Absence request submitted successfully." });
    setSelectedClasses([]);
    setReason('');
    setSelectedEvent(undefined);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center"><CalendarDays className="mr-3 h-8 w-8 text-primary" />Weekly Timetable</CardTitle>
          <CardDescription>Select classes you missed and submit an absence request below.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(timetable).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {daysOrder.filter(day => timetable[day] && timetable[day].length > 0).map(day => (
                <Card key={day} className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-headline text-primary">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timetable[day].map(entry => (
                      <div key={entry.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`class-${entry.id}`} 
                          checked={selectedClasses.includes(entry.id)}
                          onCheckedChange={() => handleClassSelection(entry.id)}
                          aria-label={`Select class ${entry.subjectName} at ${entry.timeSlot}`}
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><ListPlus className="mr-3 h-7 w-7 text-primary" />Submit Absence Request</CardTitle>
          <CardDescription>Fill in the details for your missed classes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="reason" className="text-lg font-medium">Reason for Absence</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Medical appointment, family emergency, etc." 
              className="mt-2 min-h-[100px]" 
            />
          </div>
          <div>
            <Label htmlFor="event" className="text-lg font-medium">Pre-approved Event (Optional)</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event" className="mt-2">
                <SelectValue placeholder="Select an event if applicable" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmitRequest} size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send className="mr-2 h-5 w-5" /> Submit Request
          </Button>
        </CardContent>
      </Card>
      
      {/* Optionally, display recent requests here or on a separate "My Requests" page */}
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Clock className="mr-3 h-7 w-7 text-primary" /> My Recent Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentRequests.length > 0 ? (
            <ul className="space-y-4">
              {studentRequests.slice(-3).reverse().map(req => (
                <li key={req.id} className="p-4 border rounded-md bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Request ID: {req.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.missedClasses.map(mc => `${mc.subjectName} (${mc.day} ${mc.timeSlot})`).join(', ')}
                      </p>
                      <p className="text-sm">Reason: {req.reason}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center
                      ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'}`}>
                      {req.status === 'Approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {req.status}
                    </span>
                  </div>
                   {req.facultyComment && <p className="text-sm mt-1 pt-1 border-t border-dashed">Faculty Comment: {req.facultyComment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No requests submitted yet.</p>
          )}
          {studentRequests.length > 3 && (
            <Button variant="link" className="mt-4" onClick={() => { /* Navigate to /student/my-requests */ }}>
              View All Requests
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
