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
      {/* Enhanced responsive container with better mobile padding */}
      <div className="container mx-auto px-2 xs:px-3 sm:px-4 md:px-6 py-3 xs:py-4 sm:py-6 max-w-7xl">
        {/* Theme toggle moved into Attendance Overview */}
        <AttendanceStats />
        {/* Enhanced spacing for mobile and safe areas */}
        <main className="mt-3 xs:mt-4 sm:mt-6 pb-20 xs:pb-22 sm:pb-24 md:pb-28 supports-[safe-area-inset-bottom]:pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
        <Navigation />
        <PwaBanner />
        <InstallPrompt />
      </div>
    </div>
  );
};