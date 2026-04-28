'use client';

import React, { useState, useEffect } from 'react';
import { Play, Info, Star, Volume2, VolumeX, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

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
  const [index, setIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [scrollingProgress, setScrollingProgress] = useState(0);
  const router = useRouter();
  const openContentModal = useUIStore(state => state.openContentModal);
  const getResumeData = useLocalDataStore(state => state.getResumeData);

  const currentItem = items && items.length > 0 ? items[index % items.length] : null;

  useEffect(() => {
    if (!items || items.length === 0) return;

    const duration = 12000;
    setScrollingProgress(100); // Start the CSS transition

    const timer = setTimeout(() => {
      setIndex(prev => (prev + 1) % items.length);
      setScrollingProgress(0); // Reset for next item
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [items, items.length, index]);

  if (!currentItem) return <div className="h-[85vh] w-full bg-zinc-950 animate-pulse rounded-[3rem] mx-4 my-2" />;

  const handlePlay = () => {
    if (!currentItem) return;
    const contentType =
      currentItem.type || (currentItem.seasonsList && currentItem.seasonsList.length > 0 ? 'tv' : 'movie');
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
            key={currentItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <ParallaxBackground src={currentItem.backdrop || currentItem.poster || currentItem.backdrop_path || currentItem.poster_path || '/images/hero_placeholder.jpg'} />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute inset-0 z-10 flex flex-col justify-end px-10 sm:px-16 lg:px-24 pb-24 lg:pb-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/80 font-bold tracking-[0.3em] text-[9px] uppercase">
                      Directorial Feature
                    </span>
                  </div>
                </div>

                <div className="min-h-[140px] sm:min-h-[180px] lg:min-h-[220px] flex items-center">
                  <PretextHeadline
                    text={currentItem.title}
                    fontSize={typeof window !== 'undefined' && window.innerWidth < 1024 ? 56 : 104}
                    fontWeight={900}
                    lineHeight={0.8}
                    letterSpacing="-0.05em"
                    shadow={{
                      color: 'rgba(0,0,0,0.6)',
                      blur: 40,
                      offsetX: 0,
                      offsetY: 15
                    }}
                    className="text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-xl">
                    <Star size={12} className="text-red-600 fill-red-600" />
                    <span className="text-zinc-300 text-[11px] font-bold tracking-wider uppercase">
                      {Math.round((currentItem.rating || 0) * 10)}% Quality
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-xl">
                    <Calendar size={12} className="text-zinc-500" />
                    <span className="text-zinc-400 text-[11px] font-bold tracking-wider uppercase">
                      {currentItem.releaseDate?.substring(0, 4)}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
                    Archival Grade
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 text-[10px] uppercase tracking-[0.2em] font-bold shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                    4K Master
                  </div>
                </div>

                <p className="text-zinc-400 text-lg max-w-xl line-clamp-3 leading-relaxed font-medium">
                  {currentItem.description}
                </p>

                <div className="flex flex-wrap items-center gap-5 pt-4">
                  <Button
                    size="lg"
                    className="h-16 w-full sm:w-auto px-12 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all font-bold text-lg flex items-center gap-4"
                    onClick={handlePlay}
                  >
                    <Play size={22} fill="currentColor" />
                    Play Now
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 w-full sm:w-auto px-10 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-lg flex items-center gap-4 transition-all"
                    onClick={() => openContentModal(currentItem)}
                  >
                    <Info size={22} />
                    More Details
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-12 right-12 z-30 flex items-center gap-6">
          <div className="relative flex items-center justify-center p-1 w-12 h-12">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-zinc-800"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * scrollingProgress) / 100}
                className="text-red-600 transition-all duration-&lsqb;12000ms&rsqb; ease-linear"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-zinc-500 tracking-tighter">
              {index + 1} / {Math.min(items.length, 5)}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-5 rounded-3xl bg-zinc-950/40 backdrop-blur-3xl border border-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all group flex items-center gap-3"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-all">
              {isMuted ? 'Audio Off' : 'Audio On'}
            </span>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div className="absolute bottom-12 left-10 lg:left-24 z-20 flex gap-3">
          {items.slice(0, 5).map((item, i) => (
            <button
              key={item.id}
              onClick={() => setIndex(i)}
              aria-label={`Switch to story ${i + 1}`}
              className={cn(
                'h-1 rounded-full transition-all duration-700',
                i === index ? 'w-16 bg-red-600' : 'w-6 bg-zinc-800 hover:bg-zinc-600'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
