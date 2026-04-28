'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { streamingOptimizer } from '@/services/streamingOptimizer';
import { X, Play, Plus } from 'lucide-react';
import { usePreferencesStore } from '@/lib/stores/preferencesStore';
import { useSimilar } from '@/hooks/queries/useContent';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import Link from 'next/link';
import { type Content } from '@/lib/types/content';

interface CinematicEndCreditsProps {
  contentId: string;
  type: 'movie' | 'tv' | 'anime';
  season: number;
  nextEpisode: number;
  hasNext: boolean;
  onNext: () => void;
  onCancel: () => void;
}

export function CinematicEndCredits({
  contentId,
  type,
  season,
  nextEpisode,
  hasNext,
  onNext,
  onCancel,
}: CinematicEndCreditsProps) {
  const currentTime = usePlayerStore(state => state.currentTime);
  const storeDuration = usePlayerStore(state => state.duration);
  const audioLanguage = usePreferencesStore(state => state.audioLanguage);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  
  // Use the countdown from playerStore or local default
  const countdownSeconds = 15; 
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  
  const { data: similarContent } = useSimilar(contentId, type);

  const triggeredRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleAutoAdvance = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    onNext();
  }, [onNext]);

  useEffect(() => {
    if (!hasNext || storeDuration <= 30) return;

    const timeRemaining = storeDuration - currentTime;
    const progress = currentTime / storeDuration;

    // Show overlay in the last 30 seconds
    if (timeRemaining <= 30 && timeRemaining > 0 && progress > 0.9 && !triggeredRef.current) {
      setShowOverlay(true);
      
      // Start auto-advance countdown in the last 15 seconds
      if (timeRemaining <= countdownSeconds && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              handleAutoAdvance();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else if (timeRemaining > 35) {
      setShowOverlay(false);
      setCountdown(countdownSeconds);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [currentTime, storeDuration, hasNext, handleAutoAdvance, countdownSeconds]);

  // Preload next episode
  useEffect(() => {
    if (!hasNext || storeDuration <= 30 || hasPreloaded || isPreloading) return;

    const timeRemaining = storeDuration - currentTime;
    if (timeRemaining <= 45) {
      setIsPreloading(true);
      streamingOptimizer.preloadSources(contentId, type, season, nextEpisode, '', audioLanguage).then(() => {
        setHasPreloaded(true);
        setIsPreloading(false);
      });
    }
  }, [currentTime, storeDuration, hasNext, hasPreloaded, isPreloading, contentId, type, season, nextEpisode, audioLanguage]);

  if (!showOverlay) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[200] flex flex-col justify-end p-12 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"
      >
        <div className="flex flex-col gap-12 max-w-7xl mx-auto w-full pointer-events-auto">
          {/* Main Action Area */}
          <div className="flex items-end justify-between gap-12">
            {/* Left: Next Episode Preview */}
            <div className="flex-1 max-w-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/70 mb-4 block">Current Reel Ending</span>
              <div className="flex gap-8 items-center">
                <div className="relative w-72 aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer" onClick={onNext}>
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                    <Play fill="currentColor" size={48} className="text-white" />
                  </div>
                  <OptimizedImage 
                    src={`https://image.tmdb.org/t/p/w500/${contentId}`} // Fallback for now, ideally next episode thumb
                    alt="Next Episode"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(1 - countdown / countdownSeconds) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <PretextHeadline
                    text={`Episode ${nextEpisode}`}
                    fontSize={48}
                    fontWeight={900}
                    letterSpacing="-0.04em"
                    className="text-white uppercase italic"
                  />
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Master Source Synchronized</p>
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={onNext}
                      className="px-8 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-tighter italic text-sm hover:scale-105 transition-transform"
                    >
                      Watch Now ({countdown}s)
                    </button>
                    <button 
                      title="Cancel"
                      onClick={onCancel}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Recommendations */}
            {similarContent && similarContent.length > 0 && (
              <div className="w-[400px]">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 block">Editorial Selection</span>
                <div className="flex flex-col gap-4">
                  {similarContent.slice(0, 3).map((item: Content) => (
                    <Link 
                      key={item.id}
                      href={`/watch?id=${item.id}&type=${type}`}
                      className="flex gap-4 items-center p-3 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className="relative w-20 aspect-video rounded-xl overflow-hidden shrink-0">
                        <OptimizedImage 
                          src={item.backdrop || item.poster || ''}
                          alt={item.title || 'Recommendation'}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Match {Math.round((item.rating || 0) * 10)}%</span>
                        </div>
                      </div>
                      <Plus size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Background Blur Field */}
        <div className="absolute inset-0 -z-10 bg-black/60 backdrop-blur-3xl" />
      </motion.div>
    </AnimatePresence>
  );
}
