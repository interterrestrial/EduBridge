'use client';

import { useState, useEffect, Suspense } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  FileText,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Users,
  History,
  AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
  masteryScore: number;
  status: string;
  weakTopics: string[];
}

interface PushAssignment {
  id: string;
  title: string;
  materialType: 'note' | 'quiz';
  materialTitle: string;
  student: { id: string; name: string; email: string };
  status: string;
  dueDate: string | null;
  createdAt: string;
}

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function TeacherPushInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId') || '';
  const preselectedNoteId = searchParams.get('noteId') || '';
  const preselectedNoteTitle = searchParams.get('noteTitle') || '';
  const preselectedQuizId = searchParams.get('quizId') || '';
  const preselectedQuizTitle = searchParams.get('quizTitle') || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [history, setHistory] = useState<PushAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Push form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [pushType, setPushType] = useState<'note' | 'quiz'>('note');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [pushing, setPushing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [heatmapRes, notesRes, quizzesRes, historyRes] = await Promise.all([
        api.get('/teacher/heatmap'),
        api.get('/teacher/notes'),
        api.get('/teacher/quizzes'),
        api.get('/teacher/push-history'),
      ]);

      setStudents(heatmapRes.data?.studentRoster || []);
      setNotes(notesRes.data?.notes || []);
      setQuizzes(quizzesRes.data?.quizzes || []);
      setHistory(historyRes.data?.assignments || []);
    } catch (err) {
      console.error('Error fetching push data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Deep-link: preselect student/note/quiz from query param
  useEffect(() => {
    if (preselectedStudentId && students.length > 0) {
      setSelectedStudentId(preselectedStudentId);
      const student = students.find((s) => s.id === preselectedStudentId);
      if (student) {
        setAssignmentTitle(`Remedial Assignment: ${student.weakTopics[0] || 'Topic Revision'}`);
      }
    }
    if (preselectedNoteId && notes.length > 0) {
      setSelectedStudentId('ALL');
      setPushType('note');
      setSelectedNoteId(preselectedNoteId);
      if (preselectedNoteTitle) {
        setAssignmentTitle(`Study Material: ${preselectedNoteTitle}`);
      }
    }
    if (preselectedQuizId && quizzes.length > 0) {
      setSelectedStudentId('ALL');
      setPushType('quiz');
      setSelectedQuizId(preselectedQuizId);
      if (preselectedQuizTitle) {
        setAssignmentTitle(`Class Assessment: ${preselectedQuizTitle}`);
      }
    }
  }, [preselectedStudentId, preselectedNoteId, preselectedQuizId, students, notes, quizzes]);

  const handlePush = async () => {
    if (!selectedStudentId || !assignmentTitle) {
      alert('Please select a student and enter an assignment title.');
      return;
    }
    const noteId = pushType === 'note' ? selectedNoteId : undefined;
    const quizId = pushType === 'quiz' ? selectedQuizId : undefined;
    if (!noteId && !quizId) {
      alert('Please select a note or quiz to push.');
      return;
    }

    try {
      setPushing(true);
      await api.post('/teacher/push-assignment', {
        studentId: selectedStudentId,
        title: assignmentTitle,
        noteId: noteId || undefined,
        quizId: quizId || undefined,
      });

      const successMsg = selectedStudentId === 'ALL'
        ? 'Assignment successfully pushed to all classroom students!'
        : 'Remedial material successfully pushed to student agenda!';
      alert(successMsg);
      setAssignmentTitle('');
      setSelectedNoteId('');
      setSelectedQuizId('');
      await fetchData();
    } catch (err: any) {
      console.error('Push error:', err);
      alert(err?.response?.data?.error || 'Failed to push assignment.');
    } finally {
      setPushing(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Push Remediation</h1>
              <p className="text-[#a0a0a0] max-w-xl">
                Identify struggling students and push targeted notes or practice quizzes directly to their agenda.
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Push Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Push Assignment
              </h2>

              {/* Student Selector */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    if (e.target.value === 'ALL') {
                      if (!assignmentTitle || assignmentTitle.startsWith('Remedial Assignment:')) {
                        setAssignmentTitle('Classroom Assignment / Practice Material');
                      }
                      return;
                    }
                    const s = students.find((st) => st.id === e.target.value);
                    if (s) setAssignmentTitle(`Remedial Assignment: ${s.weakTopics[0] || 'Topic Revision'}`);
                  }}
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Select a student...</option>
                  <option value="ALL">✨ All Students (Entire Classroom) ✨</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.masteryScore}% mastery
                    </option>
                  ))}
                </select>
              </div>

              {/* All Students Quick Info */}
              {selectedStudentId === 'ALL' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-sm flex items-center gap-2">
                  <Users className="w-5 h-5 shrink-0" />
                  <span>This assignment will be pushed to all <strong>{students.length} students</strong> in your classroom.</span>
                </div>
              )}

              {/* Student Quick Info */}
              {selectedStudent && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a0a0a0]">Status</span>
                    <span className={`font-bold ${selectedStudent.masteryScore >= 80 ? 'text-emerald-400' : selectedStudent.masteryScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                  {selectedStudent.weakTopics.length > 0 && (
                    <div>
                      <span className="text-[#a0a0a0] text-sm">Weak Topics</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedStudent.weakTopics.slice(0, 4).map((t, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assignment Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g., Review B+ Tree Indexing"
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Material Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Material Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPushType('note')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${pushType === 'note' ? 'bg-primary text-primary-foreground border-primary' : 'bg-input text-[#a0a0a0] border-border hover:border-primary/50'}`}
                  >
                    <FileText className="w-4 h-4" /> Note
                  </button>
                  <button
                    onClick={() => setPushType('quiz')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${pushType === 'quiz' ? 'bg-primary text-primary-foreground border-primary' : 'bg-input text-[#a0a0a0] border-border hover:border-primary/50'}`}
                  >
                    <HelpCircle className="w-4 h-4" /> Quiz
                  </button>
                </div>
              </div>

              {/* Note / Quiz Selector */}
              {pushType === 'note' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Study Note</label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select a note...</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id}>
                        📄 {n.title} {n.student ? `— ${n.student.name}` : ''}
                      </option>
                    ))}
                  </select>
                  {notes.length === 0 && (
                    <p className="text-xs text-[#a0a0a0] mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> No notes available yet
                    </p>
                  )}
                </div>
              )}

              {pushType === 'quiz' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Practice Quiz</label>
                  <select
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select a quiz...</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        📝 {q.title} ({q.difficulty}) {q.student ? `— ${q.student.name}` : ''}
                      </option>
                    ))}
                  </select>
                  {quizzes.length === 0 && (
                    <p className="text-xs text-[#a0a0a0] mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> No quizzes available yet
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handlePush}
                disabled={pushing || !selectedStudentId || !assignmentTitle}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {pushing ? 'Pushing...' : 'Push to Student Agenda'}
              </button>
            </div>
          </div>

          {/* Push History */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Push History
              </h2>

              {loading ? (
                <div className="py-8 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading...
                </div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-[#a0a0a0]">
                  <Users className="w-10 h-10 text-[#a0a0a0]/30 mx-auto mb-3" />
                  No push assignments yet. Select a student and push their first remediation.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#e0e0e0]">
                    <thead className="bg-input text-xs uppercase text-[#a0a0a0] border-b border-border">
                      <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Assignment</th>
                        <th className="p-4">Material</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Pushed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-white">{h.student.name}</div>
                            <div className="text-xs text-[#a0a0a0]">{h.student.email}</div>
                          </td>
                          <td className="p-4 font-medium text-white">{h.title}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {h.materialType === 'note' ? (
                                <FileText className="w-4 h-4 text-primary" />
                              ) : (
                                <HelpCircle className="w-4 h-4 text-amber-400" />
                              )}
                              <span className="text-[#a0a0a0] text-sm">{h.materialTitle}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${h.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="p-4 text-[#a0a0b0] text-sm">
                            {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function TeacherPush() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Push Remediation</h1>
                <p className="text-[#a0a0a0] max-w-xl">
                  Identify struggling students and push targeted notes or practice quizzes directly to their agenda.
                </p>
              </div>
            </div>
          </div>
          <div className="py-16 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading...
          </div>
        </div>
      </DashboardLayout>
    }>
      <TeacherPushInner />
    </Suspense>
  );
}
