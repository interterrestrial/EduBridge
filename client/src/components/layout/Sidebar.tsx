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
  Settings,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { name: 'Dashboard', href: user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard', icon: LayoutDashboard },
    { name: 'My Notes', href: '/notes', icon: FileText },
    { name: 'AI Tutor', href: '/ai-chat', icon: Bot },
    { name: 'Flashcards', href: '/flashcards', icon: Layers },
    { name: 'Quizzes', href: '/quizzes', icon: HelpCircle },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
  ];

  return (
    <div className="w-64 bg-[#1e1e2f] border-r border-white/10 h-screen flex flex-col hidden md:flex fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">EduBridge</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.name === 'Dashboard' && pathname.includes('dashboard'));
          
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-500/20 text-indigo-400 font-semibold' 
                  : 'text-[#a0a0b0] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-[#a0a0b0]'}`} />
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <Link 
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname === '/settings'
              ? 'bg-indigo-500/20 text-indigo-400 font-semibold' 
              : 'text-[#a0a0b0] hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
