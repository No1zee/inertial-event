'use client';

import React, { useState, useEffect } from 'react';
import { Play, Info, Star, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface CinemaMarqueeProps {
  items?: Content[];
}

export function ParallaxBackground({ src }: { src: string }) {
  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      initial={{ scale: 1.1 }}
      animate={{ scale: 1.0 }}
      transition={{ duration: 12, ease: 'linear' }}
    >
      <OptimizedImage src={src} alt="" fill className="object-cover" priority sizes="100vw" />
    </motion.div>
  );
}

export function CinemaMarquee({ items = [] }: CinemaMarqueeProps) {
  const isHydrated = useHydrated();
  const [index, setIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [scrollingProgress, setScrollingProgress] = useState(0);
  const router = useRouter();
  const openContentModal = useUIStore(state => state.openContentModal);
  const getResumeData = useLocalDataStore(state => state.getResumeData);

  const displayItems = (items || []).filter(item => item && item.id).slice(0, 5);
  // Ensure index is always valid for the current displayItems
  const safeIndex = displayItems.length > 0 ? index % displayItems.length : 0;
  const currentItem = displayItems.length > 0 ? displayItems[safeIndex] : null;

  useEffect(() => {
    if (!displayItems || displayItems.length === 0) return;

    const duration = 12000;
    setScrollingProgress(100); 

    const timer = setTimeout(() => {
      setIndex(prev => {
        const next = prev + 1;
        return displayItems.length > 0 ? next % displayItems.length : 0;
      });
      setScrollingProgress(0); 
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [displayItems.length, index]);

  if (!isHydrated || !currentItem) {
    return (
      <div className="h-[70vh] sm:h-[80vh] lg:h-[88vh] w-full px-4 py-2">
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] lg:rounded-[3.5rem] bg-zinc-900 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-shimmer" />
          <div className="absolute bottom-24 lg:bottom-32 left-10 lg:left-24 space-y-6">
            <div className="h-4 w-32 bg-zinc-800 rounded-full" />
            <div className="h-16 lg:h-24 w-[300px] lg:w-[600px] bg-zinc-800 rounded-2xl" />
            <div className="flex gap-4">
              <div className="h-12 w-40 bg-zinc-800 rounded-xl" />
              <div className="h-12 w-40 bg-zinc-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePlay = () => {
    if (!currentItem) return;
    const contentType =
      currentItem?.type || (currentItem?.seasonsList && currentItem.seasonsList.length > 0 ? 'tv' : 'movie');
    const resumeData = getResumeData(String(currentItem.id));

    if (resumeData) {
      const { season, episode, currentTime, completed } = resumeData;
      if (!completed) {
        router.push(
          `/watch?id=${currentItem.id}&type=${contentType}${season ? `&season=${season}` : ''}${episode ? `&episode=${episode}` : ''}&progress=${currentTime}`
        );
      } else {
        router.push(`/watch?id=${currentItem.id}&type=${contentType}&season=${season ?? 1}&episode=${(episode ?? 1) + 1}`);
      }
    } else {
      router.push(`/watch?id=${currentItem.id}&type=${contentType}`);
    }
  };

  return (
    <section className="relative h-[70vh] sm:h-[80vh] lg:h-[88vh] w-full overflow-hidden group select-none px-4 py-2">
      <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/5 bg-[#050505]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentItem.id || safeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <OptimizedImage
              src={currentItem.backdrop || currentItem.poster || ''}
              alt={currentItem.title || ''}
              fallbackSrc="/images/hero_placeholder.jpg"
              className="w-full h-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-24 lg:bottom-32 left-10 lg:left-24 z-20 space-y-6 max-w-[90%] lg:max-w-[50%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`info-${currentItem.id}`}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-600/20">
                Institutional Choice
              </span>
              <div className="flex items-center gap-1.5 text-zinc-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold leading-none">{(currentItem.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            
            <PretextHeadline 
              text={currentItem.title || ''} 
              fontSize={typeof window !== 'undefined' && window.innerWidth < 1024 ? 56 : 104}
              fontWeight={900}
              className="text-white mb-4"
            />
            
            <p className="text-zinc-400 text-sm lg:text-lg line-clamp-3 lg:line-clamp-2 max-w-xl font-medium leading-relaxed">
              {currentItem.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Button
              onClick={handlePlay}
              size="lg"
              className="bg-white hover:bg-zinc-200 text-black font-black px-8 py-7 rounded-2xl flex items-center gap-3 transition-all active:scale-95 group/btn"
            >
              <div className="bg-black rounded-full p-1 group-hover/btn:scale-110 transition-transform">
                <Play size={18} className="fill-white text-white" />
              </div>
              <span className="text-lg font-black">Watch Now</span>
            </Button>

            <Button
              onClick={() => openContentModal(currentItem)}
              variant="outline"
              size="lg"
              className="bg-zinc-950/40 hover:bg-zinc-900 border-white/10 hover:border-white/20 text-white font-bold px-8 py-7 rounded-2xl backdrop-blur-xl flex items-center gap-3 transition-all active:scale-95"
            >
              <Info size={20} />
              <span className="text-lg font-bold">More Details</span>
            </Button>
          </motion.div>
        </div>

        <div className="absolute top-10 right-10 z-20 flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-zinc-800"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="126"
                animate={{ strokeDashoffset: 126 - (126 * scrollingProgress) / 100 }}
                transition={{ duration: 0.5 }}
                className="text-red-600"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-zinc-500 tracking-tighter">
              {safeIndex + 1} / {displayItems.length}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 group"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-all mr-2">
              {isMuted ? 'Muted' : 'Unmuted'}
            </span>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div className="absolute bottom-12 left-10 lg:left-24 z-20 flex gap-3">
          {displayItems.map((item, i) => (
            <button
              key={item.id || i}
              onClick={() => setIndex(i)}
              aria-label={`Switch to story ${i + 1}`}
              className={cn(
                'h-1 rounded-full transition-all duration-700',
                i === safeIndex ? 'w-16 bg-red-600' : 'w-6 bg-zinc-800 hover:bg-zinc-600'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
