'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  Layers, 
  HelpCircle, 
  TrendingUp, 
  Calendar,
  Users,
  Send,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isTeacher = user?.role === 'teacher';

  const studentLinks = [
    { name: 'Dashboard', href: '/student-dashboard', icon: LayoutDashboard },
    { name: 'My Notes', href: '/notes', icon: FileText },
    { name: 'AI Tutor', href: '/ai-chat', icon: Bot },
    { name: 'Flashcards', href: '/flashcards', icon: Layers },
    { name: 'Quizzes', href: '/quizzes', icon: HelpCircle },
    { name: 'AI Timetable', href: '/timetable', icon: Calendar },
    { name: 'Gamified Progress', href: '/progress', icon: TrendingUp },
  ];

  const teacherLinks = [
    { name: 'Classroom Command', href: '/teacher-dashboard', icon: Users },
    { name: 'Class Heatmap & Roster', href: '/teacher-dashboard', icon: BarChart2 },
    { name: 'Push Remedial Notes', href: '/teacher-dashboard', icon: Send },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <div
      className={`bg-card border-r border-border h-screen flex flex-col hidden md:flex fixed left-0 top-0 transition-all duration-300 z-40 overflow-hidden ${
        isCollapsed ? 'w-0 opacity-0 border-0' : 'w-64'
      }`}
    >
      {/* Header with Logo & Toggle Button */}
      <div className="p-4 flex items-center justify-between border-b border-border w-64">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/20 w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-primary/30 shadow-sm">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <span className="text-xl font-bold tracking-tight text-white block">EduBridge</span>
              <span className="text-[10px] uppercase font-bold text-primary">
                {isTeacher ? 'Teacher Portal' : 'Student Portal'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0a0a0] hover:text-white transition-colors shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
        {links.map((link, idx) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.name.includes('Dashboard') && pathname.includes('dashboard'));
          
          return (
            <Link 
              key={idx} 
              href={link.href}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                isCollapsed ? 'justify-center' : ''
              } ${
                isActive 
                  ? 'bg-primary/20 text-primary font-semibold' 
                  : 'text-[#a0a0a0] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-[#a0a0a0]'}`} />
              {!isCollapsed && <span className="truncate">{link.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Settings Link */}
      <div className="p-3 border-t border-border">
        <Link 
          href="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
            isCollapsed ? 'justify-center' : ''
          } ${
            pathname === '/settings'
              ? 'bg-primary/20 text-primary font-semibold' 
              : 'text-[#a0a0a0] hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </Link>
      </div>
    </div>
  );
}
