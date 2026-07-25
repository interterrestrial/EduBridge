'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, 
  Bot, 
  Layers, 
  HelpCircle, 
  TrendingUp, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  Play,
  Copy,
  Check,
  Loader2,
  BookOpen,
  UserCheck,
  Users,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';
  const router = useRouter();
  const pathname = usePathname();

  const [agenda, setAgenda] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (user?.studentCode) {
      navigator.clipboard.writeText(user.studentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 10000);
      window.addEventListener('focus', fetchDashboardData);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', fetchDashboardData);
      };
    }
  }, [studentId, pathname]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [agendaRes, statsRes] = await Promise.all([
        api.get(`/schedule/today/${studentId}`),
        api.get(`/analytics/student/${studentId}`),
      ]);

      setAgenda(agendaRes.data.agenda || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-[#a0a0a0] max-w-xl">
              Your personalized AI study schedule has prepared your agenda for today. Stay consistent and boost your exam readiness!
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="/notes" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center gap-2">
                Upload New Notes <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/ai-chat" className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-medium transition-colors border border-border inline-flex items-center gap-2">
                Ask AI Tutor <Bot className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Enrollment & Teacher Mapping Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Code Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/10 p-2 rounded-xl text-primary"><GraduationCap className="w-5 h-5" /></div>
                <h2 className="text-lg font-bold text-white font-heading">My Enrollment Code</h2>
              </div>
              <p className="text-xs text-[#a0a0a0] mb-4">
                Share this unique code with your professor to get enrolled in their classroom. Once enrolled, your exams and teacher assignments will appear in your timetable!
              </p>
            </div>

            <div className="bg-input border border-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#a0a0a0] block uppercase font-mono tracking-wider">Your Unique Code</span>
                <span className="text-lg font-mono font-bold text-primary tracking-wider">{user?.studentCode || 'EB-100001'}</span>
              </div>
              <button
                onClick={copyCode}
                className="bg-primary/20 hover:bg-primary hover:text-white text-primary px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Enrolled Teachers Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400"><Users className="w-5 h-5" /></div>
                  <h2 className="text-lg font-bold text-white font-heading">My Professors & Subjects</h2>
                </div>
                <span className="text-xs text-[#a0a0a0] bg-white/5 px-2.5 py-1 rounded-full border border-border font-medium">
                  {user?.teachersMapped?.length || 0} Enrolled
                </span>
              </div>
              <p className="text-xs text-[#a0a0a0] mb-4">
                Professors you are connected to. They can view your exam readiness and push custom study assignments.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
              {!user?.teachersMapped || user.teachersMapped.length === 0 ? (
                <div className="bg-input/50 border border-dashed border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-[#a0a0a0]">You are not enrolled in any professor&apos;s roster yet.</p>
                  <p className="text-[11px] text-primary mt-0.5">Provide your code above to get linked!</p>
                </div>
              ) : (
                user.teachersMapped.map((mapping: any, idx: number) => {
                  const teacherName = mapping?.teacher?.name || 'Professor';
                  const subject = mapping?.subject || mapping?.teacher?.teacherProfile?.subject || mapping?.teacher?.teacherProfile?.department || 'General Curriculum';
                  return (
                    <div key={idx} className="bg-input border border-border rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {teacherName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{teacherName}</h4>
                          <span className="text-xs text-primary font-medium block mt-0.5">Subject: {subject}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                        Active
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Today's Agenda Widget (Personalized AI Study Tasks) */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-white">Today's Personalized Study Agenda</h2>
            </div>
            <Link href="/timetable" className="text-xs text-primary hover:text-primary/80 font-medium">
              View Full Timetable →
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading your AI agenda...
            </div>
          ) : agenda.length === 0 ? (
            <div className="py-6 text-center text-[#a0a0a0]">
              No pending teacher assignments for today. Check out your <Link href="/timetable" className="text-primary underline">AI Timetable</Link> or <Link href="/notes" className="text-primary underline">Notes</Link> to start studying!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agenda.map((item: any, idx: number) => (
                <div key={idx} className="bg-input border border-border rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {item.durationMinutes ? `${item.durationMinutes} Mins` : 'Action Item'}
                      </span>
                      {item.isTeacherPush && (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Teacher Assignment
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight mt-1">{item.title}</h3>
                    <p className="text-xs text-[#a0a0a0] mt-1">Focus Topic: {item.focusTopic}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (item.actionType === 'read_note') {
                        if (item.noteId) router.push(`/ai-chat?noteId=${item.noteId}`);
                        else router.push('/notes');
                      } else if (item.actionType === 'take_quiz') {
                        if (item.quizId) router.push(`/quizzes?quizId=${item.quizId}`);
                        else router.push('/quizzes');
                      } else router.push('/flashcards');
                    }}
                    className="w-full bg-primary/20 hover:bg-primary hover:text-white text-primary border border-primary/30 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Scheduled Task
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Gamified Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Award className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.readinessScore ?? 0}%</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Exam Readiness Score</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Layers className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.masteryScore ?? 0}%</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Blended Mastery Score</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><HelpCircle className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.quizAccuracy ?? 0}%</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Quiz Practice Accuracy</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400"><Award className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.examAverage ?? 0}%</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Graded Exam Average</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
