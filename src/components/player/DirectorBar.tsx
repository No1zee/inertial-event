'use client';

import React from 'react';
import { ArrowLeft, ChevronDown, Share2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { cn } from '@/lib/utils';
import { SourceSwitcher } from './controls/SourceSwitcher';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';
import { SOURCES } from '@/lib/config/sources';

interface DirectorBarProps {
  show: boolean;
  title: string;
  subTitle?: string;
  type: 'movie' | 'tv' | 'anime';
  season?: number;
  episode?: number;
  onBack?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * DirectorBar
 *
 * A premium, glassmorphic top-aligned control overlay for the Player Sanctum.
 * Features institutional-grade typography and rhythmic motion.
 */
export function DirectorBar({
  show,
  title,
  subTitle,
  type,
  season,
  episode,
  onBack,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: DirectorBarProps) {
  const router = useRouter();
  const { activeSourceId } = useUserPreferencesStore();

  // Reliable Electron detection
  const isElectron =
    typeof window !== 'undefined' &&
    (window.electron ||
      (window as typeof window & { process?: { versions?: { electron?: string } } }).process?.versions?.electron);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (typeof window !== 'undefined' && window.history.length <= 1) {
        router.push('/');
      } else {
        router.back();
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* High-Sensitivity Trigger Zone (Top 15%) - Increased height for Electron */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-48 pointer-events-auto cursor-none group/trigger',
          isElectron ? 'bg-white/[0.01]' : '' // Almost invisible but helps with event capturing
        )}
      />

      <div
        className={cn(
          'max-w-[1800px] mx-auto p-6 lg:p-10 flex items-start justify-between transition-all duration-500',
          isElectron ? 'pt-14 lg:pt-16' : ''
        )}
      >
        {/* Left: Navigation & Metadata */}
        <div className="flex items-start gap-8 pointer-events-auto">
          <div className="flex flex-col gap-2">
            {/* Always-Available Back Button */}
            <button
              onClick={handleBack}
              className={cn(
                'group p-4 rounded-full bg-white text-black transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95',
                show ? 'opacity-100 translate-x-0' : 'opacity-20 hover:opacity-100 -translate-x-1 hover:translate-x-0'
              )}
              aria-label="Return home"
            >
              <ArrowLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Always-Available Episode Nav (Small) */}
            {!show && (onNext || onPrev) && (
              <div className="flex flex-col gap-1 transition-opacity opacity-20 hover:opacity-100">
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  title="Previous Episode"
                  aria-label="Previous Episode"
                  className={cn(
                    'p-2 rounded-lg bg-zinc-900/60 border border-white/5 transition-all',
                    hasPrev ? 'text-white hover:bg-white/10' : 'text-zinc-800 cursor-not-allowed'
                  )}
                >
                  <ChevronDown size={14} className="rotate-90" />
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  title="Next Episode"
                  aria-label="Next Episode"
                  className={cn(
                    'p-2 rounded-lg bg-zinc-900/60 border border-white/5 transition-all',
                    hasNext ? 'text-primary hover:bg-primary/20' : 'text-zinc-800 cursor-not-allowed'
                  )}
                >
                  <ChevronDown size={14} className="-rotate-90" />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {show && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="space-y-1"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">
                    {type === 'movie' ? 'Cinematic Presentation' : `Series Broadcast • S${season} E${episode}`}
                  </span>
                  {isElectron && (
                    <span className="text-[8px] uppercase tracking-widest font-black text-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Aegis Native
                    </span>
                  )}
                  <span className="h-[1px] w-8 bg-white/10" />
                </div>
                <PretextHeadline text={title} fontSize={32} fontWeight={800} className="text-white drop-shadow-2xl" />
                {subTitle && (
                  <div className="flex items-center gap-4">
                    <p className="text-zinc-500 font-medium text-sm tracking-wide uppercase">{subTitle}</p>

                    {(onNext || onPrev) && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={onPrev}
                          disabled={!hasPrev}
                          aria-label="Previous episode"
                          className={cn(
                            'p-1.5 rounded-lg bg-zinc-900/40 border border-white/5 transition-all',
                            hasPrev
                              ? 'text-white/60 hover:text-white hover:bg-white/10'
                              : 'text-zinc-800 cursor-not-allowed'
                          )}
                        >
                          <ChevronDown size={16} className="rotate-90" />
                        </button>
                        <button
                          onClick={onNext}
                          disabled={!hasNext}
                          aria-label="Next episode"
                          className={cn(
                            'p-1.5 rounded-lg bg-zinc-900/40 border border-white/5 transition-all text-white',
                            hasNext
                              ? 'bg-primary/20 text-primary border-primary/20 hover:bg-primary/30'
                              : 'text-zinc-800 cursor-not-allowed'
                          )}
                        >
                          <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Technical Actions */}
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center gap-4 pointer-events-auto"
            >
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900/40 backdrop-blur-3xl border border-white/5 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                <Zap size={14} className="text-primary animate-pulse" />
                <span>Ultrafast Tunneling • {SOURCES.find(s => s.id === activeSourceId)?.codename || 'Aegis'}</span>
              </div>

              <button
                className="p-3 rounded-2xl bg-zinc-900/40 backdrop-blur-3xl border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Share content"
              >
                <Share2 size={20} />
              </button>

              <SourceSwitcher />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle Top Shadow */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none h-48"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
