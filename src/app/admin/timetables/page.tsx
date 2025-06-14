"use client";
import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { mockTimetable, mockUsers } from '@/data/mock-data';
import type { TimetableEntry } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit2, Trash2, Upload, CalendarDays, Filter } from 'lucide-react';

const initialNewTimetableEntryState: Omit<TimetableEntry, 'id'> = {
  day: 'Monday',
  timeSlot: '',
  subjectName: '',
  facultyName: '',
  facultyId: '',
  course: '',
  semester: 1,
};

const daysOfWeek: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminTimetablesPage() {
  const { toast } = useToast();
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: string, name: string }[]>([]);
  
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formData, setFormData] = useState<Omit<TimetableEntry, 'id'>>(initialNewTimetableEntryState);

  useEffect(() => {
    setTimetableEntries(mockTimetable); // Load initial mock data
    setFacultyList(mockUsers.filter(u => u.role === 'faculty').map(f => ({ id: f.id, name: f.name })));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'semester' ? (value ? parseInt(value) : 1) : value }));
  };
  
  const handleSelectChange = (name: keyof Omit<TimetableEntry, 'id'>, value: string) => {
    if (name === 'facultyId') {
      const selectedFaculty = facultyList.find(f => f.id === value);
      setFormData(prev => ({ ...prev, facultyId: value, facultyName: selectedFaculty?.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openFormForEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      day: entry.day,
      timeSlot: entry.timeSlot,
      subjectName: entry.subjectName,
      facultyName: entry.facultyName,
      facultyId: entry.facultyId,
      course: entry.course,
      semester: entry.semester,
    });
    setIsFormOpen(true);
  };
  
  const openFormForNew = () => {
    setEditingEntry(null);
    setFormData(initialNewTimetableEntryState);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.day || !formData.timeSlot || !formData.subjectName || !formData.facultyId || !formData.course || !formData.semester) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    if (editingEntry) {
      const updatedEntries = timetableEntries.map(e => e.id === editingEntry.id ? { ...editingEntry, ...formData } : e);
      setTimetableEntries(updatedEntries);
      const mockIndex = mockTimetable.findIndex(e => e.id === editingEntry.id);
      if (mockIndex !== -1) mockTimetable[mockIndex] = { ...editingEntry, ...formData };
      toast({ title: "Success", description: "Timetable entry updated successfully." });
    } else {
      const newEntry: TimetableEntry = { id: `tt${Date.now()}`, ...formData };
      setTimetableEntries(prev => [...prev, newEntry]);
      mockTimetable.push(newEntry);
      toast({ title: "Success", description: "Timetable entry added successfully." });
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm("Are you sure you want to delete this timetable entry?")) {
      setTimetableEntries(prev => prev.filter(e => e.id !== entryId));
      const mockIndex = mockTimetable.findIndex(e => e.id === entryId);
      if (mockIndex !== -1) mockTimetable.splice(mockIndex, 1);
      toast({ title: "Success", description: "Timetable entry deleted successfully." });
    }
  };
  
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic CSV/Excel processing (Placeholder)
      // In a real app, use a library like PapaParse for CSV or SheetJS for Excel
      // For demo, we'll just log and show a toast
      console.log("Uploaded file:", file.name, file.type);
      if (file.type === "text/csv" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        // Here you would parse the file and update `mockTimetable` and `timetableEntries`
        toast({ title: "File Uploaded", description: `${file.name} uploaded. Processing would happen here.`});
      } else {
        toast({ title: "Invalid File Type", description: "Please upload a CSV or Excel file.", variant: "destructive"});
      }
    }
  };

  const uniqueCourses = ['all', ...new Set(mockTimetable.map(e => e.course))];
  const uniqueSemesters = ['all', ...new Set(mockTimetable.map(e => e.semester.toString()))].sort();


  const filteredEntries = timetableEntries.filter(entry => 
    (courseFilter === 'all' || entry.course === courseFilter) &&
    (semesterFilter === 'all' || entry.semester.toString() === semesterFilter)
  ).sort((a,b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day) || a.timeSlot.localeCompare(b.timeSlot));


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6 text-primary" />Timetable Management</CardTitle>
            <CardDescription>Manage class schedules. Upload CSV/Excel or add entries manually.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => document.getElementById('fileUpload')?.click()} className="hidden sm:flex">
              <Upload className="mr-2 h-4 w-4" /> Upload Timetable
            </Button>
            <Input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
            <Button onClick={openFormForNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <Button variant="outline" onClick={() => document.getElementById('fileUpload')?.click()} className="flex sm:hidden w-full">
                <Upload className="mr-2 h-4 w-4" /> Upload Timetable
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCourses.map(course => <SelectItem key={course} value={course}>{course === 'all' ? 'All Courses' : course}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by semester" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSemesters.map(sem => <SelectItem key={sem} value={sem}>{sem === 'all' ? 'All Semesters' : `Semester ${sem}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.day}</TableCell>
                    <TableCell>{entry.timeSlot}</TableCell>
                    <TableCell className="font-medium">{entry.subjectName}</TableCell>
                    <TableCell>{entry.facultyName}</TableCell>
                    <TableCell>{entry.course}</TableCell>
                    <TableCell>{entry.semester}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openFormForEdit(entry)} aria-label="Edit entry">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteEntry(entry.id)} aria-label="Delete entry">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No timetable entries found matching your criteria.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{editingEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update the details for this class schedule.' : 'Fill in the details for the new class schedule.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Form fields: Day, Time Slot, Subject Name, Faculty Name (select from list), Course, Semester */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="day" className="text-right">Day</Label>
              <Select value={formData.day} onValueChange={(value) => handleSelectChange('day', value)}>
                <SelectTrigger id="day" className="col-span-3">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeSlot" className="text-right">Time Slot</Label>
              <Input id="timeSlot" name="timeSlot" value={formData.timeSlot} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 09:00 - 10:00" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjectName" className="text-right">Subject Name</Label>
              <Input id="subjectName" name="subjectName" value={formData.subjectName} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="facultyId" className="text-right">Faculty</Label>
              <Select value={formData.facultyId} onValueChange={(value) => handleSelectChange('facultyId', value)}>
                <SelectTrigger id="facultyId" className="col-span-3">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {facultyList.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course" className="text-right">Course</Label>
              <Input id="course" name="course" value={formData.course} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="semester" className="text-right">Semester</Label>
              <Input id="semester" name="semester" type="number" value={formData.semester} onChange={handleInputChange} className="col-span-3" min="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingEntry ? 'Save Changes' : 'Add Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
