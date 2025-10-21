
import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const REQUIRED_ATTENDANCE_PERCENTAGE = 75;

export const AttendanceStats = () => {
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const settings = useAppStore((state) => state.settings);
  

  // --- Monthly Attendance Logic (copied from Calendar) ---
  const timetable = useAppStore((state) => state.timetable);
  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');

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

  // Find the latest month with attendance if current month is empty
  const allMonths = Object.keys(recordsByMonth).sort();
  let monthToShow = currentMonthStr;
  if (!recordsByMonth[monthToShow] || recordsByMonth[monthToShow].length === 0) {
    if (allMonths.length > 0) {
      monthToShow = allMonths[allMonths.length - 1];
    }
  }

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

  // Calculate monthly stats (only counting periods where attendance was taken)
  const getMonthlyStats = (month: string) => {
    const records = recordsByMonth[month] || [];
    // Only count records where attendance was taken (present or absent)
    const validRecords = records.filter(r => r.status === 'present' || r.status === 'absent');
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const totalTaken = present + absent; // Total classes where attendance was taken
    
    // Calculate percentage based only on classes where attendance was taken
    const percentage = totalTaken > 0 ? (present / totalTaken) * 100 : 0;
    // Clamp to 100 if over (shouldn't happen, but for safety)
    const clamped = Math.min(percentage, 100);
    return { total: totalTaken, present, absent, percentage: Math.round(clamped * 100) / 100 };
  };

  // Calculate stats across all attendance records
  const validRecords = attendanceRecords.filter(r => r.status === 'present' || r.status === 'absent');
  const totalClassesConducted = validRecords.length;
  const totalPresentClasses = validRecords.filter(r => r.status === 'present').length;
  const totalAbsentClasses = validRecords.filter(r => r.status === 'absent').length;

  // Calculate percentage only from classes where attendance was taken
  const percentage = totalClassesConducted > 0 ? (totalPresentClasses / totalClassesConducted) * 100 : 0;
  const overallPercentage = Math.min(Math.round(percentage * 100) / 100, 100);

  // This month stats (show latest month with attendance if current is empty)
  const monthlyStats = getMonthlyStats(monthToShow);
  
  const stats = {
    percentage: overallPercentage,
    monthlyPercentage: monthlyStats.percentage,
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 75) return 'bg-success-light';
    if (percentage >= 60) return 'bg-warning-light';
    return 'bg-destructive/10';
  };

  return (
    <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6 w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap tracking-tight">
          Attendance Overview
        </h2>
        <div className={cn(
          "text-lg font-semibold whitespace-nowrap px-2 py-0.5 rounded-lg",
          getPercentageBg(stats.percentage),
          getPercentageColor(stats.percentage)
        )}>
          {stats.percentage.toFixed(1)}% Overall
        </div>
      </div>
    </Card>
  );
};