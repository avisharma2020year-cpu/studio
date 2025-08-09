'use server';
/**
 * @fileOverview A flow for processing uploaded timetable data.
 *
 * - uploadTimetable - A function that handles parsing and validating timetable CSV data.
 */

import { ai } from '@/ai/genkit';
import type { TimetableEntry, User } from '@/lib/types';
import { TimetableUploadInputSchema, TimetableUploadOutputSchema, type TimetableUploadInput, type TimetableUploadOutput } from '@/lib/schemas/timetable';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export async function uploadTimetable(input: TimetableUploadInput): Promise<TimetableUploadOutput> {
  return uploadTimetableFlow(input);
}


const uploadTimetableFlow = ai.defineFlow(
  {
    name: 'uploadTimetableFlow',
    inputSchema: TimetableUploadInputSchema,
    outputSchema: TimetableUploadOutputSchema,
  },
  async (rows) => {
    // Filter out any null rows that failed schema transformation
    const validRows = rows.filter(row => row !== null);
    if (validRows.length === 0) {
      return { timetable: [], skipped: rows.length };
    }

    // Fetch faculty from Firestore to map names to IDs
    const facultyQuery = query(collection(db, "users"), where("role", "==", "faculty"));
    const usersSnapshot = await getDocs(facultyQuery);
    
    // Normalize faculty names (lowercase, trimmed) for robust matching
    const facultyMap = new Map(usersSnapshot.docs.map(doc => {
        const data = doc.data() as User;
        return [data.name.trim().toLowerCase(), doc.id];
    }));

    const newTimetable: TimetableEntry[] = validRows.map((row, index) => {
      // Normalize faculty name from CSV for lookup
      const lookupName = row.Faculty.trim().toLowerCase();
      const facultyId = facultyMap.get(lookupName);
      
      // We don't skip if faculty is not found, we just leave the facultyId empty
      // to allow for cases like "Library Session" without an assigned faculty.

      return {
        id: `tt-upload-${Date.now()}-${index}`, // This ID is temporary and won't be saved
        day: row.Day as TimetableEntry['day'],
        timeSlot: row['Time Slot'],
        subjectName: row.Subject,
        facultyName: row.Faculty,
        facultyId: facultyId || '', 
        course: row.Course,
        semester: row.Semester,
      };
    });

    const coursesInUpload = [...new Set(newTimetable.map(e => e.course))];
    const semestersInUpload = [...new Set(newTimetable.map(e => e.semester))];

    if (coursesInUpload.length > 0 && semestersInUpload.length > 0) {
      // Delete old entries for the same course/semester combination
      const timetableRef = collection(db, 'timetables');
      const q = query(
          timetableRef, 
          where('course', 'in', coursesInUpload), 
          where('semester', 'in', semestersInUpload)
      );
      const oldDocsSnapshot = await getDocs(q);
      if (!oldDocsSnapshot.empty) {
        const deleteBatch = writeBatch(db);
        oldDocsSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
      }
    }

    const skippedCount = rows.length - newTimetable.length;

    return { timetable: newTimetable, skipped: skippedCount };
  }
);
