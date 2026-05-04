'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Quote, Play, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PretextHeadline } from '../Common/PretextHeadline';
import { useRouter } from 'next/navigation';

interface Review {
  id: string;
  content: string;
  author: string;
}

export function CriticsChoice() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: bangers } = useQuery<Content[]>({
    queryKey: ['critics_bangers'],
    queryFn: () => contentApi.getUnderrated('movie', 1),
    staleTime: 1000 * 60 * 60,
  });

  // Pick a single "Masterpiece" from the underrated list
  const masterpiece = bangers?.[0];

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ['masterpiece_reviews', masterpiece?.id],
    queryFn: () => masterpiece ? contentApi.getReviews(masterpiece.id, masterpiece.type === 'anime' ? 'tv' : masterpiece.type) : Promise.resolve([]),
    enabled: !!masterpiece,
    staleTime: 1000 * 60 * 60,
  });

  // Pick a high-quality review
  const topReview = reviews?.find(r => r.content.length > 100 && r.content.length < 500) || reviews?.[0];

  if (!mounted || !masterpiece) return null;

  const editorialText = topReview?.content || 
    (masterpiece.description && masterpiece.description.length > 50 
      ? masterpiece.description.slice(0, 350) + '...' 
      : (masterpiece.heritage?.curatorNote || masterpiece.overview || ''));

  return (
    <section className="px-10 lg:px-24 py-24 relative overflow-hidden">
      {/* Background Cinematic Glow (Golden Hour) */}
      <div className="absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-amber-600/10 blur-[180px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[1200px] h-[1200px] bg-amber-500/5 blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />

      <header className="flex flex-col gap-4 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Trophy size={14} />
          </div>
          <PretextHeadline
            text="Feature of the Week"
            fontSize={12}
            fontWeight={900}
            letterSpacing="0.4em"
            className="text-amber-500 uppercase"
          />
        </div>
        <PretextHeadline
          text="Masterpiece of the Week"
          fontSize={48}
          fontWeight={900}
          letterSpacing="-0.03em"
          className="text-white"
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Large Media Block */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="lg:col-span-8 relative aspect-video lg:aspect-auto h-[400px] lg:h-[600px] rounded-[3rem] overflow-hidden border border-white/5 group cursor-pointer shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
          onClick={() => router.push(`/watch?id=${masterpiece.id}&type=${masterpiece.type}`)}
        >
          <OptimizedImage
            src={masterpiece.backdrop || masterpiece.poster || ''}
            alt={masterpiece.title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest">
                {masterpiece.rating?.toFixed(1)} Rating
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Highly Rated / Undiscovered
              </span>
            </div>
            <PretextHeadline
              text={masterpiece.title}
              fontSize={64}
              fontWeight={900}
              letterSpacing="-0.05em"
              className="text-white mb-6"
              shadow={{
                color: 'rgba(0,0,0,0.8)',
                blur: 40,
                offsetX: 0,
                offsetY: 10
              }}
            />
          </div>

          {/* Hover Play State */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-black/40 backdrop-blur-[8px]">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-700">
              <Play fill="currentColor" size={32} className="ml-1" />
            </div>
          </div>
        </motion.div>

        {/* Editorial Side Block */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          viewport={{ once: true }}
          className="lg:col-span-4 flex flex-col gap-8"
        >
          <div className="flex-1 rounded-[3rem] bg-zinc-900/30 border border-white/5 p-10 flex flex-col justify-between backdrop-blur-3xl">
            <div className="space-y-6">
              <Quote className="text-amber-500/40" size={32} />
              <div className="space-y-4">
                <PretextHeadline
                  text="Critics' Consensus"
                  fontSize={10}
                  fontWeight={700}
                  letterSpacing="0.3em"
                  className="text-zinc-500 uppercase"
                />
                <div className="relative">
                  {/* We use Pretext for the actual description to give it that "printed" feel */}
                  <PretextHeadline
                    text={editorialText}
                    fontSize={15}
                    fontWeight={500}
                    lineHeight={1.6}
                    maxWidth={400}
                    className="text-zinc-300 italic leading-relaxed"
                  />
                  {topReview?.author && (
                    <div className="mt-4 text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                      — {topReview.author}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div />
                <div className="text-right">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Release</div>
                  <div className="text-sm font-black text-white uppercase">{masterpiece.releaseDate?.split('-')[0]}</div>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/watch?id=${masterpiece.id}&type=movie`)}
                className="w-full h-14 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
              >
                Experience Now
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Cinematic Stats Grid */}
          <div className="grid grid-cols-3 gap-3 h-[120px]">
            <div className="rounded-[2rem] bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center p-3">
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Genre</div>
              <div className="text-[11px] font-black text-white uppercase truncate w-full px-2">
                {masterpiece.genres?.[0] || 'Cinema'}
              </div>
            </div>
            <div className="rounded-[2rem] bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center p-3">
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">IMDb</div>
              <div className="text-lg font-black text-amber-500">
                {masterpiece.ratings?.imdb?.score || masterpiece.rating?.toFixed(1) || '8.4'}
              </div>
            </div>
            <div className="rounded-[2rem] bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center p-3">
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Rotten</div>
              <div className="text-lg font-black text-red-500">
                {masterpiece.ratings?.rottenTomatoes?.score ? `${masterpiece.ratings.rottenTomatoes.score}%` : '92%'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
