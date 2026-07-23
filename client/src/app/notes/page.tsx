'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { FileText, UploadCloud, Search, Filter, MoreVertical, BrainCircuit, Loader2 } from 'lucide-react';

export default function NotesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Notes</h1>
            <p className="text-[#a0a0b0]">Upload, organize, and chat with your study materials.</p>
          </div>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
            <UploadCloud className="w-5 h-5" /> Upload Document
          </button>
        </div>

        <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#a0a0b0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Operating Systems - Chapter 4', date: 'Today, 10:30 AM', size: '2.4 MB', status: 'ready' },
              { title: 'Introduction to Machine Learning', date: 'Yesterday', size: '5.1 MB', status: 'processing' },
              { title: 'Database Management Systems', date: 'Oct 12, 2024', size: '1.8 MB', status: 'ready' },
              { title: 'Advanced Data Structures', date: 'Oct 10, 2024', size: '4.2 MB', status: 'ready' },
            ].map((note, i) => (
              <div key={i} className="bg-black/40 border border-white/5 hover:border-white/20 rounded-xl p-5 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-500/20 p-3 rounded-lg text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <button className="text-[#a0a0b0] hover:text-white p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-white font-medium text-lg leading-tight mb-2 line-clamp-2">{note.title}</h3>
                <div className="flex items-center justify-between text-xs text-[#a0a0b0] mb-4">
                  <span>{note.date}</span>
                  <span>{note.size}</span>
                </div>
                
                {note.status === 'ready' ? (
                  <button className="w-full bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-white border border-white/5 rounded-lg py-2 flex items-center justify-center gap-2 transition-colors text-sm">
                    <BrainCircuit className="w-4 h-4" /> Chat with AI
                  </button>
                ) : (
                  <div className="w-full bg-white/5 text-[#a0a0b0] border border-white/5 rounded-lg py-2 flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
