'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { BookOpen, Users } from 'lucide-react';
import { AxiosError } from 'axios';
import { Card } from '../../components/ui/Card';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground font-sans">
      <Card className="w-full max-w-3xl p-10 md:p-14 flex flex-col items-center">
        
        {/* Logo Placeholder */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#d9d9d9] w-12 h-12 rounded-xl"></div>
          <span className="text-3xl font-bold tracking-tight text-white">EduBridge</span>
        </div>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 text-center">Choose Your Path</h1>
        <p className="text-[#a0a0a0] text-center max-w-md mb-10">
          Welcome to EduBridge! Please tell us how you'll be using the platform so we can personalize your experience.
        </p>

        {error && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mb-8">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Student Card */}
          <button 
            onClick={() => handleSelectRole('student')}
            disabled={isLoading}
            className="flex flex-col items-center p-8 bg-input border border-border rounded-2xl hover:border-primary transition-all group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="bg-white/5 p-5 rounded-full mb-6 group-hover:bg-primary/20 transition-colors">
              <BookOpen className="w-12 h-12 text-primary group-hover:text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">I am a Student</h3>
            <p className="text-[#a0a0a0] text-sm text-center">Join classes, access study materials, and get AI-assisted learning.</p>
          </button>

          {/* Teacher Card */}
          <button 
            onClick={() => handleSelectRole('teacher')}
            disabled={isLoading}
            className="flex flex-col items-center p-8 bg-input border border-border rounded-2xl hover:border-primary transition-all group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="bg-white/5 p-5 rounded-full mb-6 group-hover:bg-primary/20 transition-colors">
              <Users className="w-12 h-12 text-primary group-hover:text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">I am a Teacher</h3>
            <p className="text-[#a0a0a0] text-sm text-center">Create courses, manage students, and track academic progress.</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
