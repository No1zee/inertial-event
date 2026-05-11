'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Clapperboard, Popcorn } from 'lucide-react';
import { Hero } from '@/components/content/Hero';
import { AtmosphericAsyncRail } from '@/components/content/AtmosphericAsyncRail';
import { BrandBlock } from '@/components/brand/BrandBlock';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';

import { useLastWatched, useActiveProfile } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { motion, AnimatePresence } from 'framer-motion';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

const MOVIE_RAILS = [
  // Fresh & New
  { id: 'day1', title: 'Day 1 Drops', fetcher: () => contentApi.getDayOneDrops('movie') },
  { id: 'fresh', title: 'Freshly Baked', fetcher: () => contentApi.getFresh('movie') },
  { id: 'trending', title: 'Trending Movies', fetcher: () => contentApi.getTrending(Math.floor(Math.random() * 3) + 1) },
  // Curated Collections
  { id: 'bangers', title: 'Certified Bangers', fetcher: () => contentApi.getBangers('movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'underrated', title: 'Hidden Gems', fetcher: () => contentApi.getUnderrated('movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'classics', title: 'Timeless Classics', fetcher: () => contentApi.getClassics('movie', Math.floor(Math.random() * 5) + 1) },
  {
    id: 'acclaimed',
    title: 'Critically Acclaimed',
    fetcher: () => contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': '3000', page: Math.floor(Math.random() * 3) + 1 }, 'movie'),
  },
  // Action & Adventure
  { id: 'adrenaline', title: 'High Octane Action', fetcher: () => contentApi.getByGenre(28, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'adventure', title: 'Epic Adventures', fetcher: () => contentApi.getByGenre(12, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'thriller', title: 'Edge of Your Seat', fetcher: () => contentApi.getByGenre(53, 'movie', Math.floor(Math.random() * 5) + 1) },
  {
    id: 'cbm',
    title: 'Superheroes & Villains',
    fetcher: () => contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc', page: Math.floor(Math.random() * 5) + 1 }, 'movie'),
  },
  // Sci-Fi & Fantasy
  { id: 'scifi', title: 'Sci-Fi & Fantasy', fetcher: () => contentApi.getByGenre(878, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'fantasy', title: 'Fantasy Worlds', fetcher: () => contentApi.getByGenre(14, 'movie', Math.floor(Math.random() * 5) + 1) },
  // Horror & Mystery
  { id: 'horror', title: 'Late Night Horror', fetcher: () => contentApi.getByGenre(27, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'mystery', title: 'Mystery & Suspense', fetcher: () => contentApi.getByGenre(9648, 'movie', Math.floor(Math.random() * 5) + 1) },
  // Comedy & Romance
  { id: 'comedy', title: 'Comedy Hits', fetcher: () => contentApi.getByGenre(35, 'movie', Math.floor(Math.random() * 5) + 1) },
  {
    id: 'romcom',
    title: 'Rom-Com Favorites',
    fetcher: () => contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc', page: Math.floor(Math.random() * 5) + 1 }, 'movie'),
  },
  { id: 'romance', title: 'Romantic Picks', fetcher: () => contentApi.getByGenre(10749, 'movie', Math.floor(Math.random() * 5) + 1) },
  // Drama & Prestige
  { id: 'drama', title: 'Award-Winning Drama', fetcher: () => contentApi.getByGenre(18, 'movie', Math.floor(Math.random() * 5) + 1) },
  {
    id: 'a24',
    title: 'A24 Indie Gems',
    fetcher: () => contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc', page: Math.floor(Math.random() * 3) + 1 }, 'movie'),
  },
  {
    id: 'biography',
    title: 'True Stories',
    fetcher: () => contentApi.discover({ with_genres: '99,36', sort_by: 'vote_average.desc', page: Math.floor(Math.random() * 3) + 1 }, 'movie'),
  },
  // Animation & Family
  { id: 'animation', title: 'Animated Classics', fetcher: () => contentApi.getByGenre(16, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'family', title: 'Family Movie Night', fetcher: () => contentApi.getByGenre(10751, 'movie', Math.floor(Math.random() * 5) + 1) },
  // Documentary
  { id: 'docu', title: 'Mind-Blowing Docs', fetcher: () => contentApi.getByGenre(99, 'movie', Math.floor(Math.random() * 5) + 1) },
  // Additional Genres
  { id: 'crime', title: 'Crime & Gangs', fetcher: () => contentApi.getByGenre(80, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'war', title: 'War & History', fetcher: () => contentApi.getByGenre(10752, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'western', title: 'Wild West', fetcher: () => contentApi.getByGenre(37, 'movie', Math.floor(Math.random() * 5) + 1) },
  { id: 'music', title: 'Music & Performance', fetcher: () => contentApi.getByGenre(10402, 'movie', Math.floor(Math.random() * 5) + 1) },
  // Mood & Length
  { id: 'short', title: 'Quick Watch (<100m)', fetcher: () => contentApi.getShortAndSweet() },
  { id: 'feelgood', title: 'Feel Good Movies', fetcher: () => contentApi.getFeelGood() },
];

export default function MoviesPage() {
  const { data: heavyHitters } = useQuery<Content[]>({
    queryKey: ['hero', 'movie-heavy-hitters'],
    queryFn: () => contentApi.getHeroHeavyHitters('movie'),
    staleTime: 1000 * 60 * 30,
  });

  const [rails, setRails] = useState(MOVIE_RAILS);
  const lastWatched = useLastWatched();
  const activeProfile = useActiveProfile();
  const hydrated = useHydrated();

  useEffect(() => {
    // Keep "Day 1" (first index) at top, shuffle the rest
    const first = MOVIE_RAILS[0];
    const others = [...MOVIE_RAILS.slice(1)];
    const shuffled = others.sort(() => Math.random() - 0.5);
    setRails([first, ...shuffled]);
  }, []);

  const [visibleCount, setVisibleCount] = useState(2);
  const { ref: sentinelRef, inView: isSentinelInView } = useInView({
    rootMargin: '600px 0px',
    threshold: 0.1,
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSentinelInView && visibleCount < rails.length) {
      // Directorial Pacing: stagger the loading of new rails to prevent DOM thrashing
      timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 2, rails.length));
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSentinelInView, visibleCount, rails.length]);

  const heroItems = heavyHitters?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-40 relative overflow-x-hidden">
      {/* Cinematic Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/dynamic-style.png')] mix-blend-overlay" />

      {/* Page Header (Aurelian Glass) */}
      <div className="relative z-20 pt-32 px-10 lg:px-24 mb-12 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
              <Clapperboard size={12} className="text-zinc-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                Movies / {activeProfile?.name || 'Guest'}
              </span>
            </div>
            <div className="h-[1px] w-20 bg-zinc-800/50" />
          </div>
          <PretextHeadline
            text="Feature Films"
            fontSize={72}
            fontWeight={900}
            letterSpacing="-0.04em"
            className="text-white opacity-90"
          />
        </motion.div>
      </div>

      <Hero items={heroItems} />

      <div className="relative z-10 -mt-32 space-y-20 opacity-95">
        {/* Recommendations Rail */}
        <AnimatePresence>
          {hydrated && lastWatched && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <AtmosphericAsyncRail
                config={{
                  id: 'recs',
                  title: `Because You Watched ${lastWatched.title}`,
                  fetcher: () => contentApi.getSimilar(lastWatched.id, lastWatched.type),
                }}
                type="movie-recs"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Rails with Interleaved Brand Blocks */}
        <div className="space-y-24">
          {rails.slice(0, visibleCount).map((config, index) => (
            <motion.div 
              key={config.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: index % 3 * 0.1 }}
            >
              <AtmosphericAsyncRail config={config} type="movie" />
              
              {/* Inject Brand Blocks at specific intervals */}
              {index === 4 && (
                <div className="py-20 px-10 lg:px-24">
                  <BrandBlock
                    text="The Big Screen Experience"
                    subtext="Cinema-quality entertainment, delivered to your screen"
                    gradient="bg-linear-to-r from-yellow-950/40 via-red-950/40 to-orange-950/40"
                    icon={<Clapperboard className="w-16 h-16 text-yellow-500" />}
                    bgImage="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=60&w=1200"
                  />
                </div>
              )}
              {index === 14 && (
                <div className="py-20 px-10 lg:px-24">
                  <BrandBlock
                    text="Movie Night, Every Night"
                    subtext="From blockbusters to indie gems, your perfect movie awaits"
                    gradient="bg-linear-to-r from-purple-950/40 via-pink-950/40 to-red-950/40"
                    icon={<Popcorn className="w-16 h-16 text-purple-500" />}
                    bgImage="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=60&w=1200"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Sentinel */}
        {visibleCount < rails.length && (
          <div ref={sentinelRef} className="h-64 w-full flex items-center justify-center border-t border-white/5 bg-linear-to-b from-transparent to-zinc-900/10">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border border-white/5 rounded-full scale-125 animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse">
                  Loading More
                </span>
                <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                  Section {visibleCount} / {rails.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

