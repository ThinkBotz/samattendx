
import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserProfileSelector from '@/components/UserProfileSelector';
import { format } from 'date-fns';

export const AttendanceStats = () => {
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const settings = useAppStore((state) => state.settings);
  

  // --- Monthly Attendance Logic (copied from Calendar) ---
  const timetable = useAppStore((state) => state.timetable);
  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');

  // Group attendance records by month
  const recordsByMonth = useMemo(() => {
    const grouped = {};
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
  const getWorkingDaysAndPeriodsInMonth = (month) => {
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    let totalPeriods = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m - 1, d);
      const iso = format(date, 'yyyy-MM-dd');
      if (date.getDay() === 0) continue; // Sunday
      if (settings.holidays?.includes(iso)) continue;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = timetable.schedule.find((s) => s.day === dayName);
      const periods = schedule ? schedule.timeSlots.filter((s) => s.subjectId).length : 0;
      if (periods > 0) {
        totalPeriods += periods;
      }
    }
    return { totalPeriods };
  };

  // Calculate monthly stats (use total periods for denominator)
  const getMonthlyStats = (month) => {
    const records = recordsByMonth[month] || [];
    const present = records.filter(r => r.status === 'present').length;
    const { totalPeriods } = getWorkingDaysAndPeriodsInMonth(month);
    const percentage = totalPeriods > 0 ? (present / totalPeriods) * 100 : 0;
    const clamped = Math.min(percentage, 100);
    return { total: totalPeriods, present, percentage: Math.round(clamped * 100) / 100 };
  };

  // --- Overall Attendance Logic (all months, like monthly logic) ---
  // Get all months with attendance
  // (already declared above)
  // Calculate total possible periods across all months
  let totalPossiblePeriods = 0;
  allMonths.forEach(month => {
    totalPossiblePeriods += getWorkingDaysAndPeriodsInMonth(month).totalPeriods;
  });
  const presentClasses = attendanceRecords.filter(r => r.status === 'present').length;
  const percentage = totalPossiblePeriods > 0 ? (presentClasses / totalPossiblePeriods) * 100 : 0;

  // This month stats (show latest month with attendance if current is empty)
  const monthlyStats = getMonthlyStats(monthToShow);
  const stats = {
    percentage: Math.round(percentage * 100) / 100,
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
    <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Attendance Overview</h2>
        <div className="flex items-center gap-3 sm:gap-4">
          <UserProfileSelector />
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full",
                getPercentageBg(stats.percentage),
              )}
            >
              <span className={cn("text-xs sm:text-sm font-bold", getPercentageColor(stats.percentage))}>
                {stats.percentage.toFixed(0)}%
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground">Overall</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full",
                getPercentageBg(stats.monthlyPercentage),
              )}
            >
              <span className={cn("text-xs sm:text-sm font-bold", getPercentageColor(stats.monthlyPercentage))}>
                {stats.monthlyPercentage.toFixed(0)}%
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground">This Month</span>
          </div>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </Card>
  );
};

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}