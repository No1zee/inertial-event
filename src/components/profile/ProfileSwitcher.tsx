'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus, Lock, Check, Trash2 } from 'lucide-react';
import { useProfiles, useActiveProfile, useProfileActions, UserProfile } from '@/lib/stores/localDataStore';
import { ProfileAuthModal } from '@/components/auth/ProfileAuthModal';
import { cn } from '@/lib/utils';
import { useUISounds } from '@/hooks/useUISounds';

export const ProfileSwitcher: React.FC = () => {
  const profiles = useProfiles();
  const activeProfile = useActiveProfile();
  const { setActiveProfile, deleteProfile } = useProfileActions();
  const { playSound } = useUISounds();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<{ id: string; name: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleProfileSelect = (profile: UserProfile) => {
    if (profile.id === activeProfile?.id) return;

    if (profile.isLocked) {
      setPendingProfile({ id: profile.id, name: profile.name });
      setAuthModalOpen(true);
    } else {
      playSound('success');
      setActiveProfile(profile.id);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingProfile) {
      setActiveProfile(pendingProfile.id);
      setPendingProfile(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Switch Profile</h4>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Select a profile to start watching</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
            isEditing 
              ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" 
              : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/10"
          )}
        >
          {isEditing ? 'Finish' : 'Manage'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <button
              onClick={() => !isEditing && handleProfileSelect(profile)}
              className={cn(
                "relative w-full aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 transition-all duration-500 overflow-hidden",
                profile.id === activeProfile?.id
                  ? "bg-primary/10 border-primary shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]"
                  : "bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-zinc-800/50"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                  profile.id === activeProfile?.id ? "bg-primary text-black" : "bg-zinc-800 text-zinc-500"
                )}>
                  <User size={32} />
                </div>
                
                {profile.isLocked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center text-primary shadow-xl">
                    <Lock size={12} />
                  </div>
                )}
              </div>

              <div className="text-center px-4">
                <span className={cn(
                  "text-xs font-black uppercase tracking-widest block truncate",
                  profile.id === activeProfile?.id ? "text-primary" : "text-zinc-400"
                )}>
                  {profile.name}
                </span>
                {profile.id === activeProfile?.id && (
                  <span className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Active</span>
                )}
              </div>

              {/* Selection Indicator */}
              {profile.id === activeProfile?.id && !isEditing && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black"
                >
                  <Check size={14} />
                </motion.div>
              )}
            </button>

            {/* Management Overlay */}
            <AnimatePresence>
              {isEditing && profile.id !== 'primary' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-[2rem]"
                >
                  <button
                    title="Delete Profile"
                    onClick={() => {
                      playSound('click');
                      deleteProfile(profile.id);
                    }}
                    className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Create Profile Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="aspect-square rounded-[2rem] border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 flex flex-col items-center justify-center gap-3 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:scale-110 transition-all">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-black text-zinc-500 group-hover:text-white uppercase tracking-widest">Add Profile</span>
        </motion.button>
      </div>

      <ProfileAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        profileId={pendingProfile?.id || ''}
        profileName={pendingProfile?.name || ''}
      />
    </div>
  );
};
