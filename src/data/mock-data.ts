import type { User, TimetableEntry, MissedClassRequest, PreApprovedEvent, SubjectFacultyMapping } from '@/lib/types';

export const mockUsers: User[] = [
  { id: 'user1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'student', prn: 'S1001', course: 'BBA', semester: 5 },
  { id: 'user2', name: 'Bob The Builder', email: 'bob@example.com', role: 'faculty', subjects: ['Data Structures', 'Algorithms'] },
  { id: 'user3', name: 'Charlie Admin', email: 'charlie@example.com', role: 'admin' },
  { id: 'user4', name: 'David Copperfield', email: 'david@example.com', role: 'student', prn: 'S1002', course: 'Computer Science', semester: 3 },
  { id: 'user5', name: 'Eve The Engineer', email: 'eve@example.com', role: 'faculty', subjects: ['Database Management', 'Operating Systems'] },
  { id: 'user6', name: 'Dr. Ravi Kiran', email: 'ravi.k@example.com', role: 'faculty', subjects: ['Talent Management'] },
  { id: 'user7', name: 'Dr. M Rajanikanth', email: 'rajanikanth.m@example.com', role: 'faculty', subjects: ['Fundamentals of B2B Marketing'] },
  { id: 'user8', name: 'Dr. Disha Pathak', email: 'disha.p@example.com', role: 'faculty', subjects: ['Management Accounting'] },
];

// NOTE: mockTimetable, mockRequests, and mockEvents are now deprecated and will be removed soon.
// Data should be fetched from Firestore.
export const mockTimetable: TimetableEntry[] = [];
export const mockRequests: MissedClassRequest[] = [];
export const mockEvents: PreApprovedEvent[] = [];


export const mockSubjectFacultyMappings: SubjectFacultyMapping[] = [
  { subjectName: 'Data Structures', facultyId: 'user2', course: 'Computer Science', semester: 3 },
  { subjectName: 'Algorithms', facultyId: 'user2', course: 'Computer Science', semester: 3 },
  { subjectName: 'Database Management', facultyId: 'user5', course: 'Computer Science', semester: 3 },
  { subjectName: 'Operating Systems', facultyId: 'user5', course: 'Computer Science', semester: 3 },
];

// Mock current user - in a real app, this would come from an auth context
export const getCurrentUser = (role: 'student' | 'faculty' | 'admin'): User => {
  if (role === 'student') return mockUsers.find(u => u.prn === 'S1001')!;
  if (role === 'faculty') return mockUsers.find(u => u.role === 'faculty' && u.id === 'user6')!; // Default to a specific faculty
  if (role === 'admin') return mockUsers.find(u => u.role === 'admin')!;
  
  // Find a default faculty, or fallback to the first one.
  let facultyUser = mockUsers.find(u => u.role === 'faculty');
  if (role === 'faculty') return facultyUser || mockUsers[1];

  return mockUsers[0]; // Default
};
