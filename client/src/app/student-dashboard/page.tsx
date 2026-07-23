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
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-[#a0a0b0] max-w-xl">
              Your personalized AI study schedule has prepared your agenda for today. Stay consistent and boost your exam readiness!
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="/notes" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center gap-2">
                Upload New Notes <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/ai-chat" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-medium transition-colors border border-white/10 inline-flex items-center gap-2">
                Ask AI Tutor <Bot className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Agenda Widget (Personalized AI Study Tasks) */}
        <div className="bg-black/30 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Today's Personalized Study Agenda</h2>
            </div>
            <Link href="/timetable" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View Full Timetable →
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading your AI agenda...
            </div>
          ) : agenda.length === 0 ? (
            <div className="py-6 text-center text-[#a0a0b0]">
              No study tasks scheduled for today. Create your <Link href="/timetable" className="text-indigo-400 underline">AI Timetable</Link> to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agenda.map((item: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {item.durationMinutes ? `${item.durationMinutes} Mins` : 'Action Item'}
                      </span>
                      {item.isTeacherPush && (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Teacher Assignment
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight mt-1">{item.title}</h3>
                    <p className="text-xs text-[#a0a0b0] mt-1">Focus Topic: {item.focusTopic}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (item.actionType === 'read_note') router.push('/notes');
                      else if (item.actionType === 'take_quiz') router.push('/quizzes');
                      else router.push('/flashcards');
                    }}
                    className="w-full bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 border border-indigo-500/30 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
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
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Award className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.readinessScore || 78}%</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Exam Readiness Score</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><Bot className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.aiChatSessions || 0}</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">AI Conversations</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400"><Layers className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.flashcardsGenerated || 0}</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Flashcards Generated</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><HelpCircle className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{stats?.masteryScore || 80}%</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Quiz Mastery Accuracy</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
