import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subject, Timetable, AttendanceRecord, TimeSlot, AcademicSettings, User } from '@/types';

interface AppState {
  // Active (visible) profile data - kept for backward compatibility
  subjects: Subject[];
  timetable: Timetable;
  attendanceRecords: AttendanceRecord[];
  settings: AcademicSettings;
  
  // Multi-user support
  profiles: Record<string, {
    user: User;
    subjects: Subject[];
    timetable: Timetable;
    attendanceRecords: AttendanceRecord[];
    settings: AcademicSettings;
  }>;
  activeUserId: string;
  users: User[]; // convenient list for UI
  
  // Subject actions
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  removeSubject: (id: string) => void;
  updateSubject: (id: string, patch: Partial<Omit<Subject, 'id' | 'createdAt'>>) => void;
  
  // Timetable actions
  updateTimetable: (timetable: Timetable) => void;
  assignSubjectToSlot: (day: string, timeSlotId: string, subjectId: string) => void;
  
  // Attendance actions
  markAttendance: (date: string, day: string, timeSlotId: string, subjectId: string, status: 'present' | 'absent' | 'cancelled') => void;
  clearAttendance: (date: string, timeSlotId: string) => void;
  markAllDayAttendance: (date: string, day: string, status: 'present' | 'absent' | 'cancelled' | 'clear') => void;
  bulkMarkRange: (startDate: string, endDate: string, pattern: 'present' | 'absent' | 'cancelled') => void;
  bulkMarkDates: (dates: string[], pattern: 'present' | 'absent' | 'cancelled') => void;
  bulkClearDates: (dates: string[]) => void;
  // Settings actions
  setHolidays: (dates: string[]) => void;
  addHoliday: (date: string) => void;
  removeHoliday: (date: string) => void;
  setSemester: (start?: string, end?: string) => void;
  
  // Profile actions
  addUser: (name: string, avatarUrl?: string) => void;
  switchUser: (id: string) => void;
  removeUser: (id: string) => void;
  renameUser: (id: string, name: string) => void;
  
  // Import/Export actions
  importData: (data: { subjects: Subject[]; timetable: Timetable; attendanceRecords: AttendanceRecord[]; settings?: AcademicSettings }) => void;
}

const defaultTimeSlots: TimeSlot[] = [
  { id: '1', startTime: '09:10', endTime: '10:00' },
  { id: '2', startTime: '10:00', endTime: '10:50' },
  { id: '3', startTime: '10:50', endTime: '11:40' },
  { id: '4', startTime: '11:40', endTime: '12:30' },
  { id: '5', startTime: '13:20', endTime: '14:10' },
  { id: '6', startTime: '14:10', endTime: '15:00' },
  { id: '7', startTime: '15:00', endTime: '15:50' },
];

const defaultTimetable: Timetable = {
  schedule: [
    { day: 'Monday', timeSlots: [...defaultTimeSlots] },
    { day: 'Tuesday', timeSlots: [...defaultTimeSlots] },
    { day: 'Wednesday', timeSlots: [...defaultTimeSlots] },
    { day: 'Thursday', timeSlots: [...defaultTimeSlots] },
    { day: 'Friday', timeSlots: [...defaultTimeSlots] },
    { day: 'Saturday', timeSlots: [...defaultTimeSlots] },
  ],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Default active view (will be replaced by profile switcher logic)
      subjects: [],
      timetable: defaultTimetable,
      attendanceRecords: [],
      settings: { holidays: [] },
      
      // Profiles storage
      profiles: (() => {
        const id = 'default';
        const user: User = { id, name: 'Profile 1', createdAt: new Date() };
        return {
          [id]: {
            user,
            subjects: [],
            timetable: defaultTimetable,
            attendanceRecords: [],
            settings: { holidays: [] },
          },
        };
      })(),
      activeUserId: 'default',
      users: [{ id: 'default', name: 'Profile 1', createdAt: new Date() }],

      addSubject: (subject) => {
        const newSubject: Subject = {
          ...subject,
          id: Date.now().toString(),
          createdAt: new Date(),
        };
        set((state) => ({
          subjects: [...state.subjects, newSubject],
        }));
      },

      updateSubject: (id, patch) => {
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          // Also update timetable references if color/name needed elsewhere (no change needed here)
        }));
      },

      removeSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter(s => s.id !== id),
          timetable: {
            ...state.timetable,
            schedule: state.timetable.schedule.map(day => ({
              ...day,
              timeSlots: day.timeSlots.map(slot => ({
                ...slot,
                subjectId: slot.subjectId === id ? undefined : slot.subjectId,
              })),
            })),
          },
        }));
      },

      updateTimetable: (timetable) => {
        set({ timetable });
      },

      assignSubjectToSlot: (day, timeSlotId, subjectId) => {
        set((state) => ({
          timetable: {
            ...state.timetable,
            schedule: state.timetable.schedule.map(d => 
              d.day === day 
                ? {
                    ...d,
                    timeSlots: d.timeSlots.map(slot =>
                      slot.id === timeSlotId
                        ? { ...slot, subjectId }
                        : slot
                    ),
                  }
                : d
            ),
          },
        }));
      },

      markAttendance: (date, day, timeSlotId, subjectId, status) => {
        set((state) => {
          const existingIndex = state.attendanceRecords.findIndex(
            r => r.date === date && r.timeSlotId === timeSlotId
          );

          const newRecord: AttendanceRecord = {
            date,
            day,
            timeSlotId,
            subjectId,
            status,
          };

          if (existingIndex >= 0) {
            const updatedRecords = [...state.attendanceRecords];
            updatedRecords[existingIndex] = newRecord;
            return { attendanceRecords: updatedRecords };
          } else {
            return {
              attendanceRecords: [...state.attendanceRecords, newRecord],
            };
          }
        });
      },

      clearAttendance: (date, timeSlotId) => {
        set((state) => ({
          attendanceRecords: state.attendanceRecords.filter(
            r => !(r.date === date && r.timeSlotId === timeSlotId)
          ),
        }));
      },

      markAllDayAttendance: (date, day, status) => {
        const { timetable, subjects } = get();
        const daySchedule = timetable.schedule.find(d => d.day === day);
        
        if (!daySchedule) return;

        set((state) => {
          let updatedRecords = [...state.attendanceRecords];
          
          if (status === 'clear') {
            // Clear all attendance for this day
            updatedRecords = updatedRecords.filter(r => r.date !== date);
          } else {
            // Remove existing records for this date
            updatedRecords = updatedRecords.filter(r => r.date !== date);
            
            // Add new records for each time slot with a subject
            daySchedule.timeSlots.forEach(slot => {
              if (slot.subjectId) {
                updatedRecords.push({
                  date,
                  day,
                  timeSlotId: slot.id,
                  subjectId: slot.subjectId,
                  status: status as 'present' | 'absent' | 'cancelled',
                });
              }
            });
          }
          
          return { attendanceRecords: updatedRecords };
        });
      },

      bulkMarkRange: (startDate, endDate, pattern) => {
        const { timetable, settings } = get();
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;
        const days: Date[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
        }

        set((state) => {
          const records = state.attendanceRecords.filter(r => {
            const d = new Date(r.date);
            return d < start || d > end;
          });

          const holidaysSet = new Set(settings.holidays || []);
          days.forEach((date) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const sched = timetable.schedule.find(s => s.day === dayName);
            const iso = date.toISOString().slice(0,10);
            if (date.getDay() === 0 || holidaysSet.has(iso)) return;
            if (!sched) return;
            sched.timeSlots.forEach(slot => {
              if (!slot.subjectId) return;
              records.push({
                date: iso,
                day: dayName,
                timeSlotId: slot.id,
                subjectId: slot.subjectId,
                status: pattern,
              });
            });
          });

          return { attendanceRecords: records };
        });
      },

      setHolidays: (dates) => set((state) => ({ settings: { ...state.settings, holidays: [...new Set(dates)] } })),
      addHoliday: (date) => set((state) => ({ settings: { ...state.settings, holidays: [...new Set([...state.settings.holidays, date])] } })),
      removeHoliday: (date) => set((state) => ({ settings: { ...state.settings, holidays: state.settings.holidays.filter(d => d !== date) } })),
      setSemester: (start, end) => set((state) => ({ settings: { ...state.settings, semesterStart: start, semesterEnd: end } })),

      bulkMarkDates: (dates, pattern) => {
        const { timetable, settings } = get();
        const holidaysSet = new Set(settings.holidays || []);
        const filtered = dates
          .map(d => new Date(d))
          .filter(d => !isNaN(d.getTime()))
          .filter(d => d.getDay() !== 0) // skip Sundays
          .filter(d => !holidaysSet.has(d.toISOString().slice(0,10))) // skip explicit holidays
          .filter(d => {
            if (settings.semesterStart) {
              const s = new Date(settings.semesterStart);
              if (!isNaN(s.getTime()) && d < s) return false;
            }
            if (settings.semesterEnd) {
              const e = new Date(settings.semesterEnd);
              if (!isNaN(e.getTime()) && d > e) return false;
            }
            return true;
          });

        set((state) => {
          const keep = new Set(filtered.map(d => d.toISOString().slice(0,10)));
          const records = state.attendanceRecords.filter(r => !keep.has(r.date));

          filtered.forEach((date) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const sched = timetable.schedule.find(s => s.day === dayName);
            if (!sched) return;
            const iso = date.toISOString().slice(0,10);
            sched.timeSlots.forEach(slot => {
              if (!slot.subjectId) return;
              records.push({
                date: iso,
                day: dayName,
                timeSlotId: slot.id,
                subjectId: slot.subjectId,
                status: pattern,
              });
            });
          });

          return { attendanceRecords: records };
        });
      },

      bulkClearDates: (dates) => {
        const { settings } = get();
        const holidaysSet = new Set(settings.holidays || []);
        const filtered = dates
          .map(d => new Date(d))
          .filter(d => !isNaN(d.getTime()))
          .filter(d => d.getDay() !== 0) // skip Sundays
          .filter(d => !holidaysSet.has(d.toISOString().slice(0,10))) // skip explicit holidays
          .filter(d => {
            if (settings.semesterStart) {
              const s = new Date(settings.semesterStart);
              if (!isNaN(s.getTime()) && d < s) return false;
            }
            if (settings.semesterEnd) {
              const e = new Date(settings.semesterEnd);
              if (!isNaN(e.getTime()) && d > e) return false;
            }
            return true;
          });

        const toClear = new Set(filtered.map(d => d.toISOString().slice(0,10)));
        set((state) => ({
          attendanceRecords: state.attendanceRecords.filter(r => !toClear.has(r.date)),
        }));
      },

      // Profile actions
      addUser: (name, avatarUrl) => {
        if (!name || !name.trim()) return;
        set((state) => {
          // Save current active snapshot into profiles
          const currentId = state.activeUserId;
          const currentProfile = state.profiles[currentId];
          const updatedProfiles = {
            ...state.profiles,
            [currentId]: {
              ...currentProfile,
              subjects: state.subjects,
              timetable: state.timetable,
              attendanceRecords: state.attendanceRecords,
              settings: state.settings,
            },
          };

          const id = `user-${Date.now()}`;
          const user: User = { id, name: name.trim(), createdAt: new Date(), avatarUrl } as User;
          const emptyProfile = {
            user,
            subjects: [],
            timetable: defaultTimetable,
            attendanceRecords: [],
            settings: { holidays: [] },
          };

          const profiles = { ...updatedProfiles, [id]: emptyProfile };
          const users = Object.values(profiles).map(p => p.user);

          return {
            profiles,
            users,
            activeUserId: id,
            // Switch active view to new profile (empty)
            subjects: [],
            timetable: defaultTimetable,
            attendanceRecords: [],
            settings: { holidays: [] },
          };
        });
      },

      switchUser: (id) => {
        set((state) => {
          if (!id || id === state.activeUserId || !state.profiles[id]) return {} as any;
          // Save current to active profile
          const currentId = state.activeUserId;
          const currentProfile = state.profiles[currentId];
          const updatedProfiles = {
            ...state.profiles,
            [currentId]: {
              ...currentProfile,
              subjects: state.subjects,
              timetable: state.timetable,
              attendanceRecords: state.attendanceRecords,
              settings: state.settings,
            },
          };
          // Load target profile
          const target = updatedProfiles[id];
          const users = Object.values(updatedProfiles).map(p => p.user);
          return {
            profiles: updatedProfiles,
            users,
            activeUserId: id,
            subjects: target.subjects,
            timetable: target.timetable,
            attendanceRecords: target.attendanceRecords,
            settings: target.settings,
          };
        });
      },

      removeUser: (id) => {
        set((state) => {
          const ids = Object.keys(state.profiles);
          if (!state.profiles[id] || ids.length <= 1) return {} as any; // cannot remove last

          // First, save current active snapshot
          const currentId = state.activeUserId;
          const currentProfile = state.profiles[currentId];
          let profiles = {
            ...state.profiles,
            [currentId]: {
              ...currentProfile,
              subjects: state.subjects,
              timetable: state.timetable,
              attendanceRecords: state.attendanceRecords,
              settings: state.settings,
            },
          };

          // Remove requested
          const { [id]: _removed, ...rest } = profiles as any;
          profiles = rest;
          const users = Object.values(profiles).map(p => p.user);

          // If removed active, switch to first remaining
          let activeUserId = state.activeUserId;
          if (id === state.activeUserId) {
            activeUserId = Object.keys(profiles)[0];
          }
          const target = profiles[activeUserId];
          return {
            profiles,
            users,
            activeUserId,
            subjects: target.subjects,
            timetable: target.timetable,
            attendanceRecords: target.attendanceRecords,
            settings: target.settings,
          };
        });
      },

      renameUser: (id, name) => {
        set((state) => {
          if (!state.profiles[id]) return {} as any;
          if (!name || !name.trim()) return {} as any;
          const profiles = { ...state.profiles };
          profiles[id] = { ...profiles[id], user: { ...profiles[id].user, name: name.trim() } };
          const users = Object.values(profiles).map(p => p.user);
          return { profiles, users };
        });
      },

      importData: (data) => {
        // Ensure subjects have proper Date objects
        const subjects = data.subjects.map(subject => ({
          ...subject,
          createdAt: new Date(subject.createdAt)
        }));
        
        set((state) => ({
          subjects,
          timetable: data.timetable,
          attendanceRecords: data.attendanceRecords,
          settings: data.settings ? { ...state.settings, ...data.settings } : (state.settings ?? { holidays: [] }),
        }));
      },
    }),
    {
      name: 'student-app-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          const data = JSON.parse(str);
          // Convert string dates back to Date objects
          if (data.state.subjects) {
            data.state.subjects = data.state.subjects.map((subject: any) => ({
              ...subject,
              createdAt: new Date(subject.createdAt)
            }));
          }
          // Migrate to profiles if missing
          if (!data.state.profiles) {
            const id = 'default';
            const user: User = { id, name: 'Profile 1', createdAt: new Date() };
            data.state.profiles = {
              [id]: {
                user,
                subjects: data.state.subjects || [],
                timetable: data.state.timetable || defaultTimetable,
                attendanceRecords: data.state.attendanceRecords || [],
                settings: data.state.settings || { holidays: [] },
              },
            };
            data.state.activeUserId = id;
            data.state.users = [user];
          } else {
            // Ensure Dates for subjects inside profiles and user.createdAt
            const profiles: Record<string, any> = data.state.profiles;
            Object.keys(profiles).forEach((key) => {
              const p = profiles[key];
              p.user.createdAt = new Date(p.user.createdAt);
              if (Array.isArray(p.subjects)) {
                p.subjects = p.subjects.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt) }));
              }
            });
            // Keep users list in sync
            data.state.users = Object.values(profiles).map((p: any) => p.user);
          }
          return data;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);