import { Card } from '@/components/ui/card';
import Diagnostics from './Diagnostics';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Download, Upload, Trash2, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showAcademicSettings, setShowAcademicSettings] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);
  const subjects = useAppStore((state) => state.subjects);
  const timetable = useAppStore((state) => state.timetable);
  const attendanceRecords = useAppStore((state) => state.attendanceRecords);
  const importData = useAppStore((state) => state.importData);
  const settings = useAppStore((state) => state.settings);
  const addHoliday = useAppStore((state) => state.addHoliday);
  const removeHoliday = useAppStore((state) => state.removeHoliday);
  const addExamDay = useAppStore((state) => state.addExamDay);
  const removeExamDay = useAppStore((state) => state.removeExamDay);
  const setSemester = useAppStore((state) => state.setSemester);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [holidayInput, setHolidayInput] = useState('');
  const [examDayInput, setExamDayInput] = useState('');
  const [semesterStart, setSemesterStart] = useState<string>(settings.semesterStart || '');
  const [semesterEnd, setSemesterEnd] = useState<string>(settings.semesterEnd || '');

  const exportData = () => {
    const data = {
      subjects,
      timetable,
      attendanceRecords,
      settings,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    try { localStorage.setItem('student-app:lastBackupAt', new Date().toISOString()); } catch {}
    toast.success('Data exported successfully!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the data structure
      if (!data.subjects || !data.timetable || !data.attendanceRecords) {
        throw new Error('Invalid backup file format');
      }
      
  importData(data);
  try { localStorage.setItem('student-app:lastRestoreAt', new Date().toISOString()); } catch {}
      toast.success('Data imported successfully!');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to import data. Please check your backup file.');
      console.error('Import error:', error);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('student-app-storage');
      window.location.reload();
      toast.success('All data cleared successfully!');
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={() => setShowDiagnostics((v) => !v)}>
          {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
        </Button>
      </div>
      {showDiagnostics && (
        <div className="my-4">
          <Diagnostics />
        </div>
      )}
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Manage your app preferences</p>
      </div>

      {/* App Info */}
      <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">App Information</h2>
          </div>
          <Button
            variant={showAppInfo ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAppInfo(!showAppInfo)}
            className="min-h-[44px] touch-manipulation"
          >
            {showAppInfo ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
        
        {showAppInfo && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Subjects:</span>
              <span className="font-medium text-foreground">{subjects.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Attendance Records:</span>
              <span className="font-medium text-foreground">{attendanceRecords.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="font-medium text-foreground">1.2.1</span>
            </div>
          </div>
        )}
      </Card>

      {/* Academic Settings */}
      <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SettingsIcon className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">Academic Settings</h2>
          </div>
          <Button
            variant={showAcademicSettings ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAcademicSettings(!showAcademicSettings)}
            className="min-h-[44px] touch-manipulation"
          >
            {showAcademicSettings ? 'Hide Options' : 'Show Options'}
          </Button>
        </div>
        
        {showAcademicSettings && (
          <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semesterStart">Semester Start</Label>
              <Input id="semesterStart" type="date" value={semesterStart} onChange={(e) => setSemesterStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semesterEnd">Semester End</Label>
              <Input id="semesterEnd" type="date" value={semesterEnd} onChange={(e) => setSemesterEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => { setSemester(semesterStart || undefined, semesterEnd || undefined); toast.success('Semester dates saved'); }}>Save Semester</Button>
          </div>
          <div className="space-y-2">
            <Label>Add Holiday</Label>
            <div className="flex gap-2">
              <Input type="date" value={holidayInput} onChange={(e) => setHolidayInput(e.target.value)} />
              <Button onClick={() => { if (holidayInput) { addHoliday(holidayInput); setHolidayInput(''); toast.success('Holiday added'); } }}>Add</Button>
            </div>
          </div>
          {settings.holidays?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {settings.holidays.map((d) => (
                <div key={d} className="flex items-center justify-between p-2 bg-card rounded border">
                  <span className="text-sm text-foreground">🔵 {d}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeHoliday(d)}>Remove</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No holidays added</p>
          )}
          <div className="space-y-2">
            <Label>Add Exam Day (no attendance taken)</Label>
            <div className="flex gap-2">
              <Input type="date" value={examDayInput} onChange={(e) => setExamDayInput(e.target.value)} />
              <Button onClick={() => { if (examDayInput) { addExamDay(examDayInput); setExamDayInput(''); toast.success('Exam day added'); } }}>📚 Add</Button>
            </div>
          </div>
          {settings.examDays?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {settings.examDays.map((d) => (
                <div key={d} className="flex items-center justify-between p-2 bg-card rounded border border-purple-200">
                  <span className="text-sm text-foreground">📚 {d}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeExamDay(d)}>Remove</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No exam days added</p>
          )}
          </div>
        )}
      </Card>

  {/* Data Management */}
      <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SettingsIcon className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
          </div>
          <Button
            variant={showDataManagement ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDataManagement(!showDataManagement)}
            className="min-h-[44px] touch-manipulation"
          >
            {showDataManagement ? 'Hide Options' : 'Show Options'}
          </Button>
        </div>
        
        {showDataManagement && (
          <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">Export Data</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Download a backup of all your data</p>
            </div>
            <Button variant="outline" onClick={exportData} className="shrink-0 w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">Import Data</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Restore data from a backup file</p>
            </div>
            <Button variant="outline" onClick={handleImportClick} className="shrink-0 w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-destructive/20">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-destructive">Clear All Data</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Permanently delete all subjects, timetables, and attendance records</p>
            </div>
            <Button variant="outline" onClick={clearAllData} className="shrink-0 w-full sm:w-auto text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
        )}
      </Card>

      {/* Cloud Backup removed: using local export/import only */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Contact Information */}
      <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <Info className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">Contact Developer</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-muted-foreground">Phone:</span>
            <a href="tel:+919951970441" className="font-medium text-primary hover:underline">+91 9951970441</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-muted-foreground">Email:</span>
            <a href="mailto:syedsame2244@gmail.com" className="font-medium text-primary hover:underline break-all">syedsame2244@gmail.com</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-muted-foreground">Instagram:</span>
            <a href="https://instagram.com/_samxiao" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">@_samxiao</a>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="bg-gradient-card shadow-card border-0 p-4 sm:p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Student Attendance Tracker</h3>
        <p className="text-muted-foreground text-sm">
          A simple and efficient way to track your class attendance and maintain academic records.
        </p>
      </Card>
    </div>
  );
}