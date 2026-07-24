'use client';

import { useState, useEffect } from 'react';
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
  Play,
  Loader2,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';
  const router = useRouter();

  const [agenda, setAgenda] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchDashboardData();
    }
  }, [studentId]);

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
              No study tasks scheduled for today. Create your <Link href="/timetable" className="text-primary underline">AI Timetable</Link> to get started!
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
                      if (item.actionType === 'read_note') router.push('/notes');
                      else if (item.actionType === 'take_quiz') router.push('/quizzes');
                      else router.push('/flashcards');
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
              <span className="text-2xl font-bold text-white">{stats?.readinessScore || 78}%</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Exam Readiness Score</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><Bot className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.aiChatSessions || 0}</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">AI Conversations</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400"><Layers className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.flashcardsGenerated || 0}</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Flashcards Generated</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><HelpCircle className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.masteryScore || 80}%</span>
            </div>
            <p className="text-[#a0a0a0] text-sm">Quiz Mastery Accuracy</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
