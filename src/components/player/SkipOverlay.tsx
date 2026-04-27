'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward } from 'lucide-react';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';

interface SkipOverlayProps {
  currentTime: number;
  duration: number;
  onSkip: (seconds: number) => void;
  skipIntroTime?: { start: number; end: number };
  skipRecapTime?: { start: number; end: number };
}

export const SkipOverlay: React.FC<SkipOverlayProps> = ({
  currentTime,
  onSkip,
  skipIntroTime = { start: 0, end: 90 }, // Mock defaults
  skipRecapTime = { start: 0, end: 30 },
}) => {
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipRecap, setShowSkipRecap] = useState(false);

  const { skipIntro: autoSkipPref } = useUserPreferencesStore();

  useEffect(() => {
    // Check if we are in intro range
    const inIntro = currentTime >= skipIntroTime.start && currentTime <= skipIntroTime.end;
    const inRecap = currentTime >= skipRecapTime.start && currentTime <= skipRecapTime.end;

    // Auto-skip logic (Feature 20)
    if (autoSkipPref && inIntro) {
       onSkip(skipIntroTime.end - currentTime);
       return;
    }

    setShowSkipIntro(inIntro);
    setShowSkipRecap(inRecap && !inIntro);
  }, [currentTime, skipIntroTime, skipRecapTime, autoSkipPref, onSkip]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-end justify-start p-12 sm:p-20 pb-32">
      <AnimatePresence>
        {(showSkipIntro || showSkipRecap) && (
          <motion.button
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            onClick={() => onSkip(showSkipIntro ? skipIntroTime.end - currentTime : skipRecapTime.end - currentTime)}
            className="pointer-events-auto group relative flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all active:scale-95"
          >
            {/* Animated Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <FastForward size={24} className="text-primary fill-primary/20 group-hover:scale-110 transition-transform" />
            
            <div className="flex flex-col items-start">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Tactical Shortcut</span>
               <span className="text-sm font-black text-white uppercase tracking-wider">
                  {showSkipIntro ? "Skip Opening" : "Skip Recap"}
               </span>
            </div>

            {/* Visual Progress Shimmer */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-primary/50 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
