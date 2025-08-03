'use server';
/**
 * @fileOverview A flow for processing uploaded timetable data.
 *
 * - uploadTimetable - A function that handles parsing and validating timetable CSV data.
 */

import { ai } from '@/ai/genkit';
import type { TimetableEntry, User } from '@/lib/types';
import { TimetableUploadInputSchema, TimetableUploadOutputSchema, type TimetableUploadInput, type TimetableUploadOutput } from '@/lib/schemas/timetable';
import { collection, getDocs } from 'firebase/firestore';
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
    console.log('Processing uploaded timetable data:', rows);

    // Fetch faculty from Firestore to map names to IDs
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const facultyMap = new Map(users.filter(u => u.role === 'faculty').map(u => [u.name, u.id]));


    const newTimetable: TimetableEntry[] = rows.map((row, index) => {
      const facultyId = facultyMap.get(row.Faculty);
      if (!facultyId && row.Faculty) {
        console.warn(`Faculty "${row.Faculty}" not found for row ${index + 2}. Skipping facultyId.`);
      }

      return {
        id: `tt-upload-${Date.now()}-${index}`,
        day: row.Day as TimetableEntry['day'],
        timeSlot: row['Time Slot'],
        subjectName: row.Subject,
        facultyName: row.Faculty,
        facultyId: facultyId || '', // Assign empty string if not found
        course: row.Course,
        semester: row.Semester,
      };
    }).filter(entry => entry.day && entry.timeSlot && entry.subjectName); // Basic validation

    console.log('Processed timetable entries:', newTimetable);
    return newTimetable;
  }
);
