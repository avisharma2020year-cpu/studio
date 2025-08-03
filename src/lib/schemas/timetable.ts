import { z } from 'zod';
import type { TimetableEntry } from '@/lib/types';

// Define the expected shape of a single row from the CSV, allowing for variations in headers
const TimetableRowSchema = z.object({
  Day: z.string().optional(), // Make original keys optional
  day: z.string().optional(),
  'Time Slot': z.string().optional(),
  time_slot: z.string().optional(),
  Subject: z.string().optional(),
  subject: z.string().optional(),
  Faculty: z.string().optional(),
  faculty_name: z.string().optional(),
  Course: z.string().optional(),
  course: z.string().optional(),
  Semester: z.string().optional(),
  semester: z.string().optional(),
}).transform(data => ({
  // Map from various possible keys to a consistent format
  Day: data.Day || data.day,
  'Time Slot': data['Time Slot'] || data.time_slot,
  Subject: data.Subject || data.subject,
  Faculty: data.Faculty || data.faculty_name,
  Course: data.Course || data.course,
  Semester: data.Semester || data.semester,
})).pipe(z.object({
    // Now validate the consistent format
    Day: z.string({ required_error: "CSV must include a 'Day' or 'day' column." }),
    'Time Slot': z.string({ required_error: "CSV must include a 'Time Slot' or 'time_slot' column." }),
    Subject: z.string({ required_error: "CSV must include a 'Subject' or 'subject' column." }),
    Faculty: z.string().optional().default(''), // Faculty can be optional
    Course: z.string({ required_error: "CSV must include a 'Course' or 'course' column." }),
    Semester: z.string().transform(val => parseInt(val, 10)),
}));


// The input to our flow will be an array of these rows
export const TimetableUploadInputSchema = z.array(TimetableRowSchema);
export type TimetableUploadInput = z.infer<typeof TimetableUploadInputSchema>;

// The output will be a structured array of TimetableEntry objects
export const TimetableUploadOutputSchema = z.array(z.custom<TimetableEntry>());
export type TimetableUploadOutput = z.infer<typeof TimetableUploadOutputSchema>;
