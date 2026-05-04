'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Tv2, Zap } from 'lucide-react';
import { Hero } from '@/components/content/Hero';
import { AtmosphericAsyncRail } from '@/components/content/AtmosphericAsyncRail';
import { BrandBlock } from '@/components/brand/BrandBlock';
import { contentApi } from '@/lib/api/content';
import { type Content } from '@/lib/types/content';

import { useLastWatched } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';

const TV_RAILS = [
  // Fresh & New
  { id: 'day1', title: 'Day 1 Drops 💧', fetcher: () => contentApi.getDayOneDrops('tv') },
  { id: 'fresh', title: 'Fresh Seasons 🔥', fetcher: () => contentApi.getFresh('tv') },
  { id: 'popular', title: 'Most Popular Series', fetcher: () => contentApi.getPopularTV(Math.floor(Math.random() * 3) + 1) },
  // Curated Collections
  { id: 'bangers', title: 'Binge-Worthy Bangers 💯', fetcher: () => contentApi.getBangers('tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'underrated', title: 'Underrated Series 💎', fetcher: () => contentApi.getUnderrated('tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'classics', title: 'TV Hall of Fame 🏆', fetcher: () => contentApi.getClassics('tv', Math.floor(Math.random() * 5) + 1) },
  {
    id: 'acclaimed',
    title: 'Critically Acclaimed',
    fetcher: () => contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': '1000', page: Math.floor(Math.random() * 3) + 1 }, 'tv'),
  },
  // Drama & Prestige
  { id: 'drama', title: 'Bingeable Dramas 🎭', fetcher: () => contentApi.getByGenre(18, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'mystery', title: 'Mystery & Suspense', fetcher: () => contentApi.getByGenre(9648, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'war', title: 'War & History', fetcher: () => contentApi.getByGenre(10768, 'tv', Math.floor(Math.random() * 5) + 1) },
  // Comedy & Sitcoms
  { id: 'comedy', title: 'Sitcom Staples 😂', fetcher: () => contentApi.getByGenre(35, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'family', title: 'Family Shows', fetcher: () => contentApi.getByGenre(10751, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'kids', title: 'Kids & Family', fetcher: () => contentApi.getByGenre(10762, 'tv', Math.floor(Math.random() * 5) + 1) },
  // Crime & Action
  { id: 'crime', title: 'Crime & Punishment 🕵️', fetcher: () => contentApi.getByGenre(80, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'action', title: 'Action-Packed Series', fetcher: () => contentApi.getByGenre(10759, 'tv', Math.floor(Math.random() * 5) + 1) },
  // Sci-Fi & Fantasy
  { id: 'scifi', title: 'Worlds Beyond 👽', fetcher: () => contentApi.getByGenre(10765, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'animation', title: 'Animated Series', fetcher: () => contentApi.getByGenre(16, 'tv', Math.floor(Math.random() * 5) + 1) },
  {
    id: 'anime',
    title: 'Anime Hits',
    fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc', page: Math.floor(Math.random() * 5) + 1 }, 'tv'),
  },
  // Reality & Documentary
  { id: 'reality', title: 'Reality Bites 📺', fetcher: () => contentApi.getByGenre(10764, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'docu', title: 'Real Stories 📚', fetcher: () => contentApi.getByGenre(99, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'talk', title: 'Talk Shows & News', fetcher: () => contentApi.getByGenre(10767, 'tv', Math.floor(Math.random() * 5) + 1) },
  // International
  { id: 'soap', title: 'Soap Opera', fetcher: () => contentApi.getByGenre(10766, 'tv', Math.floor(Math.random() * 5) + 1) },
  { id: 'western', title: 'Western Series', fetcher: () => contentApi.getByGenre(37, 'tv', Math.floor(Math.random() * 5) + 1) },
];

export default function TVShowsPage() {
  const { data: heavyHitters } = useQuery<Content[]>({
    queryKey: ['hero', 'tv-heavy-hitters'],
    queryFn: () => contentApi.getHeroHeavyHitters('tv'),
    staleTime: 1000 * 60 * 30,
  });

  const [rails, setRails] = useState(TV_RAILS);
  const lastWatched = useLastWatched();
  const hydrated = useHydrated();

  useEffect(() => {
    // Keep "Day 1" at top
    const first = TV_RAILS[0];
    const others = [...TV_RAILS.slice(1)];
    const shuffled = others.sort(() => Math.random() - 0.5);
    setRails([first, ...shuffled]);
  }, []);

  const [visibleCount, setVisibleCount] = useState(5);
  const { ref: sentinelRef, inView: isSentinelInView } = useInView({
    rootMargin: '600px 0px',
    threshold: 0.1,
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSentinelInView && visibleCount < rails.length) {
      timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 3, rails.length));
      }, 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSentinelInView, visibleCount, rails.length]);

  const heroItems = heavyHitters?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-[#141414] pb-20 relative">
      {/* Grid/Digital Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />

      <Hero items={heroItems} />
      <div className="relative z-10 -mt-20 space-y-12 pl-4 lg:pl-12 opacity-95">
        {/* Recommendations Rail */}
        {hydrated && lastWatched && (
          <AtmosphericAsyncRail
            config={{
              id: 'recs',
              title: `Because You Watched ${lastWatched.title}`,
              fetcher: () => contentApi.getSimilar(lastWatched.id, lastWatched.type),
            }}
            type="tv-recs"
          />
        )}

        {/* Dynamic Rails with Interleaved Brand Blocks */}
        {rails.slice(0, visibleCount).map((config, index) => (
          <div key={config.id}>
            <AtmosphericAsyncRail config={config} type="tv" />
            
            {/* Inject Brand Blocks */}
            {index === 3 && (
              <div className="py-12 pr-4 lg:pr-12">
                <BrandBlock
                  text="Your Next Obsession"
                  subtext="Epic series. Unforgettable characters. Endless episodes."
                  gradient="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40"
                  icon={<Tv2 className="w-16 h-16 text-blue-500" />}
                  bgImage="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=60&w=1200"
                />
              </div>
            )}
            {index === 11 && (
              <div className="py-12 pr-4 lg:pr-12">
                <BrandBlock
                  text="Binge. Repeat. Discover."
                  subtext="From sitcoms to epics, your series journey starts here"
                  gradient="bg-gradient-to-r from-cyan-950/40 via-teal-950/40 to-emerald-950/40"
                  icon={<Zap className="w-16 h-16 text-cyan-500" />}
                  bgImage="https://images.unsplash.com/photo-1461151351179-8143666f09ad?auto=format&fit=crop&q=60&w=1200"
                />
              </div>
            )}
          </div>
        ))}

        {/* Sentinel */}
        {visibleCount < rails.length && (
          <div ref={sentinelRef} className="h-40 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Synchronizing Archives...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
