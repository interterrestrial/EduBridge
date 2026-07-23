'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  BrainCircuit,
  UserCheck,
  Target,
  Loader2,
  CheckCircle2,
  Send,
  FileText,
  X
} from 'lucide-react';
import api from '../../lib/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Push Assignment Modal State
  const [showPushModal, setShowPushModal] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [pushing, setPushing] = useState(false);

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      const [heatmapRes, notesRes] = await Promise.all([
        api.get('/teacher/heatmap'),
        api.get('/notes/student/student_1'), // Fetch available notes for push
      ]);

      setHeatmapData(heatmapRes.data);
      setNotes(notesRes.data.notes || []);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomData();
  }, []);

  const handlePushAssignment = async () => {
    if (!targetStudentId || !assignmentTitle) return;

    try {
      setPushing(true);
      await api.post('/teacher/push-assignment', {
        teacherId: user?.id || 'teacher_1',
        studentId: targetStudentId,
        title: assignmentTitle,
        noteId: selectedNoteId || undefined,
      });

      alert('Remedial material successfully pushed directly to student agenda!');
      setShowPushModal(false);
      setAssignmentTitle('');
    } catch (err: any) {
      console.error('Push assignment error:', err);
      alert('Failed to push assignment.');
    } finally {
      setPushing(false);
    }
  };

  const summary = heatmapData?.summary || { totalStudents: 1, averageClassMastery: 80, averageAttendance: 90 };
  const heatmap = heatmapData?.heatmap || [];
  const roster = heatmapData?.studentRoster || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Teacher Command Center 👋</h1>
              <p className="text-[#a0a0b0] max-w-xl">
                Monitor class weak topic heatmaps, track student attendance, and push targeted remedial study materials directly to struggling students' agendas.
              </p>
            </div>
            <button
              onClick={fetchClassroomData}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
              Refresh Heatmap
            </button>
          </div>
        </div>

        {/* Classroom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#a0a0b0] text-sm">Enrolled Students</p>
              <span className="text-3xl font-bold text-white">{summary.totalStudents}</span>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#a0a0b0] text-sm">Class Avg. Mastery</p>
              <span className="text-3xl font-bold text-emerald-400">{summary.averageClassMastery}%</span>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Target className="w-6 h-6" /></div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#a0a0b0] text-sm">Class Avg. Attendance</p>
              <span className="text-3xl font-bold text-white">{summary.averageAttendance}%</span>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><UserCheck className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Real-Time Weak Topic Heatmap */}
        <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Classroom Weak Topic Heatmap</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Aggregating student topic quiz scores...
            </div>
          ) : heatmap.length === 0 ? (
            <div className="py-6 text-center text-[#a0a0b0]">
              No class weak topics detected yet. Once students attempt quizzes, heatmaps will generate automatically!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heatmap.map((item: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold text-base">{item.topic}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${item.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {item.severity} Risk
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#a0a0b0]">
                    <span>Class Accuracy</span>
                    <span className="text-white font-semibold">{item.averageAccuracy}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${item.averageAccuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Roster Table & Remediation Push */}
        <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden space-y-4">
          <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Student Roster & Remediation Push</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#e0e0e0]">
              <thead className="bg-white/5 text-xs uppercase text-[#a0a0b0] border-b border-white/10">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Mastery Accuracy</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roster.map((st: any) => (
                  <tr key={st.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {st.name}
                      <div className="text-xs font-normal text-[#a0a0b0]">{st.email}</div>
                    </td>
                    <td className="p-4 font-bold">{st.masteryScore}%</td>
                    <td className="p-4">{st.attendancePct}%</td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${st.status === 'Excelling' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setTargetStudentId(st.id);
                          setAssignmentTitle(`Remedial Assignment: ${st.weakTopics[0] || 'Topic Revision'}`);
                          setShowPushModal(true);
                        }}
                        className="bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Push Remediation Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Push Assignment Modal */}
        {showPushModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-400" /> Push Remedial Assignment
                </h2>
                <button onClick={() => setShowPushModal(false)} className="text-[#a0a0b0] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Assignment Title</label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Attach Study Note Document</label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No File attached</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id}>
                        📄 {n.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setShowPushModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#a0a0b0] hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={handlePushAssignment}
                  disabled={pushing}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {pushing ? 'Pushing Assignment...' : 'Push to Student Agenda'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
