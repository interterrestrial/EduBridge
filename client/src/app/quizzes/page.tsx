'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { HelpCircle, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function QuizzesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Quizzes</h1>
            <p className="text-[#a0a0b0]">Test your knowledge and identify areas for improvement.</p>
          </div>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
            <Plus className="w-5 h-5" /> Generate Quiz
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
            <h3 className="text-[#a0a0b0] text-sm mb-2">Average Score</h3>
            <div className="text-3xl font-bold text-white">84%</div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
            <h3 className="text-[#a0a0b0] text-sm mb-2">Quizzes Taken</h3>
            <div className="text-3xl font-bold text-white">28</div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
            <h3 className="text-[#a0a0b0] text-sm mb-2">Needs Review</h3>
            <div className="text-3xl font-bold text-amber-400">3 Topics</div>
          </div>
        </div>

        {/* List */}
        <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-bold text-white">Recent Quizzes</h2>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { title: 'Operating Systems - Deadlocks', score: '92%', status: 'passed', date: 'Today, 2:15 PM', questions: 15 },
              { title: 'Advanced Data Structures', score: '68%', status: 'review', date: 'Yesterday', questions: 20 },
              { title: 'Database Normalization', score: '100%', status: 'passed', date: 'Oct 12, 2024', questions: 10 },
              { title: 'React Performance Optimization', score: '45%', status: 'failed', date: 'Oct 10, 2024', questions: 12 },
            ].map((quiz, i) => (
              <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    quiz.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                    quiz.status === 'review' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {quiz.status === 'passed' ? <CheckCircle2 className="w-6 h-6" /> :
                     quiz.status === 'review' ? <Clock className="w-6 h-6" /> :
                     <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{quiz.title}</h3>
                    <p className="text-sm text-[#a0a0b0]">{quiz.questions} Questions • {quiz.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="block text-sm text-[#a0a0b0] mb-1">Score</span>
                    <span className={`font-bold text-xl ${
                      quiz.status === 'passed' ? 'text-emerald-400' :
                      quiz.status === 'review' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>{quiz.score}</span>
                  </div>
                  <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium border border-white/10">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
