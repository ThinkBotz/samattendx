import { NavLink } from 'react-router-dom';
import { Calendar, Clock, BookOpen, Settings, Home, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Today' },
  { path: '/timetable', icon: Clock, label: 'Timetable' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/subjects', icon: BookOpen, label: 'Subjects' },
  { path: '/settings', icon: Settings, label: 'Settings' },

];

export const Navigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t shadow-lg backdrop-blur-sm bg-card/95 z-50 supports-[safe-area-inset-bottom]:pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-1 xs:px-2 sm:px-4">
        {/* Enhanced mobile navigation with better touch targets */}
        <div className="flex justify-around items-center h-14 xs:h-16 sm:h-16 md:h-18">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center px-1.5 xs:px-2 sm:px-3 md:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl transition-all duration-200 min-w-0 touch-manipulation",
                  // Enhanced touch targets for mobile
                  "min-h-[44px] min-w-[44px] active:scale-95",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10"
                )
              }
            >
              <Icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 mb-0.5 xs:mb-1 flex-shrink-0" />
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium truncate leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};