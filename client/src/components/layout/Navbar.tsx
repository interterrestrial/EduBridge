'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Image from 'next/image';

interface NavbarProps {
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export default function Navbar({ isCollapsed, toggleCollapse }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    if (pathname.includes('student-dashboard') || pathname.includes('teacher-dashboard')) return 'Dashboard';
    if (pathname.includes('notes')) return 'My Notes';
    if (pathname.includes('ai-chat')) return 'AI Tutor';
    if (pathname.includes('flashcards')) return 'Flashcards';
    if (pathname.includes('quizzes')) return 'Quizzes';
    if (pathname.includes('timetable')) return 'AI Timetable';
    if (pathname.includes('progress')) return 'Progress Analytics';
    if (pathname.includes('settings')) return 'Settings';
    return 'EduBridge';
  };

  return (
    <div className="h-20 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle (default hidden md) */}
        <button 
          onClick={toggleCollapse} 
          className="md:hidden p-2 text-[#a0a0a0] hover:text-white rounded-lg hover:bg-white/5"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Desktop show sidebar button when collapsed */}
        {isCollapsed && (
          <button 
            onClick={toggleCollapse} 
            className="hidden md:flex p-2 text-[#a0a0a0] hover:text-white rounded-lg hover:bg-white/5 bg-white/5 border border-border transition-colors shadow-lg"
            title="Show Sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white hidden md:block">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 text-[#a0a0a0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search notes, flashcards..." 
            className="bg-input border border-border rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-[#a0a0a0] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-64"
          />
        </div>

        <button className="relative p-2 text-[#a0a0a0] hover:text-white rounded-full hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-card"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-6 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-white leading-tight">{user?.name || 'User'}</p>
            <p className="text-xs text-[#a0a0a0] capitalize">{user?.role || 'Student'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/50 p-[2px]">
            <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center relative">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} fill className="object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
          
          <div className="absolute top-full mt-2 right-6 bg-card border border-border rounded-xl shadow-xl w-48 py-2 hidden group-hover:block">
             <div className="px-4 py-2 border-b border-border mb-2">
               <p className="text-sm text-white font-medium truncate">{user?.email}</p>
             </div>
             <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors">
               Sign Out
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
