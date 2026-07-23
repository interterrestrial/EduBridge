'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
  UserCheck,
  FileBarChart,
  Target
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, {user?.name || 'Professor'} 👋</h1>
              <p className="text-[#a0a0b0] max-w-xl">Your students have been highly active today. The class average has increased by 4% this week. Here is your classroom overview.</p>
            </div>
            <div className="flex gap-4 shrink-0">
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                Generate Class Report
              </button>
            </div>
          </div>
        </div>

        {/* Classroom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">62</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Total Students</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Target className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">81%</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Class Avg. Accuracy</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><FileBarChart className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">318</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Quizzes Completed</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400"><TrendingUp className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">76%</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Overall Mastery</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Student Performance List */}
            <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h2 className="text-xl font-bold text-white">Student Performance</h2>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-[#a0a0b0] bg-black/40">
                      <th className="p-4 font-medium">Student Name</th>
                      <th className="p-4 font-medium">Mastery</th>
                      <th className="p-4 font-medium">Quizzes</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { name: 'Sarah Jenkins', mastery: '94%', quizzes: 24, status: 'Excelling', color: 'text-emerald-400' },
                      { name: 'Marcus Chen', mastery: '82%', quizzes: 18, status: 'On Track', color: 'text-blue-400' },
                      { name: 'David Miller', mastery: '61%', quizzes: 12, status: 'Needs Help', color: 'text-amber-400' },
                      { name: 'Elena Rodriguez', mastery: '88%', quizzes: 21, status: 'On Track', color: 'text-blue-400' },
                      { name: 'James Wilson', mastery: '42%', quizzes: 5, status: 'At Risk', color: 'text-red-400' },
                    ].map((student, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-white">{student.name}</span>
                        </td>
                        <td className="p-4 text-white font-semibold">{student.mastery}</td>
                        <td className="p-4 text-[#a0a0b0]">{student.quizzes}</td>
                        <td className={`p-4 font-medium ${student.color}`}>{student.status}</td>
                        <td className="p-4 text-right">
                          <button className="p-2 bg-white/5 rounded-lg text-[#a0a0b0] hover:text-white hover:bg-white/10 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Topic Performance */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Topic Analytics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { topic: 'Database Normalization', score: '91%', color: 'bg-emerald-500' },
                  { topic: 'REST API Design', score: '84%', color: 'bg-emerald-500' },
                  { topic: 'React Context API', score: '62%', color: 'bg-amber-500' },
                  { topic: 'Dynamic Programming', score: '48%', color: 'bg-red-500' },
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
                <h2 className="text-xl font-bold text-white">AI Insights</h2>
              </div>

              <div className="space-y-5">
                {/* Insight 1 */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Struggling Concept Detected</h4>
                      <p className="text-xs text-[#a0a0b0] mb-3 leading-relaxed">
                        42% of students failed the last quiz on <strong>Dynamic Programming</strong>.
                      </p>
                      <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md font-medium transition-colors border border-white/10 w-full">
                        Generate Practice Material
                      </button>
                    </div>
                  </div>
                </div>

                {/* Insight 2 */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Improvement Trend</h4>
                      <p className="text-xs text-[#a0a0b0] mb-3 leading-relaxed">
                        Database Normalization mastery increased by 14% after the last AI generated notes were shared.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Insight 3 */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><UserCheck className="w-5 h-5 text-indigo-400" /></div>
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Student Intervention</h4>
                      <p className="text-xs text-[#a0a0b0] leading-relaxed">
                        <strong>James Wilson</strong> has not logged in for 4 days and missed 2 assignments.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
