
"use client";
import { useState, useEffect, ChangeEvent, useRef } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { TimetableEntry, User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit2, Trash2, Upload, CalendarDays, Filter, Loader2, CalendarIcon, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { uploadTimetable } from '@/ai/flows/upload-timetable-flow';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, QueryConstraint } from 'firebase/firestore';
import { format, getDay, isValid } from 'date-fns';

const daysOfWeek: TimetableEntry['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const initialNewTimetableEntryState: Omit<TimetableEntry, 'id'|'day'> & { date: Date | undefined } = {
  date: undefined,
  timeSlot: '',
  subjectName: '',
  facultyName: '',
  facultyId: '',
  course: '',
  semester: 1,
};


export default function AdminTimetablesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: string, name: string }[]>([]);
  
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formData, setFormData] = useState<Omit<TimetableEntry, 'id'|'day'> & { date: Date | undefined }>(initialNewTimetableEntryState);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimetableData = async () => {
    setIsLoading(true);
    try {
        // We will set entries to empty to clear the view as requested.
        setTimetableEntries([]);

        const facultyQuery = query(collection(db, "users"), where("role", "==", "faculty"));
        const usersSnapshot = await getDocs(facultyQuery);
        setFacultyList(usersSnapshot.docs.map(doc => ({ id: doc.id, name: (doc.data() as User).name })));
    } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error", description: "Could not fetch timetable data.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'semester' ? (value ? parseInt(value) : 1) : value }));
  };
  
  const handleSelectChange = (name: keyof Omit<TimetableEntry, 'id'>, value: string) => {
    if (name === 'facultyId') {
      if (value === 'none') {
        setFormData(prev => ({ ...prev, facultyId: '', facultyName: '' }));
      } else {
        const selectedFaculty = facultyList.find(f => f.id === value);
        setFormData(prev => ({ ...prev, facultyId: value, facultyName: selectedFaculty?.name || '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openFormForEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: new Date(entry.date),
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

  const handleSubmit = async () => {
    // Basic validation
    const requiredFields: (keyof typeof formData)[] = ['date', 'timeSlot', 'subjectName', 'course', 'semester'];
    for (const field of requiredFields) {
        if (!formData[field]) {
             toast({ title: "Error", description: `Field '${field}' is required.`, variant: "destructive" });
             return;
        }
    }
    
    if (!formData.date || !isValid(formData.date)) {
        toast({ title: "Error", description: `A valid date is required.`, variant: "destructive" });
        return;
    }
    
    const finalData = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
        day: daysOfWeek[getDay(formData.date)],
    }

    setIsLoading(true);
    try {
        if (editingEntry) {
            const entryDocRef = doc(db, "timetables", editingEntry.id);
            await updateDoc(entryDocRef, finalData);
            toast({ title: "Success", description: "Timetable entry updated successfully." });
        } else {
            await addDoc(collection(db, "timetables"), finalData);
            toast({ title: "Success", description: "Timetable entry added successfully." });
        }
        await fetchTimetableData(); // Refresh data
        setIsFormOpen(false);
        setEditingEntry(null);
    } catch (error) {
        console.error("Error saving timetable entry:", error);
        toast({ title: "Error", description: "Could not save the entry.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
     if (window.confirm("Are you sure you want to delete this timetable entry?")) {
        setIsLoading(true);
        try {
            await deleteDoc(doc(db, "timetables", entryId));
            toast({ title: "Success", description: "Timetable entry deleted successfully." });
            await fetchTimetableData(); // Refresh data
        } catch (error) {
            console.error("Error deleting timetable entry:", error);
            toast({ title: "Error", description: "Could not delete the entry.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
  };
  
 const handleBulkDelete = async () => {
    if (courseFilter === 'all' && semesterFilter === 'all') return;

    setIsDeleting(true);
    try {
      const constraints: QueryConstraint[] = [];
      if (courseFilter !== 'all') {
        constraints.push(where('course', '==', courseFilter));
      }
      if (semesterFilter !== 'all') {
        constraints.push(where('semester', '==', parseInt(semesterFilter)));
      }

      const q = query(collection(db, "timetables"), ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({ title: "No entries found", description: "No entries to delete for the selected filter." });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      let description = `${snapshot.size} entries deleted successfully.`;
      toast({ title: "Success", description });
      await fetchTimetableData();
    } catch (error) {
      console.error("Error during bulk delete:", error);
      toast({ title: "Error", description: "Could not perform bulk delete.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getBulkDeleteDescription = () => {
    const courseText = courseFilter !== 'all' ? `course "${courseFilter}"` : '';
    const semText = semesterFilter !== 'all' ? `Semester ${semesterFilter}` : '';
    const connector = courseText && semText ? ' and ' : '';
    return `Are you sure you want to delete all timetable entries for ${courseText}${connector}${semText}? This action cannot be undone.`
  };


  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
    if (!file) return;

    if (file.type !== "text/csv") {
        toast({ title: "Invalid File Type", description: "Please upload a CSV file.", variant: "destructive"});
        return;
    }
    
    setIsUploading(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { timetable: newEntries, skipped } = await uploadTimetable(results.data);
          
          if (newEntries.length === 0) {
            toast({ 
              title: "Upload Failed", 
              description: `No valid entries were found to save. ${skipped > 0 ? `${skipped} rows were skipped due to missing or invalid data.` : 'Please check the file format.'}`, 
              variant: "destructive" 
            });
            setIsUploading(false);
            return;
          }
          
          const batch = writeBatch(db);
          newEntries.forEach((entry) => {
            const { id, ...entryData } = entry;
            const docRef = doc(collection(db, "timetables")); 
            batch.set(docRef, entryData);
          });
          await batch.commit();

          let description = `${newEntries.length} entries saved successfully.`;
          if (skipped > 0) {
            description += ` ${skipped} invalid rows were skipped.`;
          }
          toast({ title: "Upload Complete", description });
          await fetchTimetableData();
        } catch (error) {
          console.error("Error processing timetable:", error);
          let errorMessage = "Could not process the uploaded timetable file.";
          if (error instanceof Error) {
              errorMessage = error.message;
          }
          toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast({ title: "Parsing Error", description: "Could not parse the CSV file.", variant: "destructive"});
        setIsUploading(false);
      }
    });
  };

  const uniqueCourses = ['all', ...Array.from(new Set(timetableEntries.map(e => e.course).filter(Boolean)))];
  const uniqueSemesters = ['all', ...Array.from(new Set(timetableEntries.map(e => e.semester.toString()).filter(Boolean)))].sort();


  const filteredEntries = timetableEntries.filter(entry => 
    (courseFilter === 'all' || entry.course === courseFilter) &&
    (semesterFilter === 'all' || entry.semester.toString() === semesterFilter)
  ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.timeSlot.localeCompare(b.timeSlot));


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6 text-primary" />Timetable Management</CardTitle>
            <CardDescription>Manage class schedules. Upload CSV or add entries manually.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="hidden sm:flex">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Upload Timetable'}
            </Button>
            <Input ref={fileInputRef} type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} accept=".csv" disabled={isUploading} />
            <Button onClick={openFormForNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex sm:hidden w-full">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload Timetable'}
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
             <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={(courseFilter === 'all' && semesterFilter === 'all') || isDeleting}
                className="w-full sm:w-auto"
            >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete All
            </Button>
          </div>
        
           {isLoading && !isUploading ? (
             <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
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
                {filteredEntries.map(entry => {
                  const date = new Date(entry.date);
                  const isDateValid = isValid(date);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{isDateValid ? format(date, 'dd-MM-yyyy') : 'Invalid Date'}</TableCell>
                      <TableCell>{entry.day}</TableCell>
                      <TableCell>{entry.timeSlot}</TableCell>
                      <TableCell className="font-medium">{entry.subjectName}</TableCell>
                      <TableCell>{entry.facultyName || 'N/A'}</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No timetable entries found. Upload a CSV to get started.</p>
          )}
        </CardContent>
      </Card>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 h-6 w-6 text-destructive"/>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {getBulkDeleteDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, delete all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{editingEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update the details for this class schedule.' : 'Fill in the details for the new class schedule.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="col-span-3 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(d) => setFormData(prev => ({...prev, date: d}))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <Select value={formData.facultyId || 'none'} onValueChange={(value) => handleSelectChange('facultyId', value)}>
                <SelectTrigger id="facultyId" className="col-span-3">
                  <SelectValue placeholder="Select faculty (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingEntry ? 'Save Changes' : 'Add Entry')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    