'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, Award, Target, Zap, Loader2, AlertTriangle, CheckCircle2, UserCheck, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function ProgressPage() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchAnalytics();
    } else {
      setLoading(false);
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

  const badges = analytics?.badges || [];
  const topicMastery = analytics?.topicMastery || [];
  const weakTopics = analytics?.weakTopics || [];
  const examScores = analytics?.examScores || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Gamified Progress & Analytics</h1>
          <p className="text-[#a0a0a0]">Track your blended mastery, exam readiness, attendance, and graded exam results.</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Computing your gamified performance...
          </div>
        ) : (
          <>
            {/* Gamified Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/20 text-primary p-3 rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0a0] font-medium text-sm">Exam Readiness</h3>
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.readinessScore ?? 0}%</div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0a0] font-medium text-sm">Blended Mastery Score</h3>
                </div>
                <div className="text-3xl font-bold text-purple-400">{analytics?.masteryScore ?? 0}%</div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0a0] font-medium text-sm">Subject Attendance</h3>
                </div>
                <div className="text-3xl font-bold text-emerald-400">{analytics?.attendancePct ?? 100}%</div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-orange-500/20 text-orange-400 p-3 rounded-xl">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-[#a0a0a0] font-medium text-sm">Total Study Hours</h3>
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.studyHours ?? 0} Hours</div>
              </div>
            </div>

            {/* Graded Exam Performance & Scores */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">Graded Exam Performance & Scores</h2>
                </div>
                <span className="text-xs text-[#a0a0a0] bg-white/5 px-2.5 py-1 rounded-full border border-border font-medium">
                  {examScores.length} Graded Exams
                </span>
              </div>

              {examScores.length === 0 ? (
                <div className="bg-input/50 border border-dashed border-border rounded-xl p-8 text-center space-y-2">
                  <GraduationCap className="w-8 h-8 text-[#a0a0a0] mx-auto opacity-50" />
                  <p className="text-sm font-medium text-white">No graded exam scores recorded yet.</p>
                  <p className="text-xs text-[#a0a0a0] max-w-md mx-auto">When your professor records and grades an exam for your classroom, your score and percentage will appear right here!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[#a0a0a0] text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Exam Title</th>
                        <th className="p-4 font-semibold">Subject / Course</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold text-right">Marks Scored</th>
                        <th className="p-4 font-semibold text-right">Percentage Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {examScores.map((score: any) => {
                        const pct = score.percentage ?? 0;
                        const badgeColor = pct >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : pct >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
                        return (
                          <tr key={score.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-bold text-white">{score.title || 'Class Exam'}</td>
                            <td className="p-4 text-[#a0a0a0]">{score.subject || 'General Curriculum'}</td>
                            <td className="p-4 text-[#a0a0a0] text-xs">
                              {score.examDate ? new Date(score.examDate).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-white">
                              {score.marks} / {score.maxMarks}
                            </td>
                            <td className="p-4 text-right">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border inline-block ${badgeColor}`}>
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Gamified Badges Showcase */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Award className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Unlocked Achievement Badges</h2>
              </div>

              {badges.length === 0 ? (
                <div className="py-6 text-center text-[#a0a0a0] text-sm">
                  Complete quizzes and log study hours to unlock your first achievement badge!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {badges.map((badge: any, i: number) => (
                    <div
                      key={badge.id || i}
                      className={`border p-4 rounded-xl space-y-2 transition-all ${badge.earned ? 'bg-input border-amber-500/30 hover:border-amber-500/50 shadow-md' : 'bg-input/30 border-border/40 opacity-40 grayscale'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-3xl">{badge.icon}</div>
                        {badge.earned && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <h3 className="text-white font-bold text-base">{badge.name || badge.title}</h3>
                      <p className="text-xs text-[#a0a0a0]">{badge.desc || 'Study achievement'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Mastery & Weak Topic Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Topic Mastery Breakdown</h2>
                  {topicMastery.length === 0 ? (
                    <div className="bg-input/50 border border-dashed border-border rounded-xl p-6 text-center text-xs text-[#a0a0a0] space-y-1">
                      <p className="font-medium text-white">No topic mastery data recorded yet.</p>
                      <p>Complete quizzes or graded exams to generate topic mastery analytics!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topicMastery.map((item: any, i: number) => (
                        <div key={item.id || i}>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-white font-medium text-sm">{item.topic}</span>
                            <span className="text-[#a0a0a0] text-xs font-bold">{item.score}</span>
                          </div>
                          <div className="w-full bg-input rounded-full h-2 overflow-hidden">
                            <div className={`${item.color || 'bg-primary'} h-2 rounded-full transition-all duration-500`} style={{ width: item.score }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> Weak Topics Needing Review
                  </h2>
                  {weakTopics.length === 0 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl text-center text-emerald-300 text-sm font-medium">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                      Great job! No weak topics identified yet. Keep practicing!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {weakTopics.map((topic: string, i: number) => (
                        <div key={i} className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-amber-300">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" /> {topic}
                          </div>
                          <span className="text-xs bg-amber-500/20 px-2.5 py-1 rounded-full font-bold">Review Priority</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
