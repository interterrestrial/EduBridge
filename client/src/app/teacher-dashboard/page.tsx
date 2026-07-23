'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  BrainCircuit,
  UserCheck,
  FileBarChart,
  Target,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import api from '../../lib/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/teacher/insights');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching teacher insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const summary = data?.summary || { totalStudents: 30, activeStudents: 28, averageMastery: 76 };
  const insights = data?.insights || {};

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, {user?.name || 'Professor'} 👋</h1>
              <p className="text-[#a0a0b0] max-w-xl">
                Classroom analytics synthesize student performance across quiz attempts, flashcard study hours, and AI tutor interactions.
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <button
                onClick={fetchInsights}
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                Refresh AI Insights
              </button>
            </div>
          </div>
        </div>

        {/* Classroom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{summary.totalStudents}</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Total Registered Students</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Target className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{summary.averageMastery}%</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Class Avg. Mastery</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><UserCheck className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{summary.activeStudents}</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Active Students This Week</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400"><TrendingUp className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">{insights.atRiskStudents?.length || 0}</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Students Needing Support</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* AI Recommendations */}
            <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <BrainCircuit className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Gemini AI Teacher Recommendations</h2>
              </div>

              {loading ? (
                <div className="py-8 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Generating class-wide recommendations...
                </div>
              ) : (
                <div className="space-y-3">
                  {(insights.recommendations || [
                    'Conduct a revision lecture on weak classroom topics.',
                    'Assign practice quizzes to at-risk students.',
                  ]).map((rec: string, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-3 text-sm text-[#e0e0e0]">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Performance */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Topic Analytics & Mastery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { topic: 'Relational Database Basics', score: '90%', color: 'bg-emerald-500' },
                  { topic: 'Normalization', score: '78%', color: 'bg-emerald-500' },
                  { topic: 'ACID Properties', score: '45%', color: 'bg-red-500' },
                ].map((item, i) => (
                  <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-white font-medium">{item.topic}</h4>
                      <span className="text-white font-bold">{item.score}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full`} style={{ width: item.score }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">At-Risk Alerts</h2>
              </div>

              <div className="space-y-4">
                {(insights.atRiskStudents || [
                  { name: 'Student X', reason: 'Mastery score below 50% in ACID Properties.' }
                ]).map((st: any, idx: number) => (
                  <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {st.name}
                    </div>
                    <p className="text-xs text-[#a0a0b0] leading-relaxed">{st.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
