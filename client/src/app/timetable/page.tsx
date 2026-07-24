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
            <h1 className="font-heading text-3xl font-bold text-white">AI Study Timetable</h1>
            <p className="text-[#a0a0a0]">Personalized daily study schedules computed by Gemini for your upcoming exams.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Generate AI Timetable
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Timetable Setup
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Upcoming Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Target Subject / Course</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Computer Science, Physics"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Daily Available Study Hours</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => setDailyHours(hrs)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          dailyHours === hrs
                            ? 'bg-primary/30 border-primary text-white'
                            : 'bg-input border-border text-[#a0a0a0] hover:bg-white/10'
                        }`}
                      >
                        {hrs} Hours / Day
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-[#a0a0a0] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
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
          <div className="p-12 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading study timetable...
          </div>
        ) : !activeSchedule ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/50 shadow-sm">
            <Calendar className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">No AI Timetable Found</h3>
            <p className="text-sm text-[#a0a0a0] mb-4">Input your upcoming exam date to generate a dynamic study timetable.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Generate First Timetable
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-primary/10 border border-primary/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Active Plan: {activeSchedule.subject}</h2>
                <p className="text-sm text-[#a0a0a0]">
                  Target Exam Date: <strong>{activeSchedule.examDate}</strong> • Allocated Daily Study: <strong>{activeSchedule.dailyHours} Hours/Day</strong>
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-input hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-medium border border-border transition-colors cursor-pointer"
              >
                Re-Generate Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSchedule.blocks.map((block: any, idx: number) => (
                <div key={idx} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors shadow-sm">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                        {block.day || `Day ${idx + 1}`}
                      </span>
                      <span className="text-xs text-[#a0a0a0] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {block.durationMinutes || 45} mins
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-1 leading-tight">{block.title}</h3>
                    <p className="text-xs text-[#a0a0a0] mb-4">Focus: {block.focusTopic}</p>

                    {block.linkedNoteTitle && (
                      <div className="bg-input/50 border border-border p-2.5 rounded-xl text-xs text-primary/80 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Note: {block.linkedNoteTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
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
