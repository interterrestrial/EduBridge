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
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-[#a0a0a0]">Manage your account preferences and profile.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          
          {/* Profile Section */}
          <div className="p-8 border-b border-border">
            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
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
                      <input type="text" defaultValue={user?.name || ''} className="w-full bg-input border border-border rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-[#a0a0a0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="email" disabled defaultValue={user?.email || ''} className="w-full bg-input border border-border rounded-xl py-2.5 pl-11 pr-4 text-[#a0a0a0] opacity-70 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-transparent shadow-sm cursor-pointer">
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="p-8 border-b border-border">
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
          <div className="p-8">
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

      </div>
    </DashboardLayout>
  );
}
