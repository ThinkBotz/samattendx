import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { AttendancePredictor } from '@/components/AttendancePredictor';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function Diagnostics() {
  const subjects = useAppStore((s) => s.subjects);
  const timetable = useAppStore((s) => s.timetable);
  const attendanceRecords = useAppStore((s) => s.attendanceRecords);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);

  const appJson = useMemo(() => JSON.stringify({ subjects, timetable, attendanceRecords }), [subjects, timetable, attendanceRecords]);
  const appDataBytes = new Blob([appJson]).size;

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(setStorageEstimate).catch(() => setStorageEstimate(null));
    }
  }, []);

  const lastBackupAt = (() => {
    try {
      const raw = localStorage.getItem('student-app:lastBackupAt');
      return raw ? new Date(raw).toLocaleString() : '—';
    } catch { return '—'; }
  })();
  const lastRestoreAt = (() => {
    try {
      const raw = localStorage.getItem('student-app:lastRestoreAt');
      return raw ? new Date(raw).toLocaleString() : '—';
    } catch { return '—'; }
  })();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Diagnostics</h1>
        <p className="text-muted-foreground">Offline readiness and storage details</p>
      </div>

      <Card className="bg-gradient-card shadow-card border-0 p-6">
        <h2 className="text-lg font-semibold mb-3">Storage</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>App data size:</span><span className="font-medium text-foreground">{formatBytes(appDataBytes)}</span></div>
          {storageEstimate && (
            <>
              <div className="flex justify-between"><span>Storage used:</span><span className="font-medium text-foreground">{formatBytes(storageEstimate.usage || 0)}</span></div>
              <div className="flex justify-between"><span>Storage quota:</span><span className="font-medium text-foreground">{formatBytes(storageEstimate.quota || 0)}</span></div>
            </>
          )}
        </div>
      </Card>

      <Card className="bg-gradient-card shadow-card border-0 p-6">
        <h2 className="text-lg font-semibold mb-3">Backups</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Last backup time:</span><span className="font-medium text-foreground">{lastBackupAt}</span></div>
          <div className="flex justify-between"><span>Last restore time:</span><span className="font-medium text-foreground">{lastRestoreAt}</span></div>
        </div>
      </Card>

      <AttendancePredictor />
    </div>
  );
}
