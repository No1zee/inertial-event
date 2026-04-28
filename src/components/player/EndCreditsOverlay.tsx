'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, Info, X, Activity } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface EndCreditsOverlayProps {
  show: boolean;
  onNext: () => void;
  onReplay: () => void;
  onClose: () => void;
  nextContent?: {
    title: string;
    poster: string;
    season?: number;
    episode?: number;
  };
}

export const EndCreditsOverlay: React.FC<EndCreditsOverlayProps> = ({
  show,
  onNext,
  onReplay,
  onClose,
  nextContent,
}) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!show || !nextContent) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, nextContent, onNext]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
        >
          {/* Close Button */}
          <button 
            title="Close"
            onClick={onClose}
            className="absolute top-12 right-12 p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
          >
            <X size={24} />
          </button>

          <div className="max-w-4xl w-full flex flex-col items-center gap-12">
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="flex flex-col items-center gap-4"
             >
                <span className="text-primary font-black uppercase tracking-[0.5em] text-xs">Mission Complete</span>
                <PretextHeadline 
                  text="Director's Sequence" 
                  fontSize={48} 
                  fontWeight={900} 
                  letterSpacing="-0.02em" 
                  className="text-white uppercase" 
                />
             </motion.div>

             {nextContent ? (
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white/[0.03] border border-white/5 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"
               >
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-primary/5 blur-[100px]" />
                  
                  <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                     <OptimizedImage src={nextContent.poster} alt={nextContent.title} fill className="object-cover" />
                  </div>

                  <div className="flex flex-col items-start text-left gap-6">
                     <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Up Next In {countdown}s</span>
                        <PretextHeadline 
                          text={nextContent.title} 
                          fontSize={30} 
                          fontWeight={900} 
                          className="text-white uppercase" 
                        />
                        {nextContent.season && (
                          <span className="text-primary font-bold text-sm tracking-widest mt-2">
                             SEASON {nextContent.season} {'//'} EPISODE {nextContent.episode}
                          </span>
                        )}
                     </div>

                     <div className="flex items-center gap-4 w-full">
                        <button 
                          onClick={onNext}
                          className="flex-1 h-14 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95"
                        >
                           <Play size={20} fill="currentColor" />
                           Play Now
                        </button>
                        <button 
                          title="Replay"
                          onClick={onReplay}
                          className="w-14 h-14 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/5 transition-all"
                        >
                           <SkipForward size={20} className="rotate-180" />
                        </button>
                     </div>
                  </div>
               </motion.div>
             ) : (
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="flex flex-col items-center gap-8"
               >
                  <p className="text-zinc-400 text-xl font-medium">You&apos;ve reached the end of this journey.</p>
                  <button 
                    onClick={onReplay}
                    className="px-12 h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-black uppercase tracking-widest transition-all"
                  >
                    Watch Again
                  </button>
               </motion.div>
             )}

             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.8 }}
               className="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600"
             >
                <div className="flex items-center gap-3">
                   <Info size={14} />
                   <span>Cast & Credits</span>
                </div>
                <div className="flex items-center gap-3">
                   <Activity size={14} />
                   <span>Technical Analysis</span>
                </div>
             </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
