'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Bird, Star } from 'lucide-react';
import { Hero } from '@/components/content/Hero';
import { ContentRail } from '@/components/content/ContentRail';
import { BrandBlock } from '@/components/brand/BrandBlock';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';

import { useLastWatched } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';

const currentYear = new Date().getFullYear();

const ANIME_RAILS = [
  {
    id: 'hottest_this_year',
    title: `Hottest Anime This Year 🔥`,
    fetcher: () => contentApi.getAnimeByGenre(`first_air_date_year=${currentYear}`),
  },
  { id: 'english_original', title: 'Dubbed Hits & English Originals 🎤', fetcher: () => contentApi.getEnglishAnime(1) },
  { id: 'popular', title: 'All Time Legends 🌟', fetcher: () => contentApi.getAnime(1) },
  { id: 'shonen', title: 'Shonen Power 👊', fetcher: () => contentApi.getAnimeByGenre('with_genres=10759') }, // Action/Adventure
  { id: 'simulcasts', title: 'Hot Simulcasts 🔥', fetcher: () => contentApi.getAnime(2) },
  { id: 'isekai', title: 'Isekai Worlds 🌍', fetcher: () => contentApi.getAnimeByGenre('with_keywords=210024') },
  { id: 'sol', title: 'Slice of Life 🍰', fetcher: () => contentApi.getAnimeByGenre('with_keywords=9840') },
  { id: 'dark', title: 'Dark Fantasy & Horror 🌑', fetcher: () => contentApi.getAnimeByGenre('with_keywords=209252') },
  { id: 'mecha', title: 'Mecha & Cyberpunk 🤖', fetcher: () => contentApi.getAnimeByGenre('with_keywords=10701') },
  { id: 'romance', title: 'Romance & Heartbreak 💔', fetcher: () => contentApi.getAnimeByGenre('with_genres=10749') },
  { id: 'comedy', title: 'Comedy & Gag Shows 😂', fetcher: () => contentApi.getAnimeByGenre('with_genres=35') },
  {
    id: 'supernatural',
    title: 'Supernatural & Magic ✨',
    fetcher: () => contentApi.getAnimeByGenre('with_genres=10765'),
  },
  { id: 'sports', title: 'Sports Spirit 🏀', fetcher: () => contentApi.getAnimeByGenre('with_keywords=6075') },
  { id: 'psych', title: 'Psychological Thrillers 🧠', fetcher: () => contentApi.getAnimeByGenre('with_genres=9648') },
  {
    id: 'seinen',
    title: 'Mature Seinen 🔞',
    fetcher: () => contentApi.getAnimeByGenre('with_keywords=210393&vote_average.gte=7'),
  },
  {
    id: 'movies',
    title: 'Anime Movie Night 🍿',
    fetcher: () => contentApi.discover({ with_genres: '16', sort_by: 'popularity.desc' }, 'movie'),
  },
  {
    id: 'classics',
    title: 'Timeless Classics 🏆',
    fetcher: () => contentApi.getAnimeByGenre('first_air_date.lte=2010-01-01&vote_average.gte=8'),
  },
];

export default function AnimePage() {
  const { data: anime } = useQuery({
    queryKey: ['anime', 'hero'],
    queryFn: () => contentApi.getEnglishAnime(), // Bias hero towards English-friendly content
    staleTime: 1000 * 60 * 10,
  });

  const [rails, setRails] = useState(ANIME_RAILS);
  const lastWatched = useLastWatched();
  const hydrated = useHydrated();

  useEffect(() => {
    // Hottest this year and English hits at the top, shuffle the rest
    const hottestThisYear = ANIME_RAILS[0];
    const englishHits = ANIME_RAILS[1];
    const others = [...ANIME_RAILS.slice(2)].sort(() => Math.random() - 0.5);
    setRails([hottestThisYear, englishHits, ...others]);
  }, []);

  const [visibleCount, setVisibleCount] = useState(5);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSentinelInView, setIsSentinelInView] = useState(false);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSentinelInView(entry.isIntersecting),
      { rootMargin: '400px 0px', threshold: 0.01 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount]);

  useEffect(() => {
    if (isSentinelInView && visibleCount < rails.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 3, rails.length));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isSentinelInView, visibleCount, rails.length]);

  const heroItems = anime?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-[#141414] pb-20 relative">
      {/* Vibrant Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] mix-blend-overlay" />

      <Hero items={heroItems} />
      <div className="relative z-10 -mt-12 sm:-mt-20 space-y-8 md:space-y-12 pl-4 lg:pl-12 opacity-95">
        {/* Recommendations Rail */}
        {hydrated && lastWatched && (
          <AsyncRail
            config={{
              id: 'recs',
              title: `Because You Watched ${lastWatched.title}`,
              fetcher: () => contentApi.getSimilar(lastWatched.id, lastWatched.type),
            }}
          />
        )}

        {/* Dynamic Rails with Interleaved Brand Blocks */}
        {rails.slice(0, visibleCount).map((config, index) => (
          <div key={config.id}>
            <AsyncRail config={config} />
            
            {/* Inject Brand Blocks */}
            {index === 2 && (
              <div className="py-12 pr-4 lg:pr-12">
                <BrandBlock
                  text="Your Gateway to Japan"
                  subtext="From shonen battles to slice-of-life moments, adventure awaits"
                  gradient="bg-gradient-to-r from-pink-950/40 via-rose-950/40 to-red-950/40"
                  icon={<Bird className="w-16 h-16 text-pink-500" />}
                  bgImage="https://images.unsplash.com/photo-1578632738908-4521bd8c7cd9?auto=format&fit=crop&q=60&w=1200"
                />
              </div>
            )}
            {index === 9 && (
              <div className="py-12 pr-4 lg:pr-12">
                <BrandBlock
                  text="Immerse. Dream. Believe."
                  subtext="Where art meets storytelling in the most vibrant way"
                  gradient="bg-gradient-to-r from-violet-950/40 via-fuchsia-950/40 to-pink-950/40"
                  icon={<Star className="w-16 h-16 text-violet-400" />}
                  bgImage="https://images.unsplash.com/photo-1541562232579-512a21359920?auto=format&fit=crop&q=60&w=1200"
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
                Catalyzing Neural Uplink...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface RailConfig {
  id: string;
  title: string;
  fetcher: () => Promise<Content[]>;
}

function AsyncRail({ config }: { config: RailConfig }) {
  const { data, isLoading } = useQuery<Content[]>({
    queryKey: ['rail', 'anime', config.id],
    queryFn: () => config.fetcher(),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) return <div className="h-64 bg-zinc-900/10 animate-pulse rounded-xl" />;
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return <ContentRail title={config.title} items={data} railId={config.id} />;
}
