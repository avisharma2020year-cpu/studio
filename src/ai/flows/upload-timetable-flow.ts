'use server';
/**
 * @fileOverview A flow for processing uploaded timetable data.
 *
 * - uploadTimetable - A function that handles parsing and validating timetable CSV data.
 */

import { ai } from '@/ai/genkit';
import { mockUsers } from '@/data/mock-data';
import type { TimetableEntry } from '@/lib/types';
import { TimetableUploadInputSchema, TimetableUploadOutputSchema, type TimetableUploadInput, type TimetableUploadOutput } from '@/lib/schemas/timetable';


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

    // In a real application, you might fetch faculty from a database
    const facultyMap = new Map(mockUsers.filter(u => u.role === 'faculty').map(u => [u.name, u.id]));

    const newTimetable: TimetableEntry[] = rows.map((row, index) => {
      const facultyId = facultyMap.get(row.Faculty);
      if (!facultyId) {
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
