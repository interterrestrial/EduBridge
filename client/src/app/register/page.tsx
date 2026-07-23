'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { User, Mail, Lock, UserPlus, ChevronDown, GraduationCap } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      login(res.data.token, res.data.user);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'An error occurred during registration');
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement actual Google OAuth logic
    console.log("Initiating Google Signup...");
  };

  return (
    <div className="min-h-screen flex text-white font-sans bg-gradient-to-br from-[#1e1e2f] to-[#2a2a40]">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 p-16 xl:p-24 relative">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-500 p-3 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">EduBridge</span>
        </div>
        
        <div className="text-[#a0a0b0] font-sans text-5xl xl:text-6xl font-bold leading-[1.2] tracking-tight max-w-lg">
          <p>Personalized</p>
          <p>learning with</p>
          <p className="text-indigo-400">AI assistance.</p>
        </div>
        <p className="mt-6 text-[#a0a0b0] text-lg max-w-md">
          Join our platform to connect with teachers, access AI-driven insights, and accelerate your educational journey.
        </p>

        {/* Vertical Divider */}
        <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-white/10"></div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative">
        
        <div className="w-full max-w-md flex flex-col items-center bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">EduBridge</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-[#a0a0b0] text-sm mb-8 text-center">Join EduBridge and transform your learning</p>
          
          <button 
            onClick={handleGoogleSignup}
            type="button"
            className="w-full bg-white text-gray-900 font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors mb-6 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign Up with Google
          </button>

          <div className="flex items-center w-full mb-6">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <span className="px-4 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">or sign up with email</span>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          {error && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[#a0a0b0]" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[#6b7280]"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#a0a0b0]" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[#6b7280]"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#a0a0b0]" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[#6b7280]"
                required
              />
            </div>

            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <User className="h-5 w-5 text-[#a0a0b0]" />
               </div>
               <select
                 id="role"
                 value={role}
                 onChange={(e) => setRole(e.target.value)}
                 className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-12 pr-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
               >
                 <option value="student" className="bg-[#1e1e2f] text-white">Student Account</option>
                 <option value="teacher" className="bg-[#1e1e2f] text-white">Teacher Account</option>
               </select>
               <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                 <ChevronDown className="h-5 w-5 text-[#a0a0b0]" />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-xl py-3.5 px-4 mt-2 flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-indigo-400 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              <UserPlus className="h-5 w-5" />
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-[#a0a0b0] text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
