'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, ArrowRight, Wifi } from 'lucide-react';
import SourceSwitcher from './SourceSwitcher';
import StillWatchingOverlay from './StillWatchingOverlay';
import { CinematicEndCredits } from '../CinematicEndCredits';

interface OverlayContainerProps {
  showSourceSwitcher: boolean;
  onCloseSourceSwitcher: () => void;
  allSources: any[];
  activeSourceUrl: string;
  onSourceSelect: (source: any) => void;
  
  showStillWatching: boolean;
  onContinueWatching: () => void;
  onExitStillWatching: () => void;
  
  showEndCredits: boolean;
  onNextEpisode: () => void;
  onCancelTransition: () => void;
  contentId: string;
  type: 'movie' | 'tv' | 'anime';
  season: number;
  nextEpisode: number;
  hasNext: boolean;
  discoveredSource?: { url: string; type: string } | null;
  onSwitchToNative?: () => void;
  onToggleSource?: () => void;
  isNative?: boolean;
  showControls?: boolean;
}

export function OverlayContainer({
  showSourceSwitcher,
  onCloseSourceSwitcher,
  allSources,
  activeSourceUrl,
  onSourceSelect,
  
  showStillWatching,
  onContinueWatching,
  onExitStillWatching,
  
  showEndCredits,
  onNextEpisode,
  onCancelTransition,
  contentId,
  type,
  season,
  nextEpisode,
  hasNext,
  discoveredSource,
  onSwitchToNative,
  onToggleSource,
  isNative,
  showControls = true
}: OverlayContainerProps) {
  return (
    <>
      <AnimatePresence>
        {showSourceSwitcher && allSources.length > 0 && (
          <SourceSwitcher
            show={showSourceSwitcher}
            sources={allSources}
            activeSourceUrl={activeSourceUrl}
            onSelect={onSourceSelect}
            onClose={onCloseSourceSwitcher}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStillWatching && (
          <StillWatchingOverlay 
            show={showStillWatching}
            onContinue={onContinueWatching} 
            onExit={onExitStillWatching}
          />
        )}
      </AnimatePresence>

      {showEndCredits && (
        <CinematicEndCredits
          contentId={contentId}
          type={type}
          season={season}
          nextEpisode={nextEpisode}
          hasNext={hasNext}
          onNext={onNextEpisode}
          onCancel={onCancelTransition}
        />
      )}

      <AnimatePresence>
        {discoveredSource && onSwitchToNative && !showControls && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[1000]"
          >
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onSwitchToNative}
                className="group relative flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary shadow-lg shadow-brand-primary/20 group-hover:rotate-12 transition-transform">
                  <Zap className="h-6 w-6 text-white fill-white" />
                </div>
                
                <div className="flex flex-col items-start pr-4">
                  <span className="text-[10px] font-black tracking-[0.2em] text-white/50 uppercase">
                    Enhanced Playback Available
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    Switch to Native Player
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Glowing Background Effect */}
                <div className="absolute inset-0 -z-10 bg-brand-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              {/* Secondary toggle removed to prevent UI occlusion */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
