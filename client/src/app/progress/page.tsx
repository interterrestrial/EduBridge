'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';

export default function ProgressPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Progress Analytics</h1>
          <p className="text-[#a0a0b0]">Track your learning journey and mastery over time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Overall Mastery', value: '72%', icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
            { label: 'Learning Streak', value: '14 Days', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20' },
            { label: 'Study Hours', value: '42.5', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
            { label: 'Topics Completed', value: '18', icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/20' },
          ].map((stat, i) => (
            <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-[#a0a0b0] font-medium">{stat.label}</h3>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mock Chart Area 1 */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 h-96 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6">Learning Activity</h2>
            <div className="flex-1 flex items-end gap-2 justify-between pt-4">
              {/* Very basic mock bar chart */}
              {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
                <div key={i} className="w-full bg-white/5 rounded-t-md relative group">
                  <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-md transition-all group-hover:bg-indigo-400" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-[#a0a0b0]">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          {/* Topic Mastery */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-white mb-6">Topic Mastery</h2>
             <div className="space-y-6">
               {[
                 { topic: 'Database Normalization', score: '91%', color: 'bg-emerald-500' },
                 { topic: 'Operating Systems', score: '84%', color: 'bg-indigo-500' },
                 { topic: 'React Fundamentals', score: '72%', color: 'bg-indigo-500' },
                 { topic: 'Dynamic Programming', score: '48%', color: 'bg-amber-500' },
                 { topic: 'Advanced Networking', score: '20%', color: 'bg-red-500' },
               ].map((item, i) => (
                 <div key={i}>
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-white font-medium text-sm">{item.topic}</span>
                     <span className="text-[#a0a0b0] text-sm">{item.score}</span>
                   </div>
                   <div className="w-full bg-white/5 rounded-full h-2">
                     <div className={`${item.color} h-2 rounded-full`} style={{ width: item.score }}></div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
