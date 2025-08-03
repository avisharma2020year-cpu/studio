
import { z } from 'zod';
import type { TimetableEntry } from '@/lib/types';

// Stricter schema to handle CSV header variations and data types
const TimetableRowSchema = z.object({
    Day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    'Time Slot': z.string().min(1, "Time Slot cannot be empty."),
    Subject: z.string().min(1, "Subject cannot be empty."),
    Faculty: z.string().optional().default(''),
    Course: z.string().min(1, "Course cannot be empty."),
    Semester: z.coerce.number({ invalid_type_error: "Semester must be a number." }),
  });
  
// This transform normalizes various possible header names from the CSV
// into the strict format defined by TimetableRowSchema.
const FlexibleTimetableRowSchema = z.any().transform((arg, ctx) => {
    if (typeof arg !== 'object' || arg === null) {
        ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: 'object',
            received: typeof arg,
        });
        return z.NEVER;
    }
    const data = arg as Record<string, unknown>;
    const normalized = {
      Day: data.Day || data.day,
      'Time Slot': data['Time Slot'] || data['time_slot'] || data.TimeSlot,
      Subject: data.Subject || data.subject,
      Faculty: data.Faculty || data.facultyName || data.faculty_name,
      Course: data.Course || data.course,
      Semester: data.Semester || data.semester,
    };
    return TimetableRowSchema.parse(normalized);
});


// The input to our flow will be an array of these rows
export const TimetableUploadInputSchema = z.array(FlexibleTimetableRowSchema);
export type TimetableUploadInput = z.infer<typeof TimetableUploadInputSchema>;

// The output will be a structured array of TimetableEntry objects
export const TimetableUploadOutputSchema = z.array(z.custom<TimetableEntry>());
export type TimetableUploadOutput = z.infer<typeof TimetableUploadOutputSchema>;
