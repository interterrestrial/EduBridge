'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { User, Mail, Bell, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-[#a0a0b0]">Manage your account preferences and profile.</p>
        </div>

        <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
          
          {/* Profile Section */}
          <div className="p-8 border-b border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shrink-0">
                <div className="w-full h-full bg-[#1e1e2f] rounded-full flex items-center justify-center overflow-hidden relative">
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
                    <label className="block text-sm font-medium text-[#a0a0b0] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="w-5 h-5 text-[#a0a0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" defaultValue={user?.name || ''} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#a0a0b0] mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-[#a0a0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="email" disabled defaultValue={user?.email || ''} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-[#a0a0b0] opacity-70 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10">
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="p-8 border-b border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg"><Bell className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <h4 className="text-white font-medium">Email Notifications</h4>
                    <p className="text-xs text-[#a0a0b0]">Receive study reminders and updates.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-lg"><Lock className="w-5 h-5 text-purple-400" /></div>
                  <div>
                    <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                    <p className="text-xs text-[#a0a0b0]">Add an extra layer of security.</p>
                  </div>
                </div>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Enable</button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20 max-w-xl">
              <div>
                <h4 className="text-white font-medium">Sign Out</h4>
                <p className="text-xs text-[#a0a0b0]">Log out of this device.</p>
              </div>
              <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
