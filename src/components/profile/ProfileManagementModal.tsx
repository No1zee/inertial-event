'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Baby, Camera, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useProfileActions, UserProfile } from '@/lib/stores/localDataStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUISounds } from '@/hooks/useUISounds';

interface ProfileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile; // If provided, we're editing. Otherwise, creating.
}

const AVATAR_SEEDS = [
  'Director', 'Auteur', 'Producer', 'Cinematographer', 
  'Editor', 'Critic', 'Fan', 'Cinephile',
  'Actor', 'Writer', 'Gaffer', 'KeyGrip'
];

export const ProfileManagementModal: React.FC<ProfileManagementModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  const { createProfile, updateProfile } = useProfileActions();
  const { playSound } = useUISounds();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isKids, setIsKids] = useState(false);
  const [pin, setPin] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatar(profile.avatar);
      setIsKids(profile.isKids);
      setPin(profile.pin || '');
      setIsLocked(profile.isLocked);
    } else {
      setName('');
      const randomSeed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
      setAvatar(`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${randomSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
      setIsKids(false);
      setPin('');
      setIsLocked(false);
    }
  }, [profile, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;

    const profileData = {
      name: name.trim(),
      avatar,
      isKids,
      pin: isLocked ? pin : undefined,
      isLocked
    };

    if (profile) {
      updateProfile(profile.id, profileData);
      playSound('success');
    } else {
      createProfile(profileData);
      playSound('success');
    }
    onClose();
  };

  const handleAvatarSelect = (seed: string) => {
    setAvatar(`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
    playSound('click');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-zinc-900 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-primary">
                  <User size={20} />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">{profile ? 'Edit Profile' : 'New Profile'}</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-zinc-800 border-2 border-white/10 group-hover:border-primary/50 transition-all duration-500">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary text-black flex items-center justify-center shadow-lg">
                    <Camera size={16} />
                  </div>
                </div>

                <div className="w-full space-y-2 text-center">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Profile Name"
                    className="w-full bg-transparent text-2xl font-black text-center text-white placeholder:text-zinc-700 focus:outline-none uppercase tracking-tighter"
                    autoFocus
                  />
                  <div className="h-0.5 w-24 bg-primary/20 mx-auto rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: name.trim() ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_SEEDS.slice(0, 8).map(seed => (
                    <button
                      key={seed}
                      onClick={() => handleAvatarSelect(seed)}
                      className={cn(
                        "aspect-square rounded-2xl overflow-hidden bg-zinc-800 border-2 transition-all",
                        avatar.includes(seed) ? "border-primary scale-95" : "border-transparent hover:border-white/20"
                      )}
                    >
                      <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt={seed} />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <ToggleOption
                    label="Kids Profile"
                    description="Curated interface and content for young audiences"
                    icon={Baby}
                    checked={isKids}
                    onChange={setIsKids}
                  />

                  <div className="space-y-3">
                    <ToggleOption
                      label="Profile Lock"
                      description="Require a PIN to access this profile"
                      icon={isLocked ? ShieldCheck : Shield}
                      checked={isLocked}
                      onChange={setIsLocked}
                    />
                    
                    <AnimatePresence>
                      {isLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4">
                            <ShieldAlert size={18} className="text-primary shrink-0" />
                            <input
                              type="password"
                              maxLength={4}
                              value={pin}
                              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                              placeholder="Set 4-Digit PIN"
                              className="bg-transparent text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none w-full"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 py-6 rounded-2xl border-white/5 text-zinc-500 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || (isLocked && pin.length < 4)}
                  className="flex-1 py-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {profile ? 'Save Changes' : 'Create Profile'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ToggleOption = ({ 
  label, 
  description, 
  icon: Icon, 
  checked, 
  onChange 
}: { 
  label: string; 
  description: string; 
  icon: any; 
  checked: boolean; 
  onChange: (val: boolean) => void 
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn(
      "w-full p-4 rounded-[2rem] border flex items-center justify-between transition-all group",
      checked ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/5 hover:border-white/10"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
        checked ? "bg-primary text-black" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
      )}>
        <Icon size={18} />
      </div>
      <div className="text-left">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest block",
          checked ? "text-primary" : "text-zinc-400 group-hover:text-white"
        )}>
          {label}
        </span>
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter block mt-0.5">
          {description}
        </span>
      </div>
    </div>
    <div className={cn(
      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
      checked ? "border-primary bg-primary text-black" : "border-zinc-700"
    )}>
      {checked && <Check size={12} strokeWidth={4} />}
    </div>
  </button>
);
