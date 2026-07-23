'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'student') {
        router.push('/student-dashboard');
      } else if (user.role === 'teacher') {
        router.push('/teacher-dashboard');
      } else {
        router.push('/choose-role');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#1e1e2f] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
