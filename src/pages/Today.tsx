import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Ban, RotateCcw, Clock, CheckCheck, XCircle, Power, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Today() {
  const subjects = useAppStore((state) => state.subjects);
  const timetable = useAppStore((state) => state.timetable);
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  
  const todaySchedule = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = timetable.schedule.find(d => d.day === today);
    return daySchedule?.timeSlots || [];
  }, [timetable]);
  const markAttendance = useAppStore((state) => state.markAttendance);
  const clearAttendance = useAppStore((state) => state.clearAttendance);
  const markAllDayAttendance = useAppStore((state) => state.markAllDayAttendance);

  const today = new Date().toISOString().split('T')[0];
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'Free Period';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getAttendanceStatus = (timeSlotId: string) => {
    const record = attendanceRecords.find(
      r => r.date === today && r.timeSlotId === timeSlotId
    );
    return record?.status;
  };

  const handleAttendance = (timeSlotId: string, subjectId: string | undefined, status: 'present' | 'absent' | 'cancelled') => {
    if (!subjectId) return;
    markAttendance(today, todayName, timeSlotId, subjectId, status);
  };

  const handleClear = (timeSlotId: string) => {
    clearAttendance(today, timeSlotId);
  };

  const handleBulkAttendance = (status: 'present' | 'absent' | 'cancelled' | 'clear') => {
    markAllDayAttendance(today, todayName, status);
    const statusText = status === 'clear' ? 'cleared' : `marked as ${status}`;
    toast.success(`All classes ${statusText} for today!`);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-neutral text-neutral-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 xs:space-y-6 pb-20 xs:pb-24">
      <div className="text-center">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground mb-2">Today's Schedule</h1>
        <p className="text-sm xs:text-base text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {todaySchedule.length === 0 ? (
        <Card className="bg-gradient-card shadow-card border-0 p-6 xs:p-8 text-center">
          <Clock className="h-10 w-10 xs:h-12 xs:w-12 text-muted-foreground mx-auto mb-3 xs:mb-4" />
          <h3 className="text-base xs:text-lg font-semibold text-foreground mb-2">No Classes Today</h3>
          <p className="text-sm xs:text-base text-muted-foreground">Enjoy your free day!</p>
        </Card>
      ) : (
        <>
          <Card className="bg-gradient-card shadow-card border-0 p-3 xs:p-4">
            <h3 className="text-base xs:text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
            {/* Compact quick actions with icons only */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => handleBulkAttendance('present')}
                size="icon"
                aria-label="All Present"
                title="Mark All Present"
                className="bg-success hover:bg-success/90 text-success-foreground w-10 h-10 min-h-[40px] touch-manipulation"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleBulkAttendance('absent')}
                size="icon"
                aria-label="All Absent"
                title="Mark All Absent"
                className="bg-warning hover:bg-warning/90 text-warning-foreground w-10 h-10 min-h-[40px] touch-manipulation"
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleBulkAttendance('cancelled')}
                size="icon"
                aria-label="All Off"
                title="Mark All Off"
                className="bg-neutral hover:bg-neutral/90 text-neutral-foreground w-10 h-10 min-h-[40px] touch-manipulation"
              >
                <Power className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleBulkAttendance('clear')}
                variant="outline"
                size="icon"
                aria-label="Clear All"
                title="Clear All"
                className="border-muted-foreground text-muted-foreground hover:bg-muted w-10 h-10 min-h-[40px] touch-manipulation"
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="space-y-3 xs:space-y-4">
            {todaySchedule.map((slot) => {
            const status = getAttendanceStatus(slot.id);
            const subjectName = getSubjectName(slot.subjectId);
            
            return (
              <Card 
                key={slot.id} 
                className="bg-gradient-card shadow-card border-0 p-3 hover:shadow-hover transition-all duration-200"
              >
                {/* Compact layout for class cards */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground truncate">{subjectName}</h3>
                      {/* Status indicator */}
                      {status && (
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(status))}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                  
                  {/* Ultra compact icon-only buttons */}
                  <div className="flex items-center gap-0.5">
                    {slot.subjectId && (
                      <>
                        <Button
                          variant={status === 'present' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendance(slot.id, slot.subjectId, 'present')}
                          aria-label="Mark present"
                          title="Present"
                          className="w-8 h-8 p-0 min-h-[32px] touch-manipulation"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={status === 'absent' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendance(slot.id, slot.subjectId, 'absent')}
                          aria-label="Mark absent"
                          title="Absent"
                          className="w-8 h-8 p-0 min-h-[32px] touch-manipulation"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={status === 'cancelled' ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendance(slot.id, slot.subjectId, 'cancelled')}
                          aria-label="Mark cancelled"
                          title="Cancelled"
                          className="w-8 h-8 p-0 min-h-[32px] touch-manipulation"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClear(slot.id)}
                          aria-label="Clear status"
                          title="Clear"
                          className="w-8 h-8 p-0 min-h-[32px] touch-manipulation"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}