'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Info } from 'lucide-react';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PretextHeadline } from '../Common/PretextHeadline';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { useRouter } from 'next/navigation';
import { Content } from '@/lib/types/content';
import { getOptimizedImageUrl } from '@/lib/utils/image';

const DIRECTORIAL_SUGGESTIONS = [
  "A masterclass in non-linear storytelling and rhythmic pacing.",
  "Visual purity at its highest form, pushing the boundaries of frame composition.",
  "Directorial restraint creates immense tension in this institutional-grade masterpiece.",
  "A chromatic odyssey that redefines modern genre boundaries.",
  "S-Class cinematography meeting directorially-driven motion framework.",
  "An exploration of the human condition through an S-Tier visual lens.",
  "Architectural-grade set design paired with perfect cinematic flow."
];

export function ProximityBento() {
  const isHydrated = useHydrated();
  const router = useRouter();
  const [rotationIndex, setRotationIndex] = useState(0);

  const { data: bangers } = useQuery<Content[]>({
    queryKey: ['spotlight_bangers'],
    queryFn: () => contentApi.getBangers('movie', 1),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    // Determine the current 20-minute block since epoch
    const updateIndex = () => {
      const now = Date.now();
      const twentyMinutes = 20 * 60 * 1000;
      const index = Math.floor(now / twentyMinutes);
      setRotationIndex(index);
    };

    updateIndex();
    const interval = setInterval(updateIndex, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const spotlight = useMemo(() => {
    if (!bangers || bangers.length === 0) return null;
    return bangers[rotationIndex % bangers.length];
  }, [bangers, rotationIndex]);

  const suggestion = useMemo(() => {
    return DIRECTORIAL_SUGGESTIONS[rotationIndex % DIRECTORIAL_SUGGESTIONS.length];
  }, [rotationIndex]);

  if (!isHydrated || !spotlight) return null;


  return (
    <section className="px-10 lg:px-24 mb-24">
      <header className="flex items-center gap-4 mb-10">
        <div className="h-[1px] flex-1 bg-white/[0.05]" />
        <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em] flex items-center gap-3">
          <Sparkles size={14} className="text-amber-500 animate-pulse" />
          Spotlight
        </h2>
        <div className="h-[1px] flex-1 bg-white/[0.05]" />
      </header>

      <div className="relative h-[600px] w-full rounded-[3rem] overflow-hidden group/spotlight bg-zinc-900/50 border border-white/10">
        {/* Background Scan Effect */}
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src={getOptimizedImageUrl(spotlight.backdrop || spotlight.backdrop_path, 'original')}
            alt={spotlight.title}
            fill
            className="object-cover opacity-40 group-hover/spotlight:scale-105 transition-transform [transition-duration:2s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          {/* Cinematic Scan Line */}
          <motion.div 
            className="absolute inset-y-0 w-[1px] bg-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.5)] z-10"
            animate={{ left: ['0%', '100%', '0%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative inset-0 z-20 h-full p-16 flex flex-col justify-end max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                Director&apos;s Spotlight / 9.8 Rating
              </div>
              <div className="h-[1px] w-12 bg-white/10" />
            </div>

            <PretextHeadline
              text={spotlight.title}
              fontSize={72}
              fontWeight={900}
              letterSpacing="-0.05em"
              className="text-white uppercase"
            />

            <div className="space-y-4">
              <p className="text-xl text-zinc-400 font-medium leading-relaxed italic max-w-2xl">
                &quot;{suggestion}&quot;
              </p>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-xl line-clamp-2">
                {spotlight.description || spotlight.overview}
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <button 
                onClick={() => router.push(`/watch?id=${spotlight.id}&type=${spotlight.type}`)}
                className="h-16 px-10 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
              >
                <Play size={20} fill="currentColor" />
                Watch
              </button>
              <button 
                onClick={() => document.getElementById('the-archives')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
              >
                <Info size={20} />
                Open Archives
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Rating Badge */}
        <div className="absolute top-16 right-16 z-30 hidden lg:block">
           <div className="w-32 h-32 rounded-full border border-amber-500/20 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Critique</span>
              <span className="text-4xl font-black text-white">S+</span>
              <div className="h-[1px] w-8 bg-amber-500/50 mt-1" />
           </div>
        </div>
      </div>
    </section>
  );
}
