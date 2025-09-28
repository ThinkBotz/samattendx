export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  /** Optional attendance target percentage for this subject (0-100). */
  criteria?: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  subjectId?: string;
}

export interface DaySchedule {
  day: string;
  timeSlots: TimeSlot[];
}

export interface Timetable {
  schedule: DaySchedule[];
}

export type AttendanceStatus = 'present' | 'absent' | 'cancelled' | 'clear';

export interface AttendanceRecord {
  date: string;
  day: string;
  timeSlotId: string;
  subjectId: string;
  status: AttendanceStatus;
}

export interface AttendanceStats {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  cancelledClasses: number;
  percentage: number;
}

export interface AcademicSettings {
  holidays: string[]; // ISO dates 'yyyy-MM-dd'
  semesterStart?: string; // ISO date
  semesterEnd?: string;   // ISO date
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface AppUser {
  user: User;
  subjects: Subject[];
  timetable: Timetable;
  attendanceRecords: AttendanceRecord[];
  attendanceStats: AttendanceStats;
  academicSettings: AcademicSettings;
}