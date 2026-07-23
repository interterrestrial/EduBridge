'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { GraduationCap, BookOpen, Users } from 'lucide-react';
import { AxiosError } from 'axios';

export default function ChooseRolePage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  const handleSelectRole = async (selectedRole: 'student' | 'teacher') => {
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/update-role', { role: selectedRole });
      login(res.data.token, res.data.user);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Failed to update role');
      } else {
        setError('Failed to update role');
      }
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'unassigned') {
    return (
      <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white font-sans bg-gradient-to-br from-[#1e1e2f] to-[#2a2a40]">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-3xl shadow-2xl flex flex-col items-center">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-500 p-3 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">EduBridge</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">Choose Your Path</h1>
        <p className="text-[#a0a0b0] text-center max-w-md mb-10">
          Welcome to EduBridge! Please tell us how you'll be using the platform so we can personalize your experience.
        </p>

        {error && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mb-8">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Student Card */}
          <button 
            onClick={() => handleSelectRole('student')}
            disabled={isLoading}
            className="flex flex-col items-center p-8 bg-black/20 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-indigo-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="bg-white/10 p-5 rounded-full mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <BookOpen className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold mb-2">I am a Student</h3>
            <p className="text-[#a0a0b0] text-sm text-center">Join classes, access study materials, and get AI-assisted learning.</p>
          </button>

          {/* Teacher Card */}
          <button 
            onClick={() => handleSelectRole('teacher')}
            disabled={isLoading}
            className="flex flex-col items-center p-8 bg-black/20 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-indigo-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="bg-white/10 p-5 rounded-full mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Users className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold mb-2">I am a Teacher</h3>
            <p className="text-[#a0a0b0] text-sm text-center">Create courses, manage students, and track academic progress.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
