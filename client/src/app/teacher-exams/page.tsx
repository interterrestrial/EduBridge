'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Save,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  X,
  BarChart2,
} from 'lucide-react';
import api from '../../lib/api';

interface Exam {
  id: string;
  title: string;
  subject: string;
  maxMarks: number;
  examDate: string;
  scoreCount: number;
  classAveragePct: number;
}

interface StudentScore {
  id: string;
  name: string;
  email: string;
  marks: number | null;
  percentage: number | null;
}

function pctColor(pct: number | null) {
  if (pct === null) return 'text-[#a0a0b0]';
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function pctBgColor(pct: number | null) {
  if (pct === null) return 'bg-white/5';
  if (pct >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
  if (pct >= 50) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

export default function TeacherExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Score entry state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [saving, setSaving] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Create exam modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Mastery breakdown
  const [needsIntervention, setNeedsIntervention] = useState<{ name: string; email: string; avgPct: number }[]>([]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/exams');
      setExams(res.data.exams || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSelectExam = async (exam: Exam) => {
    try {
      setScoreLoading(true);
      const res = await api.get(`/teacher/exams/${exam.id}`);
      setSelectedExam(exam);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching exam scores:', err);
    } finally {
      setScoreLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const marks = value === '' ? null : Number(value);
        const percentage = marks !== null && selectedExam
          ? Math.round((marks / selectedExam.maxMarks) * 100)
          : null;
        return { ...s, marks, percentage };
      })
    );
  };

  const handleSaveScores = async () => {
    if (!selectedExam) return;
    const scores = students
      .filter((s) => s.marks !== null && s.marks !== undefined)
      .map((s) => ({ studentId: s.id, marks: s.marks }));

    if (scores.length === 0) {
      alert('Enter at least one score before saving.');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/teacher/exams/${selectedExam.id}/scores`, { scores });
      await fetchExams();
      await handleSelectExam(selectedExam);
    } catch (err: any) {
      console.error('Save scores error:', err);
      alert(err?.response?.data?.error || 'Failed to save scores.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newTitle || !newSubject || !newMaxMarks || !newExamDate) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      setCreating(true);
      await api.post('/teacher/exams', {
        title: newTitle,
        subject: newSubject,
        maxMarks: Number(newMaxMarks),
        examDate: newExamDate,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewSubject('');
      setNewMaxMarks('');
      setNewExamDate('');
      await fetchExams();
    } catch (err: any) {
      console.error('Create exam error:', err);
      alert(err?.response?.data?.error || 'Failed to create exam.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExam = async (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this exam? All scores will be permanently removed.')) return;

    try {
      await api.delete(`/teacher/exams/${examId}`);
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
        setStudents([]);
      }
      await fetchExams();
    } catch (err: any) {
      console.error('Delete exam error:', err);
      alert(err?.response?.data?.error || 'Failed to delete exam.');
    }
  };

  // Compute intervention list from current students data
  useEffect(() => {
    if (students.length === 0) {
      setNeedsIntervention([]);
      return;
    }
    const scored = students.filter((s) => s.percentage !== null);
    const below50 = scored
      .filter((s) => (s.percentage as number) < 50)
      .map((s) => ({ name: s.name, email: s.email, avgPct: s.percentage as number }))
      .sort((a, b) => a.avgPct - b.avgPct);
    setNeedsIntervention(below50);
  }, [students]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Exam Scores & Mastery</h1>
              <p className="text-[#a0a0b0] max-w-xl">
                Create exams, enter student scores, and identify the gap between quiz practice and real understanding.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchExams}
                disabled={loading}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            </div>
          </div>
        </div>

        {/* Score Entry View */}
        {selectedExam && (
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setSelectedExam(null); setStudents([]); }}
                className="text-[#a0a0b0] hover:text-white flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Back to Exams
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#a0a0b0]">
                  {selectedExam.title} — {selectedExam.subject}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-white/5 text-[#a0a0b0] border border-white/10">
                  Max: {selectedExam.maxMarks}
                </span>
              </div>
            </div>

            {scoreLoading ? (
              <div className="py-12 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading students...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#e0e0e0]">
                    <thead className="bg-white/5 text-xs uppercase text-[#a0a0b0] border-b border-white/10">
                      <tr>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4 w-32">Marks</th>
                        <th className="p-4 w-32">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-white">{s.name}</td>
                          <td className="p-4 text-[#a0a0b0] text-sm">{s.email}</td>
                          <td className="p-4">
                            <input
                              type="number"
                              min={0}
                              max={selectedExam.maxMarks}
                              value={s.marks ?? ''}
                              onChange={(e) => handleMarksChange(s.id, e.target.value)}
                              placeholder="—"
                              className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                            />
                          </td>
                          <td className="p-4">
                            <span className={`font-bold ${pctColor(s.percentage)}`}>
                              {s.percentage !== null ? `${s.percentage}%` : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <span className="text-xs text-[#a0a0b0]">
                    {students.filter((s) => s.marks !== null).length} of {students.length} students scored
                  </span>
                  <button
                    onClick={handleSaveScores}
                    disabled={saving}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save All Scores'}
                  </button>
                </div>

                {/* Needs Intervention */}
                {needsIntervention.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-400 mb-1">
                        Needs Intervention — {needsIntervention.length} student{needsIntervention.length > 1 ? 's' : ''} below 50%
                      </h3>
                      <ul className="text-xs text-red-300/80 space-y-0.5">
                        {needsIntervention.map((s) => (
                          <li key={s.email}>{s.name} — {s.avgPct}%</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Exam Cards Grid */}
        {!selectedExam && (
          <>
            {loading ? (
              <div className="py-16 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="bg-black/20 border border-white/10 rounded-2xl p-12 text-center">
                <BarChart2 className="w-12 h-12 text-[#a0a0b0]/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Exams Yet</h3>
                <p className="text-[#a0a0b0] max-w-md mx-auto">
                  Create your first exam to start tracking real student performance and identifying the practice-understanding gap.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => handleSelectExam(exam)}
                    className="bg-black/20 border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/5 hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                          {exam.title}
                        </h3>
                        <p className="text-sm text-[#a0a0b0] mt-1">{exam.subject}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteExam(e, exam.id)}
                        className="text-[#a0a0b0] hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex-1">
                        <span className="text-[#a0a0b0] text-xs">Class Avg</span>
                        <div className={`text-lg font-bold ${pctColor(exam.classAveragePct)}`}>
                          {exam.scoreCount > 0 ? `${exam.classAveragePct}%` : '—'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#a0a0b0] text-xs">Scored</span>
                        <div className="text-lg font-bold text-white">{exam.scoreCount}</div>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#a0a0b0] text-xs">Max Marks</span>
                        <div className="text-lg font-bold text-white">{exam.maxMarks}</div>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#a0a0b0] text-xs">Date</span>
                        <div className="text-sm font-medium text-white">{exam.examDate}</div>
                      </div>
                    </div>

                    {exam.scoreCount === 0 && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5" /> No scores entered yet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Exam Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" /> Create Exam
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-[#a0a0b0] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Midterm Exam 1"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a subject...</option>
                    <option value="Data Preprocessing & Analytics">Data Preprocessing & Analytics</option>
                    <option value="Design & Analysis of Algorithms">Design & Analysis of Algorithms</option>
                    <option value="Database Systems & Indexing">Database Systems & Indexing</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Max Marks</label>
                    <input
                      type="number"
                      value={newMaxMarks}
                      onChange={(e) => setNewMaxMarks(e.target.value)}
                      placeholder="100"
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Exam Date</label>
                    <input
                      type="date"
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#a0a0b0] hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={handleCreateExam}
                  disabled={creating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {creating ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
