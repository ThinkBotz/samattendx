import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navigation } from './Navigation';
import { AttendanceStats } from './AttendanceStats';
import { PwaBanner } from './PwaBanner';
import { InstallPrompt } from './InstallPrompt';

export const Layout = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Theme toggle moved into Attendance Overview */}
        <AttendanceStats />
        <main className="mt-4 sm:mt-6 pb-24">
          <Outlet />
        </main>
        <Navigation />
        <PwaBanner />
        <InstallPrompt />
      </div>
    </div>
  );
};