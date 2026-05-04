'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Fingerprint } from 'lucide-react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useUISounds } from '@/hooks/useUISounds';
import { cn } from '@/lib/utils';

interface ProfileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profileName: string;
  profileId: string;
}

export const ProfileAuthModal: React.FC<ProfileAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  profileName,
  profileId
}) => {
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { unlockProfile } = useLocalDataStore();
  const { playSound } = useUISounds();
  // Modal state

  const PIN_LENGTH = 4;

  const handleKeyPress = useCallback((num: string) => {
    if (pin.length < PIN_LENGTH) {
      playSound('click');
      setPin(prev => [...prev, num]);
      setError(false);
    }
  }, [pin.length, playSound, PIN_LENGTH]);

  const handleBackspace = useCallback(() => {
    if (pin.length > 0) {
      playSound('click');
      setPin(prev => prev.slice(0, -1));
      setError(false);
    }
  }, [pin.length, playSound]);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      const isValid = unlockProfile(profileId, pin.join(''));
      if (isValid) {
        setIsSuccess(true);
        playSound('success');
        setTimeout(() => {
          onSuccess();
          onClose();
          setPin([]);
          setIsSuccess(false);
        }, 800);
      } else {
        setError(true);
        playSound('error');
        // Shake animation triggered by error state
        setTimeout(() => setPin([]), 500);
      }
    }
  }, [pin, profileId, unlockProfile, onSuccess, onClose, playSound]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleBackspace, handleKeyPress, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/95 backdrop-blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#050505] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden p-10 flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Profile Access</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enter Your PIN</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              title="Close"
              aria-label="Close Access"
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Context */}
          <div className="mb-12 text-center">
            <motion.div 
              animate={isSuccess ? { scale: [1, 1.2, 1] } : {}}
              className="w-24 h-24 rounded-full mx-auto mb-6 p-1 bg-gradient-to-br from-primary to-purple-600 shadow-2xl"
            >
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-4 border-black">
                <div className="text-3xl">🛡️</div>
              </div>
            </motion.div>
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-1">{profileName}</h3>
            <p className="text-sm text-zinc-500 font-medium tracking-tight">Enter your PIN to access this profile.</p>
          </div>

          {/* PIN Display */}
          <div className={cn(
            "flex gap-4 mb-12",
            error && "animate-shake"
          )}>
            {[...Array(PIN_LENGTH)].map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: pin[i] ? 1.2 : 1,
                  backgroundColor: pin[i] ? (isSuccess ? '#10b981' : '#ffffff') : 'transparent',
                  borderColor: pin[i] ? (isSuccess ? '#10b981' : '#ffffff') : '#27272a'
                }}
                className="w-4 h-4 rounded-full border-2 transition-colors duration-200"
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                title={`Enter ${num}`}
                aria-label={`Enter ${num}`}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/20 transition-all active:scale-90"
              >
                {num}
              </button>
            ))}
            <div className="w-16 h-16" />
            <button
              onClick={() => handleKeyPress('0')}
              title="Enter 0"
              aria-label="Enter 0"
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/20 transition-all active:scale-90"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              title="Backspace"
              aria-label="Delete last digit"
              className="w-16 h-16 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          {/* Biometric Hint */}
          <div className="mt-12 flex items-center gap-2 text-zinc-600 font-bold text-[9px] uppercase tracking-widest animate-pulse">
            <Shield size={12} />
            Security PIN Required
          </div>

          {/* Background Glow */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </AnimatePresence>
  );
};
