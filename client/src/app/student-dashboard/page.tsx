'use client';

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
  AlertCircle,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
            <p className="text-[#a0a0b0] max-w-xl">You've completed 3 quizzes this week. Your average accuracy is looking great! Keep up the excellent work.</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><FileText className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">18</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Notes Uploaded</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><Bot className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">54</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">AI Conversations</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400"><Layers className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">210</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Flashcards Studied</p>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><HelpCircle className="w-6 h-6" /></div>
              <span className="text-2xl font-bold text-white">84%</span>
            </div>
            <p className="text-[#a0a0b0] text-sm">Avg. Quiz Accuracy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - Notes & Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Notes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Recent Notes</h2>
                <Link href="/notes" className="text-sm text-indigo-400 hover:text-indigo-300">View All</Link>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Operating Systems - Chapter 4', date: 'Today, 10:30 AM', status: 'Ready for AI' },
                  { title: 'Introduction to Machine Learning', date: 'Yesterday', status: 'Processing...' },
                  { title: 'Database Management Systems', date: 'Oct 12, 2024', status: 'Ready for AI' },
                ].map((note, i) => (
                  <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/10 p-3 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{note.title}</h4>
                        <p className="text-xs text-[#a0a0b0] mt-1">{note.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${note.status.includes('Ready') ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}`}>
                        {note.status}
                      </span>
                      <button className="text-[#a0a0b0] hover:text-white">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
               <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
               <div className="bg-black/20 border border-white/10 rounded-2xl p-6 relative">
                 <div className="absolute left-[39px] top-8 bottom-8 w-px bg-white/10"></div>
                 
                 <div className="space-y-6">
                   <div className="flex gap-4 relative z-10">
                     <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                     </div>
                     <div>
                       <h4 className="text-white font-medium">Completed "Data Structures" Quiz</h4>
                       <p className="text-sm text-[#a0a0b0] mt-1">Scored 92% • Today, 2:15 PM</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-4 relative z-10">
                     <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                       <FileText className="w-5 h-5 text-indigo-400" />
                     </div>
                     <div>
                       <h4 className="text-white font-medium">Uploaded "React Hooks Guide"</h4>
                       <p className="text-sm text-[#a0a0b0] mt-1">Ready for AI processing • Today, 11:30 AM</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-4 relative z-10">
                     <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                       <Bot className="w-5 h-5 text-purple-400" />
                     </div>
                     <div>
                       <h4 className="text-white font-medium">Chatted with AI Tutor</h4>
                       <p className="text-sm text-[#a0a0b0] mt-1">Asked 5 questions about Binary Trees • Yesterday</p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Sidebar Area - Recommendations & Progress */}
          <div className="space-y-8">
            {/* AI Recommendations */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-400" /> Recommended
              </h2>
              <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                <p className="text-sm text-[#a0a0b0]">Based on your recent activity, AI suggests:</p>
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-1">Review Binary Trees</h4>
                  <p className="text-xs text-[#a0a0b0] mb-3">You missed 2 questions in the last quiz.</p>
                  <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium transition-colors flex justify-center items-center gap-2">
                    Start Flashcards <Play className="w-3 h-3 fill-white" />
                  </button>
                </div>
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-1">Take OS Practice Test</h4>
                  <p className="text-xs text-[#a0a0b0] mb-3">You finished reviewing the notes yesterday.</p>
                  <button className="w-full bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg font-medium transition-colors border border-white/10">
                    Generate Quiz
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Overall Mastery</h2>
              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-white">72%</span>
                  <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +4% this week
                  </span>
                </div>
                
                <div className="w-full bg-white/5 rounded-full h-3 mb-6 mt-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full" style={{ width: '72%' }}></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#a0a0b0] flex items-center gap-2"><Clock className="w-4 h-4" /> 42 hrs studied</span>
                  <Link href="/progress" className="text-indigo-400 hover:text-indigo-300">Full Report</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
