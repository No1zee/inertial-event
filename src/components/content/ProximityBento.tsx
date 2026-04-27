'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/hooks/useHydrated';
import { ContentCard } from './ContentCard';
import { Content } from '@/lib/types/content';

export function ProximityBento() {
  const watchHistory = useLocalDataStore(state => state.watchHistory);
  const isHydrated = useHydrated();

  if (!isHydrated) return null;

  // Simulated data for Sanctuary demonstration if history is empty
  const MOCK_PROXIMITY: Content[] = [
    {
      id: '533535',
      title: 'Deadpool & Wolverine',
      backdrop: '/yDHYT7mUMvYVE77EPJuWp8oqkYV.jpg',
      poster: '/8cdWjvZQUmOZaba7SEWGBhno9mE.jpg',
      type: 'movie',
      description:
        'A weary Wolverine finds himself recovering from his injuries when he comes across a loudmouth Deadpool.',
      genres: ['Action', 'Comedy'],
      status: 'completed',
      isAdult: false,
      rating: 8.2,
      releaseDate: '2024-07-24',
    },
    {
      id: '93405',
      title: 'Squid Game',
      backdrop: '/zzWp2vI77KscNnNis96YAnpAsY0.jpg',
      poster: '/d86O78988DAr56S79rWv36N2p9H.jpg',
      type: 'tv',
      description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games.",
      genres: ['Drama', 'Thriller'],
      status: 'ongoing',
      isAdult: true,
      rating: 7.8,
      releaseDate: '2021-09-17',
    },
  ];

  const continueWatching = watchHistory
    .filter(item => !item.completed && (item.poster || item.backdrop || item.poster_path || item.backdrop_path))
    .slice(0, 2)
    .map(
      item =>
        ({
          id: item.contentId,
          title: item.title,
          poster: item.poster || item.poster_path || '',
          backdrop: item.backdrop || item.backdrop_path || '',
          type: item.type,
          description: '', // Will be hydrated by modal if needed
          genres: [],
          status: 'completed',
          isAdult: false,
          rating: 0,
          releaseDate: '',
        }) as Content
    );

  const inProgress = continueWatching.length > 0 ? continueWatching : MOCK_PROXIMITY;

  return (
    <section className="px-10 lg:px-24 mb-24">
      <header className="flex items-center gap-4 mb-10">
        <div className="h-[1px] flex-1 bg-white/[0.05]" />
        <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em] flex items-center gap-3">
          <Sparkles size={14} className="text-red-600 animate-pulse" />
          Proximity Intelligence
        </h2>
        <div className="h-[1px] flex-1 bg-white/[0.05]" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[800px] lg:h-[450px]">
        {/* Primary Intelligence Node (Resume Playback) */}
        <div className="lg:col-span-8 h-[450px] lg:h-full">
          <ContentCard item={inProgress[0]} aspectRatio="fill" className="rounded-[2.5rem] border-white/10" />
        </div>

        {/* Secondary Intelligence Node */}
        <div className="lg:col-span-4 h-[350px] lg:h-full">
          {inProgress[1] ? (
            <ContentCard item={inProgress[1]} aspectRatio="fill" className="rounded-[2.5rem] border-white/10" />
          ) : (
            <div className="h-full rounded-[2.5rem] bg-white/[0.01] flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-600 mb-4">
                <Sparkles size={20} />
              </div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[140px]">
                Advanced insights pending more activity
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
