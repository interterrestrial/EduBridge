'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'An error occurred during login');
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      try {
        const res = await api.post('/auth/google', { token: tokenResponse.access_token });
        login(res.data.token, res.data.user);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.error || 'Google login failed');
        } else {
          setError('Google login failed');
        }
      }
    },
    onError: () => setError('Google login failed'),
  });

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 p-16 xl:p-24 relative border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center shadow-lg border border-primary/30">
            <GraduationCap className="w-12 h-12 text-primary" />
          </div>
          <span className="font-heading text-4xl font-bold text-white tracking-tight">EduBridge</span>
        </div>
        
        <div className="font-heading text-5xl xl:text-6xl font-bold leading-tight tracking-tight max-w-lg text-[#d4d4d4]">
          <p>Personalized</p>
          <p>learning with</p>
          <p className="text-primary">AI assistance.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          
          <h1 className="text-3xl font-medium text-white mb-2">Welcome Back 👋</h1>
          <p className="text-[#a0a0a0] text-sm mb-10 text-center">Sign In to continue</p>
          
          <Button 
            onClick={() => handleGoogleLogin()}
            type="button"
            variant="ghost"
            className="!bg-[#d9d9d9] hover:!bg-[#c0c0c0] !text-black mb-6"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="mr-3">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center w-full mb-6">
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="px-4 text-[#737373] text-xs font-medium">OR</span>
            <div className="h-[1px] flex-1 bg-border"></div>
          </div>

          {error && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              icon={<Mail className="h-5 w-5" />}
              required
            />

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              icon={<Lock className="h-5 w-5" />}
              required
            />

            <Button 
              type="submit" 
              fullWidth
              disabled={isLoading}
              className="mt-6"
            >
              <LogIn className="h-5 w-5 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-[#a0a0a0] text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
