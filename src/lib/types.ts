
export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  prn?: string; // For students
  course?: string;
  semester?: number;
  subjects?: string[]; // For faculty
}

export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string; // e.g., "09:00 - 10:00"
  subjectName: string;
  facultyName: string;
  facultyId?: string;
  course: string;
  semester: number;
}

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface MissedClassRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentPrn: string;
  missedClasses: { classId: string; subjectName: string; timeSlot: string; day: string }[];
  reason: string;
  eventId?: string; // Optional pre-approved event
  timestamp: string; // ISO date string
  status: RequestStatus;
  facultyComment?: string;
  facultyId?: string; // To route to correct faculty
}

export interface PreApprovedEvent {
  id:string;
  name: string;
  description: string;
}

// For student-faculty mapping, can be part of User or TimetableEntry, or a separate structure
export interface SubjectFacultyMapping {
  subjectName: string;
  facultyId: string;
  course: string;
  semester: number;
}
