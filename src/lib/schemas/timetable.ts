import { z } from 'zod';
import type { TimetableEntry } from '@/lib/types';

// Define the expected shape of a single row from the CSV, allowing for variations in headers
const TimetableRowSchema = z.object({
  Day: z.string().optional(), 
  day: z.string().optional(),
  'Time Slot': z.string().optional(),
  time_slot: z.string().optional(),
  Subject: z.string().optional(),
  subject: z.string().optional(),
  Faculty: z.string().optional(),
  faculty_name: z.string().optional(),
  Course: z.string().optional(),
  course: z.string().optional(),
  Semester: z.union([z.string(), z.number()]).optional(),
  semester: z.union([z.string(), z.number()]).optional(),
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
    Day: z.string({ required_error: "CSV must include a 'Day' or 'day' column." }).min(1, "Day cannot be empty."),
    'Time Slot': z.string({ required_error: "CSV must include a 'Time Slot' or 'time_slot' column." }).min(1, "Time Slot cannot be empty."),
    Subject: z.string({ required_error: "CSV must include a 'Subject' or 'subject' column." }).min(1, "Subject cannot be empty."),
    Faculty: z.string().optional().default(''), // Faculty can be optional
    Course: z.string({ required_error: "CSV must include a 'Course' or 'course' column." }).min(1, "Course cannot be empty."),
    Semester: z.union([z.string(), z.number()]).transform(val => parseInt(String(val), 10)),
}));


// The input to our flow will be an array of these rows
export const TimetableUploadInputSchema = z.array(TimetableRowSchema);
export type TimetableUploadInput = z.infer<typeof TimetableUploadInputSchema>;

// The output will be a structured array of TimetableEntry objects
export const TimetableUploadOutputSchema = z.array(z.custom<TimetableEntry>());
export type TimetableUploadOutput = z.infer<typeof TimetableUploadOutputSchema>;
