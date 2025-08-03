import { z } from 'zod';
import type { TimetableEntry } from '@/lib/types';

// A flexible schema to handle variations in CSV headers like 'Day' vs 'day'
const TimetableRowSchema = z.preprocess(
  (arg) => {
    if (typeof arg !== 'object' || arg === null) return arg;
    const data = arg as Record<string, unknown>;
    // Normalize keys to a consistent format
    return {
      Day: data.Day || data.day,
      'Time Slot': data['Time Slot'] || data.time_slot,
      Subject: data.Subject || data.subject,
      Faculty: data.Faculty || data.faculty_name,
      Course: data.Course || data.course,
      Semester: data.Semester || data.semester,
    };
  },
  // Validate the normalized object
  z.object({
    Day: z.string({ required_error: "CSV must include a 'Day' or 'day' column." }).min(1, "Day cannot be empty."),
    'Time Slot': z.string({ required_error: "CSV must include a 'Time Slot' or 'time_slot' column." }).min(1, "Time Slot cannot be empty."),
    Subject: z.string({ required_error: "CSV must include a 'Subject' or 'subject' column." }).min(1, "Subject cannot be empty."),
    Faculty: z.string().optional().default(''),
    Course: z.string({ required_error: "CSV must include a 'Course' or 'course' column." }).min(1, "Course cannot be empty."),
    Semester: z.coerce.number({ invalid_type_error: "Semester must be a number." }),
  })
);

// The input to our flow will be an array of these rows
export const TimetableUploadInputSchema = z.array(TimetableRowSchema);
export type TimetableUploadInput = z.infer<typeof TimetableUploadInputSchema>;

// The output will be a structured array of TimetableEntry objects
export const TimetableUploadOutputSchema = z.array(z.custom<TimetableEntry>());
export type TimetableUploadOutput = z.infer<typeof TimetableUploadOutputSchema>;