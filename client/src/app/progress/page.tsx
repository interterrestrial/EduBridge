'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, Award, Target, Zap, Loader2, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function ProgressPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchAnalytics();
    }
  }, [studentId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/student/${studentId}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gamified Progress & Analytics</h1>
          <p className="text-[#a0a0b0]">Track your exam readiness, subject attendance, and unlock study badges.</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Computing your gamified performance...
          </div>
        ) : (
          <>
            {/* Gamified Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-indigo-500/20 text-indigo-400 p-3 rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0b0] font-medium">Exam Readiness</h3>
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.readinessScore || 78}%</div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0b0] font-medium">Subject Attendance</h3>
                </div>
                <div className="text-3xl font-bold text-emerald-400">{analytics?.attendancePct || 90}%</div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-orange-500/20 text-orange-400 p-3 rounded-xl">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0b0] font-medium">Total Study Hours</h3>
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.studyHours || 24} Hours</div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0b0] font-medium">Quiz Accuracy</h3>
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.masteryScore || 80}%</div>
              </div>
            </div>

            {/* Gamified Badges Showcase */}
            <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <Award className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Unlocked Achievement Badges</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(analytics?.badges || [
                  { id: 'b1', title: 'Quiz Novice', icon: '🎯', desc: 'Completed first quiz' },
                  { id: 'b2', title: 'Algorithm Master', icon: '⚡', desc: 'Maintained 80%+ quiz accuracy' },
                  { id: 'b3', title: 'Recall Scholar', icon: '🧠', desc: 'Generated 5+ active recall cards' },
                  { id: 'b4', title: 'Punctual Scholar', icon: '⭐', desc: 'Maintained 85%+ attendance' },
                ]).map((badge: any) => (
                  <div key={badge.id} className="bg-white/5 border border-amber-500/20 p-4 rounded-xl space-y-2 hover:border-amber-500/40 transition-colors">
                    <div className="text-3xl">{badge.icon}</div>
                    <h3 className="text-white font-bold text-base">{badge.title}</h3>
                    <p className="text-xs text-[#a0a0b0]">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Mastery & Weak Topic Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Topic Mastery Breakdown</h2>
                <div className="space-y-4">
                  {[
                    { topic: 'Relational Database Basics', score: '90%', color: 'bg-emerald-500' },
                    { topic: 'Normalization', score: '78%', color: 'bg-emerald-500' },
                    { topic: 'ACID Isolation Levels', score: '45%', color: 'bg-red-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-white font-medium text-sm">{item.topic}</span>
                        <span className="text-[#a0a0b0] text-xs font-bold">{item.score}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: item.score }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" /> Weak Topics Needing Review
                </h2>
                <div className="space-y-3">
                  {(analytics?.weakTopics || ['Graph Traversal', 'ACID Isolation']).map((topic: string, i: number) => (
                    <div key={i} className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-amber-300">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> {topic}
                      </div>
                      <span className="text-xs bg-amber-500/20 px-2.5 py-1 rounded-full font-bold">Review Priority</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
