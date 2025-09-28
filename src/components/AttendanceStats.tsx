import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserProfileSelector from '@/components/UserProfileSelector';

export const AttendanceStats = () => {
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const settings = useAppStore((state) => state.settings);
  
  const stats = useMemo(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const holidays = new Set(settings.holidays || []);
    
  // Overall stats
  const totalClasses = attendanceRecords.filter(r => r.status !== 'cancelled').length;
  const presentClasses = attendanceRecords.filter(r => r.status === 'present').length;
  const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    // Monthly stats
    const monthlyRecords = attendanceRecords.filter(r => {
      const recordDate = new Date(r.date);
      const iso = r.date;
      if (recordDate.getDay() === 0) return false; // Sunday
      if (holidays.has(iso)) return false;
      if (settings.semesterStart) {
        const s = new Date(settings.semesterStart);
        if (!isNaN(s.getTime()) && recordDate < s) return false;
      }
      if (settings.semesterEnd) {
        const e = new Date(settings.semesterEnd);
        if (!isNaN(e.getTime()) && recordDate > e) return false;
      }
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear &&
             r.status !== 'cancelled';
    });
    
    const monthlyTotal = monthlyRecords.length;
    const monthlyPresent = monthlyRecords.filter(r => r.status === 'present').length;
    const monthlyPercentage = monthlyTotal > 0 ? (monthlyPresent / monthlyTotal) * 100 : 0;

    return {
      percentage: Math.round(percentage * 100) / 100,
      monthlyPercentage: Math.round(monthlyPercentage * 100) / 100,
    };
  }, [attendanceRecords, settings]);

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