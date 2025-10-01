import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, TrendingUp, BookOpen, Clock, CheckCircle, XCircle, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const REQUIRED_ATTENDANCE_PERCENTAGE = 75; // You can make this configurable

export default function Calendar() {
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const subjects = useAppStore((state) => state.subjects);
  const timetable = useAppStore((state) => state.timetable);
  const markAttendance = useAppStore((state) => state.markAttendance);
  const clearAttendance = useAppStore((state) => state.clearAttendance);
  const settings = useAppStore((state) => state.settings);
  const bulkMarkDates = useAppStore((state) => state.bulkMarkDates);
  const bulkClearDates = useAppStore((state) => state.bulkClearDates);
  const addHoliday = useAppStore((state) => state.addHoliday);
  const removeHoliday = useAppStore((state) => state.removeHoliday);
  const addExamDay = useAppStore((state) => state.addExamDay);
  const removeExamDay = useAppStore((state) => state.removeExamDay);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [multi, setMulti] = useState<Date[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Monthly Attendance Logic ---
  // Group attendance records by month
  const recordsByMonth = useMemo(() => {
    const grouped: Record<string, typeof attendanceRecords> = {};
    attendanceRecords.forEach((rec) => {
      if (rec.status === 'cancelled') return;
      const month = rec.date.slice(0, 7); // 'YYYY-MM'
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(rec);
    });
    return grouped;
  }, [attendanceRecords]);

  // Get all months with attendance
  const allMonths = useMemo(() => {
    const months = Object.keys(recordsByMonth).sort();
    return months;
  }, [recordsByMonth]);

  // Month selection state
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  // Calculate monthly stats (use total periods for denominator)
  const getMonthlyStats = (month: string) => {
    const records = recordsByMonth[month] || [];
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const { totalPeriods } = getWorkingDaysAndPeriodsInMonth(month);
    // Always show out of 100% (all periods present = 100%)
    const percentage = totalPeriods > 0 ? (present / totalPeriods) * 100 : 0;
    // Clamp to 100 if over (shouldn't happen, but for safety)
    const clamped = Math.min(percentage, 100);
    return { total: totalPeriods, present, absent, percentage: Math.round(clamped * 100) / 100 };
  };

  // Calculate working days and periods in a month (excluding holidays and Sundays)
  const getWorkingDaysAndPeriodsInMonth = (month: string) => {
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    let workingDays = 0;
    let totalPeriods = 0;
    let periodsPerDayArr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m - 1, d);
      const iso = format(date, 'yyyy-MM-dd');
      if (date.getDay() === 0) continue; // Sunday
      if (settings.holidays?.includes(iso)) continue; // Holiday
      if (settings.examDays?.includes(iso)) continue; // Exam day (no attendance taken)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = timetable.schedule.find((s) => s.day === dayName);
      const periods = schedule ? schedule.timeSlots.filter((s) => s.subjectId).length : 0;
      if (periods > 0) {
        workingDays++;
        totalPeriods += periods;
        periodsPerDayArr.push(periods);
      }
    }
    return { workingDays, totalPeriods, periodsPerDayArr };
  };

  // Calculate min periods to attend, periods can skip, and full days can skip
  const getAttendanceRequirement = (month: string) => {
    const { workingDays, totalPeriods, periodsPerDayArr } = getWorkingDaysAndPeriodsInMonth(month);
    const minAttendPeriods = Math.ceil((REQUIRED_ATTENDANCE_PERCENTAGE / 100) * totalPeriods);
    const canSkipPeriods = totalPeriods - minAttendPeriods;
    // Count already absent periods for this month
    const records = recordsByMonth[month] || [];
    const alreadyAbsent = records.filter(r => r.status === 'absent').length;
    const stillCanSkip = Math.max(0, canSkipPeriods - alreadyAbsent);
    // Calculate max full days can skip (by skipping days with most periods first)
    let periodsLeft = stillCanSkip;
    let fullDaysCanSkip = 0;
    const sortedPeriods = [...periodsPerDayArr].sort((a, b) => b - a); // skip days with most periods first
    for (let periods of sortedPeriods) {
      if (periodsLeft >= periods) {
        periodsLeft -= periods;
        fullDaysCanSkip++;
      } else {
        break;
      }
    }
    // Per-period value (for 1 period, how much it affects %)
    const perPeriodValue = totalPeriods > 0 ? (100 / totalPeriods) : 0;
    return { workingDays, totalPeriods, minAttendPeriods, canSkipPeriods, stillCanSkip, fullDaysCanSkip, perPeriodValue: Math.round(perPeriodValue * 1000) / 1000 };
  };
  const isSunday = (d: Date) => d.getDay() === 0;
  const isHolidayDate = (d: Date) => {
    const iso = format(d, 'yyyy-MM-dd');
    return isSunday(d) || (settings.holidays?.includes(iso) ?? false);
  };

  const isExamDay = (d: Date) => {
    const iso = format(d, 'yyyy-MM-dd');
    return settings.examDays?.includes(iso) ?? false;
  };

  const daySummary = (d: Date): 'holiday' | 'examDay' | 'allPresent' | 'allAbsent' | 'mixed' | undefined => {
    if (isHolidayDate(d)) return 'holiday';
    if (isExamDay(d)) return 'examDay'; // Exam days are treated as no-attendance days
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = timetable.schedule.find((s) => s.day === dayName);
    if (!schedule) return undefined;
    const slots = schedule.timeSlots.filter((s) => s.subjectId);
    if (slots.length === 0) return undefined;
    const iso = format(d, 'yyyy-MM-dd');
    let present = 0;
    let absent = 0;
    let cancelled = 0;
    slots.forEach((slot) => {
      const rec = attendanceRecords.find((r) => r.date === iso && r.timeSlotId === slot.id);
      if (!rec) return;
      if (rec.status === 'present') present += 1;
      else if (rec.status === 'absent') absent += 1;
      else if (rec.status === 'cancelled') cancelled += 1;
    });
    if (cancelled === slots.length) return 'holiday';
    if (present === slots.length && slots.length > 0) return 'allPresent';
    if (absent === slots.length && slots.length > 0) return 'allAbsent';
    if (present > 0 && absent > 0) return 'mixed';
    return undefined;
  };

  const stats = useMemo(() => {
    const totalClasses = attendanceRecords.filter(r => r.status !== 'cancelled').length;
    const presentClasses = attendanceRecords.filter(r => r.status === 'present').length;
    const absentClasses = attendanceRecords.filter(r => r.status === 'absent').length;
    const cancelledClasses = attendanceRecords.filter(r => r.status === 'cancelled').length;
    
    const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    return {
      totalClasses,
      presentClasses,
      absentClasses,
      cancelledClasses,
      percentage: Math.round(percentage * 100) / 100,
    };
  }, [attendanceRecords]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return typeof subject?.name === 'string' ? subject.name : 'Unknown Subject';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-neutral text-neutral-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    // Keep selected state in sync but do not open on unselect toggles
    if (date) setSelectedDate(date);
  };

  const handleDayClick = (day: Date) => {
    if (multiMode) return; // In multi mode, rely on DayPicker onSelect to manage selection
    const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
    if (selectedDate && fmt(selectedDate) === fmt(day)) {
      const dateString = fmt(day);
      const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
      useAppStore.getState().markAllDayAttendance(dateString, dayName, 'clear');
      setIsDialogOpen(false);
      setSelectedDate(undefined);
      return;
    }
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const toggleMultiDate = (day: Date) => {
    setMulti((prev) => {
      const iso = format(day, 'yyyy-MM-dd');
      const exists = prev.some(d => format(d, 'yyyy-MM-dd') === iso);
      return exists ? prev.filter(d => format(d, 'yyyy-MM-dd') !== iso) : [...prev, day];
    });
  };

  const getSelectedDaySchedule = () => {
    if (!selectedDate) return [];
    
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = timetable.schedule.find(d => d.day === dayName);
    
    if (!daySchedule) return [];
    
    return daySchedule.timeSlots.filter(slot => slot.subjectId);
  };

  const getAttendanceForDate = (timeSlotId: string) => {
    if (!selectedDate) return null;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return attendanceRecords.find(
      r => r.date === dateString && r.timeSlotId === timeSlotId
    );
  };

  const handleAttendanceUpdate = (timeSlotId: string, subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    if (!selectedDate) return;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    markAttendance(dateString, dayName, timeSlotId, subjectId, status);
  };

  const handleClearAttendance = (timeSlotId: string) => {
    if (!selectedDate) return;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    clearAttendance(dateString, timeSlotId);
  };

  const applyDayAction = (action: 'present' | 'absent' | 'clear' | 'holiday' | 'examDay') => {
    const dateObj = selectedDate || new Date();
    const dateString = format(dateObj, 'yyyy-MM-dd');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    if (action === 'holiday') {
      if (isSunday(dateObj)) return; // Sundays are always holidays; no toggle
      const isExplicitHoliday = settings.holidays?.includes(dateString);
      if (isExplicitHoliday) {
        removeHoliday(dateString);
      } else {
        addHoliday(dateString);
        // mark all as cancelled for holiday
        useAppStore.getState().markAllDayAttendance(dateString, dayName, 'cancelled');
      }
      setIsDialogOpen(false);
      setSelectedDate(undefined);
      return;
    }
    if (action === 'examDay') {
      const isExam = settings.examDays?.includes(dateString);
      if (isExam) {
        removeExamDay(dateString);
      } else {
        addExamDay(dateString);
        // mark all as cancelled for exam day (no attendance taken)
        useAppStore.getState().markAllDayAttendance(dateString, dayName, 'cancelled');
      }
      setIsDialogOpen(false);
      setSelectedDate(undefined);
      return;
    }
    if (isHolidayDate(dateObj) || isExamDay(dateObj)) return; // prevent overriding on holiday or exam day
    useAppStore.getState().markAllDayAttendance(dateString, dayName, action);
    setIsDialogOpen(false);
    setSelectedDate(undefined);
  };


  // Group records by date
  const recordsByDate = attendanceRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, typeof attendanceRecords>);

  const sortedDates = Object.keys(recordsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6 pb-24">

      {/* Interactive Calendar - Enhanced for mobile */}
      <Card className="bg-gradient-card shadow-card border-0 p-3 xs:p-4 sm:p-6">
        <div className="text-center mb-4">
          <h2 className="text-lg xs:text-xl font-semibold text-foreground mb-2">Select a Date</h2>
          <p className="text-xs xs:text-sm text-muted-foreground">Tap on a date to view and edit attendance</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          {/* Enhanced mobile controls */}
          <div className="flex items-center gap-2 flex-wrap justify-center xs:justify-end w-full">
            <Button
              variant={multiMode ? 'default' : 'outline'}
              size="sm"
              className="min-h-[44px] touch-manipulation"
              onClick={() => { setMultiMode((v) => !v); setMulti([]); }}
              aria-label="Multi Select"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <span className="text-xs xs:text-sm">Multi Select</span>
            </Button>
            {multiMode && multi.length > 0 && (
              <>
                <Button size="sm" variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => {
                  const list = multi.map(d => format(d, 'yyyy-MM-dd'));
                  bulkMarkDates(list, 'present');
                  setMulti([]);
                }}>
                  <span className="text-xs xs:text-sm">Present ({multi.length})</span>
                </Button>
                <Button size="sm" variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => {
                  const list = multi.map(d => format(d, 'yyyy-MM-dd'));
                  bulkMarkDates(list, 'absent');
                  setMulti([]);
                }}>Apply Absent</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const list = multi.map(d => format(d, 'yyyy-MM-dd'));
                  list.forEach(dateString => {
                    const dateObj = new Date(dateString);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    addHoliday(dateString);
                    useAppStore.getState().markAllDayAttendance(dateString, dayName, 'cancelled');
                  });
                  setMulti([]);
                }}>Apply Holiday</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const list = multi.map(d => format(d, 'yyyy-MM-dd'));
                  list.forEach(dateString => {
                    const dateObj = new Date(dateString);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    addExamDay(dateString);
                    useAppStore.getState().markAllDayAttendance(dateString, dayName, 'cancelled');
                  });
                  setMulti([]);
                }}>📚 Exam Day</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const list = multi.map(d => format(d, 'yyyy-MM-dd'));
                  list.forEach(dateString => {
                    // Remove holiday, exam day, and clear all attendance for the date
                    removeHoliday(dateString);
                    removeExamDay(dateString);
                    const dateObj = new Date(dateString);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    useAppStore.getState().markAllDayAttendance(dateString, dayName, 'clear');
                  });
                  setMulti([]);
                }}>Apply Clear</Button>
                <Button size="sm" variant="ghost" onClick={() => setMulti([])}>Clear Selection</Button>
              </>
            )}
          </div>
          {!multiMode ? (
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              onDayClick={handleDayClick}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                holiday: (day) => daySummary(day) === 'holiday',
                examDay: (day) => daySummary(day) === 'examDay',
                allPresent: (day) => daySummary(day) === 'allPresent',
                mixed: (day) => daySummary(day) === 'mixed',
                allAbsent: (day) => daySummary(day) === 'allAbsent',
              }}
              modifiersClassNames={{
                holiday: 'bg-yellow-500/80 text-foreground rounded-full', // � Holiday/Weekend
                examDay: 'bg-purple-500/80 text-foreground rounded-full', // 📚 Exam day
                allPresent: 'bg-green-500/80 text-foreground rounded-full', // 🟢 Present
                mixed: 'bg-blue-500/80 text-foreground rounded-full', // � Partial  
                allAbsent: 'bg-red-500/80 text-foreground rounded-full', // 🔴 Absent
              }}
            />
          ) : (
            <CalendarComponent
              mode="multiple"
              selected={multi as any}
              onDayClick={toggleMultiDate}
              classNames={{
                day_selected: 'ring-2 ring-primary ring-offset-1 bg-transparent text-foreground rounded-full',
              }}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                holiday: (day) => daySummary(day) === 'holiday',
                examDay: (day) => daySummary(day) === 'examDay',
                allPresent: (day) => daySummary(day) === 'allPresent',
                mixed: (day) => daySummary(day) === 'mixed',
                allAbsent: (day) => daySummary(day) === 'allAbsent',
              }}
              modifiersClassNames={{
                holiday: 'bg-yellow-500/80 text-foreground rounded-full', // � Holiday/Weekend
                examDay: 'bg-purple-500/80 text-foreground rounded-full', // 📚 Exam day
                allPresent: 'bg-green-500/80 text-foreground rounded-full', // 🟢 Present
                mixed: 'bg-blue-500/80 text-foreground rounded-full', // � Partial  
                allAbsent: 'bg-red-500/80 text-foreground rounded-full', // 🔴 Absent
              }}
            />
          )}
        </div>
      </Card>

      {/* Date Schedule Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedDate(undefined);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select Date'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
            {selectedDate && isHolidayDate(selectedDate) && (
              <Badge className="bg-blue-500 text-white">🔵 Holiday</Badge>
            )}
            {selectedDate && isExamDay(selectedDate) && (
              <Badge className="bg-purple-500 text-white">📚 Exam Day</Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => applyDayAction('present')}>Day: Present</Button>
            <Button size="sm" variant="outline" onClick={() => applyDayAction('absent')}>Day: Absent</Button>
            <Button size="sm" variant="outline" onClick={() => applyDayAction('clear')}>Day: Clear</Button>
            {selectedDate && isSunday(selectedDate) ? (
              <Button size="sm" variant="outline" disabled>Sunday: Holiday</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => applyDayAction('holiday')}>
                {(() => {
                  const d = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                  const isExplicitHol = settings.holidays?.includes(d);
                  return isExplicitHol ? 'Remove Holiday' : 'Set Holiday';
                })()}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => applyDayAction('examDay')}>
              {(() => {
                const d = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                const isExam = settings.examDays?.includes(d);
                return isExam ? 'Remove Exam Day' : 'Set Exam Day';
              })()}
            </Button>
          </div>
          
          {selectedDate && (
            <div className="space-y-4">
              {getSelectedDaySchedule().length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No classes scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getSelectedDaySchedule().map((timeSlot) => {
                    const attendance = getAttendanceForDate(timeSlot.id);
                    const subject = subjects.find(s => s.id === timeSlot.subjectId);
                    
                    return (
                      <Card key={timeSlot.id} className="p-3 border">
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {subject?.name || 'Unknown Subject'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label="Mark present"
                              onClick={() => handleAttendanceUpdate(timeSlot.id, timeSlot.subjectId!, 'present')}
                              className="border-success hover:bg-success hover:text-success-foreground"
                              disabled={selectedDate ? (isHolidayDate(selectedDate) || isExamDay(selectedDate)) : false}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label="Mark absent"
                              onClick={() => handleAttendanceUpdate(timeSlot.id, timeSlot.subjectId!, 'absent')}
                              className="border-warning hover:bg-warning hover:text-warning-foreground"
                              disabled={selectedDate ? (isHolidayDate(selectedDate) || isExamDay(selectedDate)) : false}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label="Mark off"
                              onClick={() => handleAttendanceUpdate(timeSlot.id, timeSlot.subjectId!, 'cancelled')}
                              className="border-neutral hover:bg-neutral hover:text-neutral-foreground"
                              disabled={selectedDate ? (isHolidayDate(selectedDate) || isExamDay(selectedDate)) : false}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Clear status"
                              onClick={() => handleClearAttendance(timeSlot.id)}
                              className="px-3"
                              disabled={selectedDate ? (isHolidayDate(selectedDate) || isExamDay(selectedDate)) : false}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            {attendance && (
                              <Badge className={getStatusColor(attendance.status)}>
                                {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="text-center">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground mb-2">Calendar</h1>
        <p className="text-sm xs:text-base text-muted-foreground">View your attendance history</p>
      </div>

      {/* Optimized single-row stats grid */}
      <div className="grid grid-cols-4 gap-1 xs:gap-2 w-full">
        <Card className="bg-gradient-card shadow-card border-0 p-1.5 xs:p-2 text-center">
          <div className="text-sm xs:text-base sm:text-lg font-bold text-success">{stats.presentClasses}</div>
          <div className="text-[9px] xs:text-[10px] text-muted-foreground">Present</div>
        </Card>
        <Card className="bg-gradient-card shadow-card border-0 p-1.5 xs:p-2 text-center">
          <div className="text-sm xs:text-base sm:text-lg font-bold text-warning">{stats.absentClasses}</div>
          <div className="text-[9px] xs:text-[10px] text-muted-foreground">Absent</div>
        </Card>
        <Card className="bg-gradient-card shadow-card border-0 p-1.5 xs:p-2 text-center">
          <div className="text-sm xs:text-base sm:text-lg font-bold text-neutral">{stats.cancelledClasses}</div>
          <div className="text-[9px] xs:text-[10px] text-muted-foreground">Cancelled</div>
        </Card>
        <Card className="bg-gradient-card shadow-card border-0 p-1.5 xs:p-2 text-center">
          <div className="text-sm xs:text-base sm:text-lg font-bold text-primary">{stats.percentage.toFixed(1)}%</div>
          <div className="text-[9px] xs:text-[10px] text-muted-foreground">Average</div>
        </Card>
      </div>

      {/* Enhanced Monthly Attendance Overview */}
      <Card className="bg-gradient-card shadow-card border-0 p-4 xs:p-6">
        <div className="mb-4">
          <h2 className="text-lg xs:text-xl font-semibold text-foreground mb-2">📊 Monthly Overview</h2>
          <p className="text-muted-foreground text-xs xs:text-sm">Select a month to view detailed analysis</p>
        </div>
        
        {allMonths.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">No attendance data yet</div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {allMonths.map(month => (
                <Button
                  key={month}
                  size="sm"
                  variant={selectedMonth === month ? 'default' : 'outline'}
                  onClick={() => setSelectedMonth(selectedMonth === month ? undefined : month)}
                  className="text-xs"
                >
                  {month}
                </Button>
              ))}
            </div>
            
            {selectedMonth && (() => {
              const monthlyStats = getMonthlyStats(selectedMonth) || { percentage: 0, present: 0, absent: 0 };
              const attendanceReq = getAttendanceRequirement(selectedMonth) || { workingDays: 0, totalPeriods: 0, minAttendPeriods: 0, stillCanSkip: 0, fullDaysCanSkip: 0, perPeriodValue: 0 };
              return (
                <div className="space-y-4">
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
                    <Card className="p-3 text-center bg-primary/10 border-primary/20">
                      <div className="text-xl xs:text-2xl font-bold text-primary">{monthlyStats.percentage ?? 0}%</div>
                      <div className="text-[10px] xs:text-xs text-muted-foreground">Avg. Attendance</div>
                    </Card>
                    <Card className="p-3 text-center bg-success/10 border-success/20">
                      <div className="text-xl xs:text-2xl font-bold text-success">{monthlyStats.present ?? 0}</div>
                      <div className="text-[10px] xs:text-xs text-muted-foreground">Present</div>
                    </Card>
                    <Card className="p-3 text-center bg-warning/10 border-warning/20">
                      <div className="text-xl xs:text-2xl font-bold text-warning">{monthlyStats.absent ?? 0}</div>
                      <div className="text-[10px] xs:text-xs text-muted-foreground">Absent</div>
                    </Card>
                    <Card className="p-3 text-center bg-muted/10 border-muted/20">
                      <div className="text-xl xs:text-2xl font-bold text-foreground">{attendanceReq.totalPeriods ?? 0}</div>
                      <div className="text-[10px] xs:text-xs text-muted-foreground">Total Periods</div>
                    </Card>
                  </div>
                  
                  {/* Detailed Requirements */}
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 xs:gap-3">
                    <div className="p-2 xs:p-3 text-center bg-success/5 rounded-lg border border-success/10">
                      <div className="text-sm xs:text-base font-bold text-success">{attendanceReq.minAttendPeriods ?? 0}</div>
                      <div className="text-[9px] xs:text-[10px] text-muted-foreground leading-tight">Min. Periods to Attend</div>
                    </div>
                    <div className="p-2 xs:p-3 text-center bg-warning/5 rounded-lg border border-warning/10">
                      <div className="text-sm xs:text-base font-bold text-warning">{attendanceReq.stillCanSkip ?? 0}</div>
                      <div className="text-[9px] xs:text-[10px] text-muted-foreground leading-tight">Periods Can Skip</div>
                    </div>
                    <div className="p-2 xs:p-3 text-center bg-orange-500/5 rounded-lg border border-orange-500/10">
                      <div className="text-sm xs:text-base font-bold text-orange-600">{attendanceReq.fullDaysCanSkip ?? 0}</div>
                      <div className="text-[9px] xs:text-[10px] text-muted-foreground leading-tight">Full Days Can Skip</div>
                    </div>
                    <div className="p-2 xs:p-3 text-center bg-primary/5 rounded-lg border border-primary/10">
                      <div className="text-sm xs:text-base font-bold text-primary">{attendanceReq.perPeriodValue ?? 0}%</div>
                      <div className="text-[9px] xs:text-[10px] text-muted-foreground leading-tight">Per Period Value</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </Card>

      {/* Attendance History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Attendance History</h2>
          <Button
            variant={showHistory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="min-h-[44px] touch-manipulation"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </Button>
        </div>
        
        {showHistory && (sortedDates.length === 0 ? (
          <Card className="bg-gradient-card shadow-card border-0 p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Attendance Records</h3>
            <p className="text-muted-foreground">Start marking attendance to see your history here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const records = recordsByDate[date];
              const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
              const formattedDate = new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <Card key={date} className="bg-gradient-card shadow-card border-0 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{dayName}</h3>
                      <p className="text-sm text-muted-foreground">{formattedDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {Math.round((records.filter(r => r.status === 'present').length / records.filter(r => r.status !== 'cancelled').length) * 100) || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    {records.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {getSubjectName(record.subjectId) ?? ''}
                          </span>
                        </div>
                        <Badge className={getStatusColor(record.status) ?? ''}>
                          {typeof record.status === 'string' ? (record.status.charAt(0).toUpperCase() + record.status.slice(1)) : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}