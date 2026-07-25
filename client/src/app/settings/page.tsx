'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { User, Mail, Bell, Lock, LogOut, CheckCircle2, Loader2, BookOpen, Building2, GraduationCap, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const [name, setName] = useState('');
  // Student fields
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [learningPreference, setLearningPreference] = useState('');
  // Teacher fields
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [specialization, setSpecialization] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.role === 'student') {
        setInstitution(user.studentProfile?.institution || '');
        setCourse(user.studentProfile?.course || '');
        setSemester(user.studentProfile?.semester || '');
        setLearningPreference(user.studentProfile?.learningPreference || 'Mixed');
      } else if (user.role === 'teacher') {
        setOrganization(user.teacherProfile?.organization || '');
        setDepartment(user.teacherProfile?.department || '');
        setSubject(user.teacherProfile?.subject || '');
        setSpecialization(user.teacherProfile?.specialization || '');
      }
    }
  }, [user]);

  const handleCopyCode = () => {
    if (user?.studentCode) {
      navigator.clipboard.writeText(user.studentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const payload: any = { name: name.trim() };
      if (user?.role === 'student') {
        payload.institution = institution;
        payload.course = course;
        payload.semester = semester;
        payload.learningPreference = learningPreference;
      } else if (user?.role === 'teacher') {
        payload.organization = organization;
        payload.department = department;
        payload.subject = subject;
        payload.specialization = specialization;
      }

      await api.put('/auth/profile', payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-[#a0a0a0]">Manage your profile details, academic preferences, and security settings.</p>
        </div>

        <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm space-y-0">
          
          {/* Profile Section */}
          <div className="p-8 border-b border-border">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Personal Information
            </h2>
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary/80 p-1 shrink-0 shadow-lg">
                <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden relative">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="w-5 h-5 text-[#a0a0a0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Full Name"
                        required
                        className="w-full bg-input border border-border rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-[#a0a0a0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        defaultValue={user?.email || ''}
                        className="w-full bg-input border border-border rounded-xl py-2.5 pl-11 pr-4 text-[#a0a0a0] opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {user?.role === 'student' && user.studentCode && (
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Unique Enrollment Code</label>
                    <div className="flex items-center gap-2 max-w-sm">
                      <div className="bg-input border border-border px-4 py-2 rounded-xl text-primary font-mono font-bold text-sm flex-1 tracking-wider">
                        {user.studentCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="bg-white/5 hover:bg-white/10 text-white border border-border px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiedCode ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#a0a0a0] mt-1">Share this code with your professors to get enrolled in their classrooms.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic / Teaching Profile Section */}
          <div className="p-8 border-b border-border">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {user?.role === 'teacher' ? <Building2 className="w-5 h-5 text-primary" /> : <GraduationCap className="w-5 h-5 text-primary" />}
              {user?.role === 'teacher' ? 'Teaching & Department Details' : 'Academic Profile'}
            </h2>

            {user?.role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">School / Institution</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Course / Degree Program</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.S. Computer Science"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Current Semester / Year</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. 5th Semester / Junior Year"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Preferred Learning Style</label>
                  <select
                    value={learningPreference}
                    onChange={(e) => setLearningPreference(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  >
                    <option value="Mixed" className="bg-card text-white">Mixed / Versatile</option>
                    <option value="Visual" className="bg-card text-white">Visual (Diagrams & Flashcards)</option>
                    <option value="Auditory" className="bg-card text-white">Auditory (Lectures & Discussion)</option>
                    <option value="Reading/Writing" className="bg-card text-white">Reading & Writing (Notes & Summaries)</option>
                    <option value="Kinesthetic" className="bg-card text-white">Kinesthetic (Active Recall Quizzes)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Organization / School</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. EduBridge University"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Department of Computer Science"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Primary Subject / Course Taught</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Design & Analysis of Algorithms"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                  <p className="text-[11px] text-[#a0a0a0] mt-1">This subject will be used as the default course when enrolling students.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Artificial Intelligence & Machine Learning"
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Save Button & Feedback */}
            <div className="mt-8 flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>

              {success && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                </div>
              )}
              {error && (
                <div className="text-red-400 text-sm font-medium animate-in fade-in">
                  {error}
                </div>
              )}
            </div>
          </div>

        </form>

        {/* Preferences Section */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-4 bg-input rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg"><Bell className="w-5 h-5 text-blue-400" /></div>
                <div>
                  <h4 className="text-white font-medium">Email Notifications</h4>
                  <p className="text-xs text-[#a0a0a0]">Receive study reminders and updates.</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-input rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg"><Lock className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                  <p className="text-xs text-[#a0a0a0]">Add an extra layer of security.</p>
                </div>
              </div>
              <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer">Enable</button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20 max-w-xl">
            <div>
              <h4 className="text-white font-medium">Sign Out</h4>
              <p className="text-xs text-[#a0a0a0]">Log out of this device.</p>
            </div>
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
