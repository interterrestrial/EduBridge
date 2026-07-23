'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      {/* Optional loading spinner while auth resolves */}
      <div className="w-8 h-8 border-4 border-[#5A94CE] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
