'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ChevronRight, Activity } from 'lucide-react';
import { 
  useLastWatched, 
  useModalActions, 
  useCurrentMedia, 
  useModalState,
  useLayoutState,
  useLayoutActions
} from '@/lib/stores';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Content } from '@/lib/types/content';

export const GlobalPlayerBar: React.FC = () => {
  const lastWatched = useLastWatched();
  const currentMedia = useCurrentMedia();
  const { isOpen: isModalOpen } = useModalState();
  const { playerBarDismissed } = useLayoutState();
  const { setPlayerBarDismissed } = useLayoutActions();
  
  const [isVisible, setIsVisible] = useState(false);
  const { openContentModal } = useModalActions();

  useEffect(() => {
    // Only show if:
    // 1. We have watch history
    // 2. It's not completed
    // 3. NO media is currently active in the player
    // 4. NO modal is currently open
    // 5. It hasn't been dismissed for this session
    if (lastWatched && 
        !lastWatched.completed && 
        lastWatched.progress > 2 && 
        !currentMedia && 
        !isModalOpen && 
        !playerBarDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [lastWatched, currentMedia, isModalOpen, playerBarDismissed]);

  if (!lastWatched) return null;

  const handleResume = () => {
    openContentModal({
      id: lastWatched.contentId,
      type: lastWatched.type,
      title: lastWatched.title,
      poster: lastWatched.poster,
      backdrop: lastWatched.backdrop,
    } as unknown as Content);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setPlayerBarDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-2xl"
        >
          <div
            className="glass-card rounded-[2rem] p-2 pr-6 flex items-center gap-4 group cursor-pointer shadow-2xl border-white/10"
            onClick={handleResume}
          >
            {/* Poster / Thumbnail */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
              <OptimizedImage
                src={lastWatched.poster || lastWatched.backdrop || ''}
                alt={lastWatched.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={20} className="fill-white text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
                  <Activity size={10} className="animate-pulse" />
                  Active Session
                </span>
                {lastWatched.type === 'tv' && (
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    S{lastWatched.season} E{lastWatched.episode}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white truncate tracking-tight">{lastWatched.title}</h4>

              {/* Mini Progress Bar */}
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${lastWatched.progress}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg">
                Resume
                <ChevronRight size={14} />
              </button>
              <button
                onClick={handleDismiss}
                title="Dismiss"
                aria-label="Dismiss"
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
