'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, Plus, Loader2, Play, CheckCircle2, Clock, BookOpen, Target } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function TimetablePage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [examDate, setExamDate] = useState('2026-08-15');
  const [subject, setSubject] = useState('Computer Science');
  const [dailyHours, setDailyHours] = useState(2);
  const [showModal, setShowModal] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/schedule/student/${studentId}`);
      setSchedules(res.data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchSchedules();
    }
  }, [studentId]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.post('/schedule/generate', {
        studentId,
        examDate,
        subjects: [subject],
        dailyHours: Number(dailyHours),
      });

      setShowModal(false);
      fetchSchedules();
    } catch (err: any) {
      console.error('Schedule generation error:', err);
      alert(err.response?.data?.error || 'Failed to generate study timetable');
    } finally {
      setGenerating(false);
    }
  };

  const activeSchedule = schedules.length > 0 ? schedules[0] : null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Study Timetable</h1>
            <p className="text-[#a0a0b0]">Personalized daily study schedules computed by Gemini for your upcoming exams.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" /> Generate AI Timetable
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" /> Timetable Setup
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Upcoming Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Target Subject / Course</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Computer Science, Physics"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Daily Available Study Hours</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => setDailyHours(hrs)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          dailyHours === hrs
                            ? 'bg-indigo-500/30 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/5 text-[#a0a0b0] hover:bg-white/10'
                        }`}
                      >
                        {hrs} Hours / Day
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-[#a0a0b0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {generating ? 'Computing Timetable...' : 'Generate Timetable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timetable Blocks Display */}
        {loading ? (
          <div className="p-12 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading study timetable...
          </div>
        ) : !activeSchedule ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-black/20">
            <Calendar className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">No AI Timetable Found</h3>
            <p className="text-sm text-[#a0a0b0] mb-4">Input your upcoming exam date to generate a dynamic study timetable.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Generate First Timetable
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Active Plan: {activeSchedule.subject}</h2>
                <p className="text-sm text-[#a0a0b0]">
                  Target Exam Date: <strong>{activeSchedule.examDate}</strong> • Allocated Daily Study: <strong>{activeSchedule.dailyHours} Hours/Day</strong>
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-medium border border-white/10"
              >
                Re-Generate Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSchedule.blocks.map((block: any, idx: number) => (
                <div key={idx} className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        {block.day || `Day ${idx + 1}`}
                      </span>
                      <span className="text-xs text-[#a0a0b0] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {block.durationMinutes || 45} mins
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-1 leading-tight">{block.title}</h3>
                    <p className="text-xs text-[#a0a0b0] mb-4">Focus: {block.focusTopic}</p>

                    {block.linkedNoteTitle && (
                      <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate">Note: {block.linkedNoteTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Ready in Today Agenda
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
