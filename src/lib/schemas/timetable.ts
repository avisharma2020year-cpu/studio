
import { z } from 'zod';
import { format, getDay } from 'date-fns';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

// Base schema for a single, validated row.
const TimetableRowSchema = z.object({
  Date: z.coerce.date({
    errorMap: () => ({ message: 'Invalid Date format. Please use YYYY-MM-DD.' }),
  }),
  'Time Slot': z.string().min(1, { message: "Time Slot cannot be empty" }),
  Subject: z.string().min(1, { message: "Subject cannot be empty" }),
  Faculty: z.string().default(''), // Can be empty for things like "Library Session"
  Course: z.string().min(1, { message: "Course cannot be empty" }),
  Semester: z.coerce.number().min(1, { message: "Semester must be a positive number" }),
});

// This transform normalizes various possible header names from the CSV
// and validates the row. If validation fails, it returns null.
const FlexibleTimetableRowSchema = z.any().transform((arg) => {
    if (typeof arg !== 'object' || arg === null) {
        return null; // Skip non-object rows
    }
    const data = arg as Record<string, unknown>;

    // Normalize keys: maps possible CSV headers to the strict schema headers.
    const normalized = {
      Date: data.Date || data.date,
      'Time Slot': data['Time Slot'] || data.timeSlot || data.timeslot || data.time_slot,
      Subject: data.Subject || data.subject,
      Faculty: data.Faculty || data.faculty,
      Course: data.Course || data.course,
      Semester: data.Semester || data.semester,
    };

    const result = TimetableRowSchema.safeParse(normalized);

    if (result.success) {
        const validatedData = result.data;
        // Derive day from date
        const dayOfWeek = daysOfWeek[getDay(validatedData.Date)];
        return {
          ...validatedData,
          Date: format(validatedData.Date, 'yyyy-MM-dd'), // Standardize date format
          Day: dayOfWeek,
        };
    } else {
        // Log errors for debugging if needed, but return null to skip the row.
        console.warn('Skipping invalid row:', result.error.flatten().fieldErrors);
        return null;
    }
});

// The input to our flow will be an array of potentially mixed-quality rows.
export const TimetableUploadInputSchema = z.array(FlexibleTimetableRowSchema);
export type TimetableUploadInput = z.infer<typeof TimetableUploadInputSchema>;


// The output will be a structured array of valid TimetableEntry objects and a count of skipped rows.
export const TimetableUploadOutputSchema = z.object({
  timetable: z.array(z.any()), // array of valid timetable entries
  skipped: z.number(),         // count of skipped rows
});
export type TimetableUploadOutput = z.infer<typeof TimetableUploadOutputSchema>;
