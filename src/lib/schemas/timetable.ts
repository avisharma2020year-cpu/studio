import { z } from 'zod';
import type { TimetableEntry } from '@/lib/types';

// Define the expected shape of a single row from the CSV
const TimetableRowSchema = z.object({
  Day: z.string(),
  'Time Slot': z.string(),
  Subject: z.string(),
  Faculty: z.string(),
  Course: z.string(),
  Semester: z.string().transform(val => parseInt(val, 10)),
});

// The input to our flow will be an array of these rows
export const TimetableUploadInputSchema = z.array(TimetableRowSchema);
export type TimetableUploadInput = z.infer<typeof TimetableUploadInputSchema>;

// The output will be a structured array of TimetableEntry objects
export const TimetableUploadOutputSchema = z.array(z.custom<TimetableEntry>());
export type TimetableUploadOutput = z.infer<typeof TimetableUploadOutputSchema>;
