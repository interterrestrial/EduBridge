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
  Send,
  UserPlus,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Classroom Enrollment state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const handleOpenEnrollModal = () => {
    setShowEnrollModal(true);
  };

  const handleEnrollStudent = async (studentId?: string, inputVal?: string) => {
    try {
      if (studentId) setEnrollingId(studentId);
      else setEnrolling(true);

      const payload: any = {};
      if (studentId) {
        payload.studentId = studentId;
      } else if (inputVal) {
        if (inputVal.includes('@')) {
          payload.email = inputVal;
        } else {
          payload.studentCode = inputVal;
        }
      }

      await api.post('/teacher/students', payload);
      if (inputVal) setEnrollEmail('');
      await fetchClassroomData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your classroom?`)) return;
    try {
      await api.delete(`/teacher/students/${studentId}`);
      await fetchClassroomData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove student');
    }
  };

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      const heatmapRes = await api.get('/teacher/heatmap');
      setHeatmapData(heatmapRes.data);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomData();
  }, []);

  const summary = heatmapData?.summary || { totalStudents: 1, averageClassMastery: 80, averageAttendance: 90 };
  const heatmap = heatmapData?.heatmap || [];
  const roster = heatmapData?.studentRoster || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading text-3xl font-bold text-white mb-2">
                {user?.name || 'Teacher'} • <span className="text-primary font-normal">{user?.teacherProfile?.subject || user?.teacherProfile?.department || 'Design & Analysis of Algorithms'}</span> 👋
              </h1>
              <p className="text-[#a0a0a0] max-w-xl">
                Monitor class weak topic heatmaps, track student attendance, and push targeted remedial study materials directly to struggling students' agendas.
              </p>
            </div>
            <button
              onClick={fetchClassroomData}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
              Refresh Heatmap
            </button>
          </div>
        </div>

        {/* Classroom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#a0a0a0] text-sm">Enrolled Students</p>
              <span className="text-3xl font-bold text-white">{summary.totalStudents}</span>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div>
          </div>
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#a0a0a0] text-sm">Class Avg. Mastery</p>
              <span className="text-3xl font-bold text-emerald-400">{summary.averageClassMastery}%</span>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Target className="w-6 h-6" /></div>
          </div>
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#a0a0a0] text-sm">Class Avg. Attendance</p>
              <span className="text-3xl font-bold text-white">{summary.averageAttendance}%</span>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><UserCheck className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Real-Time Weak Topic Heatmap */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Classroom Weak Topic Heatmap</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Aggregating student topic quiz scores...
            </div>
          ) : heatmap.length === 0 ? (
            <div className="py-6 text-center text-[#a0a0a0]">
              No class weak topics detected yet. Once students attempt quizzes, heatmaps will generate automatically!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heatmap.map((item: any, idx: number) => (
                <div key={idx} className="bg-input border border-border p-4 rounded-xl space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold text-base">{item.topic}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${item.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {item.severity} Risk
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#a0a0a0]">
                    <span>Class Accuracy</span>
                    <span className="text-white font-semibold">{item.averageAccuracy}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
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

        {/* Student Roster Table (Exam-Aware) */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden space-y-4 shadow-sm">
          <div className="p-6 border-b border-border bg-input/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Student Roster</h2>
              <p className="text-xs text-[#a0a0a0]">Only students mapped to your classroom appear below.</p>
            </div>
            <button
              onClick={handleOpenEnrollModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Enroll Student
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-input/50 text-xs uppercase text-[#a0a0a0] border-b border-border">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4 text-right">Quiz Accuracy</th>
                  <th className="p-4 text-right">Exam Avg</th>
                  <th className="p-4 text-right">Mastery</th>
                  <th className="p-4 text-center">Gap</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#a0a0a0]">
                      <div className="max-w-md mx-auto space-y-3">
                        <p className="text-base font-semibold text-white">No students enrolled yet</p>
                        <p className="text-xs">You haven't added any students to your classroom. Click "+ Enroll Student" above to start mapping students and viewing their mastery analytics!</p>
                        <button
                          onClick={handleOpenEnrollModal}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" /> Enroll Student
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  roster.map((st: any) => {
                  const gapColor = st.gapStatus === 'Surface Practice'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : st.gapStatus === 'Exam Strong'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : st.gapStatus === 'No Exam Data'
                    ? 'bg-white/5 text-[#a0a0b0] border-white/10'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                  return (
                    <tr key={st.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{st.name}</span>
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono font-bold">{st.studentCode || '—'}</span>
                        </div>
                        <div className="text-xs font-normal text-[#a0a0a0]">{st.email}</div>
                      </td>
                      <td className="p-4 text-right font-bold text-white">{st.quizAccuracy ?? '—'}%</td>
                      <td className="p-4 text-right font-bold text-white">{st.examAverage ?? '—'}%</td>
                      <td className="p-4 text-right font-bold text-indigo-400">{st.masteryScore}%</td>
                      <td className="p-4 text-center">
                        {st.gapStatus === 'No Exam Data' ? (
                          <span className="text-xs text-[#a0a0a0]">—</span>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded font-bold border ${gapColor}`}>
                            {st.gap > 0 ? `+${st.gap}` : st.gap}%
                          </span>
                        )}
                        {st.hasGapFlag && (
                          <div className="text-[10px] text-red-400 mt-0.5">⚠ Surface</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${st.status === 'Excelling' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : st.status === 'On Track' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {st.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/teacher-push?studentId=${st.id}`)}
                            className="bg-primary/20 hover:bg-primary hover:text-white text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Push
                          </button>
                          <button
                            onClick={() => handleUnenroll(st.id, st.name)}
                            title="Remove student from classroom"
                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enroll Student Modal */}
        {showEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-xl text-primary"><UserPlus className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Enroll Student</h3>
                    <p className="text-xs text-[#a0a0a0]">Add students to your classroom to monitor their mastery & push notes.</p>
                  </div>
                </div>
                <button onClick={() => setShowEnrollModal(false)} className="text-[#a0a0a0] hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Enroll by code or email */}
              <div className="space-y-3 bg-input/50 p-4 rounded-xl border border-border">
                <label className="text-xs font-bold uppercase text-[#a0a0a0] block">Enroll by Student Code or Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="EB-100001 or student@edubridge.edu"
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleEnrollStudent(undefined, enrollEmail)}
                    disabled={!enrollEmail.trim() || enrolling}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Enroll
                  </button>
                </div>
                <p className="text-[11px] text-[#a0a0a0]">Ask your students for their unique Enrollment Code (found on their dashboard) or enter their registered email address.</p>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}