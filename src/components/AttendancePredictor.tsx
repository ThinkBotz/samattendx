import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Calculator, TrendingUp } from 'lucide-react';
import { eachDayOfInterval, endOfMonth, startOfDay } from 'date-fns';

export const AttendancePredictor = () => {
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const timetable = useAppStore((state) => state.timetable);
  const settings = useAppStore((state) => state.settings);
  
  const predictions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Records this month (exclude cancelled)
    const monthlyRecords = attendanceRecords.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.status !== 'cancelled';
    });

    const monthlyTotal = monthlyRecords.length;
    const monthlyPresent = monthlyRecords.filter((r) => r.status === 'present').length;
    const currentPercentage = monthlyTotal > 0 ? (monthlyPresent / monthlyTotal) * 100 : 0;

    // Compute remaining classes in the rest of the month based on actual timetable
    const start = startOfDay(now);
    const end = endOfMonth(now);
    let rangeStart = start;
    let rangeEnd = end;
    if (settings.semesterStart) {
      const s = new Date(settings.semesterStart);
      if (!isNaN(s.getTime()) && s > rangeStart) rangeStart = s;
    }
    if (settings.semesterEnd) {
      const e = new Date(settings.semesterEnd);
      if (!isNaN(e.getTime()) && e < rangeEnd) rangeEnd = e;
    }
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    // Map of weekday -> number of scheduled classes with subjects
    const classesByWeekday: Record<string, number> = {};
    timetable.schedule.forEach((day) => {
      const count = day.timeSlots.filter((s) => s.subjectId).length;
      classesByWeekday[day.day] = count;
    });

    const holidaysSet = new Set(settings.holidays || []);
    const remainingClasses = days.reduce((sum, date) => {
      const iso = date.toISOString().slice(0, 10);
      if (date.getDay() === 0 || holidaysSet.has(iso)) return sum; // Sunday or holiday
      // Skip today if time window has already started? Keep it simple: include today and forward
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      const count = classesByWeekday[weekday] || 0;
      return sum + count;
    }, 0);

    const estimatedRemainingClasses = Math.max(0, Math.trunc(remainingClasses));

    const calculate = (targetPercentage: number) => {
      const totalProjected = monthlyTotal + estimatedRemainingClasses; // integer
      const requiredPresent = Math.ceil((targetPercentage / 100) * totalProjected);
      const needToAttend = Math.max(0, requiredPresent - monthlyPresent);
      const canMiss = Math.max(0, totalProjected - requiredPresent - (monthlyTotal - monthlyPresent));

      return {
        needToAttend,
        canMiss,
        totalProjected,
        requiredPresent,
      };
    };

    return {
      currentPercentage: Math.round(currentPercentage * 100) / 100,
      monthlyTotal,
      monthlyPresent,
      estimatedRemainingClasses,
      target75: calculate(75),
      target76: calculate(76),
    };
  }, [attendanceRecords, timetable, settings]);
  
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="bg-gradient-card shadow-card border-0 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Attendance Predictor</h2>
        <Calculator className="h-5 w-5 text-primary" />
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Current Monthly Average</p>
          <p className={`text-2xl font-bold ${getStatusColor(predictions.currentPercentage)}`}>
            {predictions.currentPercentage}%
          </p>
          <p className="text-xs text-muted-foreground">
            {predictions.monthlyPresent} / {predictions.monthlyTotal} classes
          </p>
        </div>

        {predictions.estimatedRemainingClasses > 0 && (
          <>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Estimated {predictions.estimatedRemainingClasses} classes remaining this month
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 text-success mr-2" />
                    <span className="font-medium text-success">75% Target</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Need to attend: <span className="font-semibold text-foreground">{predictions.target75.needToAttend}</span> classes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Can miss: <span className="font-semibold text-foreground">{predictions.target75.canMiss}</span> classes
                  </p>
                </div>
                
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 text-primary mr-2" />
                    <span className="font-medium text-primary">76% Target</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Need to attend: <span className="font-semibold text-foreground">{predictions.target76.needToAttend}</span> classes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Can miss: <span className="font-semibold text-foreground">{predictions.target76.canMiss}</span> classes
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};