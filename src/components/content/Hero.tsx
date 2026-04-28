'use client';

import { useEffect, useState } from 'react';
import { Play, Info, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Content } from '@/lib/types/content';
import { contentApi } from '@/lib/api/content';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

import { ParallaxBackground } from './CinemaMarquee';
import { PretextHeadline } from '../Common/PretextHeadline';

interface HeroProps {
  items?: Content[];
}

export function Hero({ items = [] }: HeroProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const currentItem = items && items.length > 0 ? items[index % items.length] : null;

  // Auto-advance carousel
  useEffect(() => {
    if (!items || items.length === 0) return;

    const timer = setTimeout(() => {
      setIndex(prev => (prev + 1) % items.length);
    }, 12000);

    return () => clearTimeout(timer);
  }, [index, items, items.length]);

  // Show UI on interaction
  const handleInteraction = () => {
    if (!uiVisible) setUiVisible(true);
  };

  // Safety check: if no items, show a basic skeleton
  if (!currentItem) return <HeroSkeleton />;

  return (
    <section
      className="relative h-[50vh] sm:h-[70vh] lg:h-[85vh] w-full group mx-auto overflow-hidden"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Background Image (Base Layer) */}
          <div className="absolute inset-0">
            <ParallaxBackground src={currentItem.backdrop || '/images/hero_placeholder.jpg'} />
            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent opacity-100" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 z-20 p-6 pb-24 md:p-12 md:pb-32 lg:p-16 lg:pb-40 w-full max-w-5xl xl:max-w-6xl space-y-4 md:space-y-6 pointer-events-none">
        <AnimatePresence mode="wait">
          {uiVisible && (
            <motion.div
              key={currentItem.id + '-text'}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-6 pointer-events-auto"
            >
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                <div className="h-1 w-12 bg-red-600 rounded-full" />
                <span className="text-red-500 font-bold tracking-[0.3em] text-xs uppercase">Trending Now</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="max-w-5xl"
              >
                <PretextHeadline 
                  text={currentItem.title}
                  fontSize={80}
                  fontWeight={900}
                  maxWidth={1200}
                  fontFamily="Outfit, sans-serif"
                  shadow={{
                    color: 'rgba(0,0,0,0.6)',
                    blur: 40,
                    offsetX: 0,
                    offsetY: 15
                  }}
                  className="tracking-tighter leading-[0.9] uppercase"
                />
              </motion.div>

              <div className="flex items-center gap-3 text-sm md:text-base font-medium text-zinc-300">
                <span className="flex items-center gap-1 text-green-400 font-bold">
                  <Star size={14} fill="currentColor" />
                  {Math.round((currentItem.rating || 0) * 10)}% Match
                </span>
                <span>•</span>
                <span>{currentItem.releaseDate?.substring(0, 4)}</span>
                <span>•</span>
                <span className="uppercase tracking-widest text-xs border border-zinc-600 px-2 py-0.5 rounded text-zinc-400 bg-zinc-900/40">
                  {currentItem.type === 'tv' ? 'Series' : 'Movie'}
                </span>
              </div>

              <motion.p
                className="hidden sm:block text-zinc-100 text-base md:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-lg line-clamp-3 text-shadow-sm opacity-90"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {currentItem.description}
              </motion.p>

              <motion.div
                className="flex items-center gap-4 pt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.div
                  className="cursor-pointer"
                  animate={isNavigating ? { scale: [1, 0.95, 1], opacity: [1, 0.7, 1] } : {}}
                  transition={isNavigating ? { repeat: Infinity, duration: 0.6, ease: "easeInOut" } : {}}
                  onClick={async () => {
                    if (isNavigating) return;
                    setIsNavigating(true);
                    router.push(`/watch?id=${String(currentItem.id).replace('tmdb_', '')}&type=${currentItem.type}`);
                  }}
                  onMouseEnter={() => {
                    queryClient.prefetchQuery({
                      queryKey: ['content', 'details', String(currentItem.id), currentItem.type],
                      queryFn: () => contentApi.getDetails(currentItem.id, currentItem.type),
                      staleTime: 10 * 60 * 1000,
                    });
                  }}
                >
                  <Button
                    size="lg"
                    className="pl-6 sm:pl-10 pr-8 sm:pr-12 h-12 sm:h-14 md:h-16 text-sm sm:text-lg md:text-xl font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-xl shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 duration-300"
                  >
                    <Play size={20} fill="currentColor" className="sm:mr-3" />
                    Watch Now
                  </Button>
                </motion.div>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 sm:h-14 md:h-16 px-6 sm:px-10 text-sm sm:text-lg md:text-xl font-medium bg-zinc-800/20 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/30 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-2xl"
                >
                  <Info size={20} className="sm:mr-3" />
                  Details
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Carousel Indicators */}
      <div
        className={cn(
          'absolute right-4 sm:right-8 bottom-24 sm:bottom-48 flex flex-col gap-1.5 sm:gap-2 z-30 transition-opacity duration-1000',
          uiVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={e => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all duration-300 shadow shadow-black/50',
              i === index ? 'h-6 bg-white' : 'bg-white/30 hover:bg-white/60'
            )}
          />
        ))}
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className="relative h-[70vh] w-full rounded-2xl overflow-hidden mx-auto bg-zinc-900 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
    </section>
  );
}
