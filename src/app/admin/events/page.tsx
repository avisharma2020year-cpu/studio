"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mockEvents } from '@/data/mock-data';
import type { PreApprovedEvent } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit2, Trash2, CalendarPlus } from 'lucide-react';

const initialNewEventState: Omit<PreApprovedEvent, 'id'> = {
  name: '',
  description: '',
};

export default function AdminEventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<PreApprovedEvent[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PreApprovedEvent | null>(null);
  const [formData, setFormData] = useState<Omit<PreApprovedEvent, 'id'>>(initialNewEventState);

  useEffect(() => {
    setEvents(mockEvents); // Load initial mock data
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const openFormForEdit = (event: PreApprovedEvent) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
    });
    setIsFormOpen(true);
  };
  
  const openFormForNew = () => {
    setEditingEvent(null);
    setFormData(initialNewEventState);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      toast({ title: "Error", description: "Event Name and Description are required.", variant: "destructive" });
      return;
    }

    if (editingEvent) {
      const updatedEvents = events.map(e => e.id === editingEvent.id ? { ...editingEvent, ...formData } : e);
      setEvents(updatedEvents);
      const mockIndex = mockEvents.findIndex(e => e.id === editingEvent.id);
      if (mockIndex !== -1) mockEvents[mockIndex] = { ...editingEvent, ...formData };
      toast({ title: "Success", description: "Event updated successfully." });
    } else {
      const newEvent: PreApprovedEvent = { id: `event${Date.now()}`, ...formData };
      setEvents(prev => [...prev, newEvent]);
      mockEvents.push(newEvent);
      toast({ title: "Success", description: "Event added successfully." });
    }
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
     if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      const mockIndex = mockEvents.findIndex(e => e.id === eventId);
      if (mockIndex !== -1) mockEvents.splice(mockIndex, 1);
      toast({ title: "Success", description: "Event deleted successfully." });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><CalendarPlus className="mr-2 h-6 w-6 text-primary" />Pre-approved Event Management</CardTitle>
            <CardDescription>Manage events that students can select when submitting absence requests.</CardDescription>
          </div>
          <Button onClick={openFormForNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
          </Button>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(event => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell className="max-w-md truncate">{event.description}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openFormForEdit(event)} aria-label="Edit event">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteEvent(event.id)} aria-label="Delete event">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No pre-approved events found. Add one to get started.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update the details for this event.' : 'Fill in the details for the new pre-approved event.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Event Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3 min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingEvent ? 'Save Changes' : 'Add Event'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
