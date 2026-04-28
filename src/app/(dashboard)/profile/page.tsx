'use client';

import { useAuthStore } from '@/lib/stores';
import { useLocalDataStore, useProfiles, useActiveProfile, useProfileActions } from '@/lib/stores/localDataStore';
import { User, Mail, Shield, Clock, Bookmark, Camera, LogOut, Users, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { LoginForm } from '@/components/auth/LoginForm';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const profiles = useProfiles();
  const activeProfile = useActiveProfile();
  const { setActiveProfile, deleteProfile } = useProfileActions();
  
  const historyCount = useLocalDataStore(state => state.watchHistory.length);
  const libraryCount = useLocalDataStore(state => state.library.length);

  const handleLogout = () => {
    logout();
    setActiveProfile('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 px-4 md:px-12 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 to-red-900 shadow-2xl">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-8 left-8 flex items-end gap-6 w-full pr-16">
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-zinc-900 border-4 border-zinc-950 overflow-hidden shadow-2xl">
                <Image
                  src={activeProfile?.avatar || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeProfile?.name || user.username}`}
                  alt={activeProfile?.name || user.username}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 rounded-xl border border-white/10 text-white hover:bg-zinc-800 transition-colors shadow-xl"
                aria-label="Change profile picture"
              >
                <Camera size={16} />
              </button>
            </div>
            <div className="pb-2 flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                {activeProfile?.name || user.username}
              </h1>
              <p className="text-red-100/80 font-medium">Vault ID: {activeProfile?.id || 'Root'}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{historyCount}</div>
              <div className="text-xs text-zinc-500 uppercase font-semibold">Titles Watched</div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <Bookmark size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{libraryCount}</div>
              <div className="text-xs text-zinc-500 uppercase font-semibold">In Library</div>
            </div>
          </div>
          <div className="hidden md:flex bg-zinc-900/50 border border-white/5 p-6 rounded-2xl items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <Shield size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{user.role.toUpperCase()}</div>
              <div className="text-xs text-zinc-500 uppercase font-semibold">Account Status</div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold text-white">Account Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <User className="text-zinc-500" size={20} />
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Username</div>
                  <div className="text-white font-medium">{user.username}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <Mail className="text-zinc-500" size={20} />
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Email Address</div>
                  <div className="text-white font-medium">{user.email}</div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Subscription</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                You are currently on the <span className="text-white font-bold">Mai Premium</span> plan. Enjoy 4K
                streaming, offline downloads, and multi-device support.
              </p>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-red-500 font-bold">Next billing: Feb 15, 2026</span>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/onboarding'}>
                 <UserPlus size={18} className="mr-2" />
                 Reset Onboarding
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Management */}
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-red-500" size={24} />
              <h2 className="text-2xl font-bold text-white">Switch Profiles</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProfile(p.id)}
                className={cn(
                  "group flex flex-col items-center gap-3 transition-all",
                  activeProfile?.id === p.id ? "opacity-100" : "opacity-40 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all group-hover:scale-105",
                  activeProfile?.id === p.id ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "border-white/10 group-hover:border-white/30"
                )}>
                  <Image
                    src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                    alt={p.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors",
                  activeProfile?.id === p.id ? "text-red-500" : "text-zinc-500 group-hover:text-white"
                )}>
                  {p.name}
                </span>
                {p.id !== 'primary' && activeProfile?.id !== p.id && (
                  <span 
                    onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                    className="text-[10px] text-zinc-600 hover:text-red-500 transition-colors uppercase font-black"
                  >
                    Delete
                  </span>
                )}
              </button>
            ))}
            
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="group flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-all"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all">
                <UserPlus size={32} className="text-zinc-500 group-hover:text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white">
                New Vault
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
