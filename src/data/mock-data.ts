
import type { User, TimetableEntry, MissedClassRequest, PreApprovedEvent, SubjectFacultyMapping } from '@/lib/types';

// This file is now primarily for defining the current user for prototyping.
// The rest of the data should be fetched from Firestore.

export const mockUsers: User[] = [
  { id: 'user1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'student', prn: 'S1002', course: 'Computer Science', semester: 3 },
  { id: 'faculty-bob', name: 'Bob The Builder', email: 'bob@example.com', role: 'faculty' },
  { id: 'user3', name: 'Charlie Admin', email: 'charlie@example.com', role: 'admin' },
];


// Mock current user - in a real app, this would come from an auth context
export const getCurrentUser = (role: 'student' | 'faculty' | 'admin'): User => {
  if (role === 'student') return mockUsers.find(u => u.prn === 'S1002')!;
  if (role === 'faculty') return mockUsers.find(u => u.id === 'faculty-bob')!;
  if (role === 'admin') return mockUsers.find(u => u.role === 'admin')!;

  return mockUsers[0]; // Default
};

    