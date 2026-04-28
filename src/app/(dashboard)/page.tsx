'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInView } from 'framer-motion';
import { CinemaMarquee } from '@/components/content/CinemaMarquee';
import { AtmosphericRail } from '@/components/content/AtmosphericRail';
import { ProximityBento } from '@/components/content/ProximityBento';
import { SmartCollections } from '@/components/home/SmartCollections';
import { CriticsChoice } from '@/components/home/CriticsChoice';
import { StudioRail } from '@/components/home/StudioRail';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { contentApi } from '@/lib/api/content';
import { useActiveProfile } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { Content } from '@/lib/types/content';
import { GENRE_MAP } from '@/lib/api/content';
import { getProviderById, getProviderBySlug } from '@/lib/constants/providers';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { cn } from '@/lib/utils';

const BrandBlock = dynamic(() => import('@/components/brand/BrandBlock').then(mod => mod.BrandBlock), {
  ssr: false,
  loading: () => <div className="h-[600px] animate-pulse bg-zinc-900 mx-10 lg:mx-24 rounded-[4rem]" />
});

interface RailConfig {
  id: string;
  title: string;
  fetcher: () => Promise<Content[]>;
  aspectRatio: 'poster' | '16:9' | '21:9' | 'landscape' | 'ultrawide';
  providerId?: string;
}

// Rails Configuration (Standardized)
const RAIL_CONFIGS: RailConfig[] = [
  { id: 'popular_tv', title: 'Global Series', fetcher: contentApi.getPopularTV, aspectRatio: '16:9' as const },
  {
    id: 'african_cinema',
    title: 'African Cinema',
    fetcher: contentApi.getAfricanMovies,
    aspectRatio: 'poster' as const,
    providerId: 'acu',
  },
  {
    id: 'netflix_originals',
    title: 'Features',
    fetcher: () => contentApi.discover({ with_networks: '213' }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'netflix',
  },
  {
    id: 'adult_swim',
    title: 'Features',
    fetcher: () => contentApi.discover({ with_networks: '80' }, 'tv'),
    aspectRatio: '16:9' as const,
    providerId: 'adult-swim',
  },
  {
    id: 'hulu_picks',
    title: 'Features',
    fetcher: () => contentApi.discover({ with_networks: '453' }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'hulu',
  },
  {
    id: 'korean_dramas',
    title: 'Korean Dramas',
    fetcher: contentApi.getKoreanDramas,
    aspectRatio: 'poster' as const,
  },
  {
    id: 'day_one_movies',
    title: 'Premiere Releases',
    fetcher: () => contentApi.getDayOneDrops('movie'),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'bangers',
    title: "Critics' Choice",
    fetcher: () => contentApi.getBangers('movie'),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'action',
    title: 'High-Octane Action',
    fetcher: () => contentApi.getByGenre(28, 'movie'),
    aspectRatio: '21:9' as const,
  },
  {
    id: 'scifi',
    title: 'Sci-Fi Picks',
    fetcher: () => contentApi.getByGenre(878, 'movie'),
    aspectRatio: '16:9' as const,
  },
  {
    id: 'anime',
    title: 'Anime Spotlight',
    fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc' }, 'tv'),
    aspectRatio: 'poster' as const,
  },
];

export default function DashboardPage() {
  const hydrated = useHydrated();
  const [visibleCount, setVisibleCount] = useState(3);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sentinelRef);

  useEffect(() => {
    if (isInView && visibleCount < RAIL_CONFIGS.length) {
      setVisibleCount(prev => prev + 2);
    }
  }, [isInView, visibleCount]);

  const activeProfile = useActiveProfile();

  const { data: trending } = useQuery<Content[]>({
    queryKey: ['trending', activeProfile?.preferences],
    queryFn: async () => {
      const baseTrending = await contentApi.getTrending(1);
      if (activeProfile?.preferences?.genres?.length || activeProfile?.preferences?.vibes?.length) {
        return contentApi.getPersonalizedMix(baseTrending, activeProfile.preferences);
      }
      return baseTrending;
    },
    enabled: hydrated,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  if (!hydrated) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 1. Cinematic Hero Section */}
      <CinemaMarquee items={trending} />

      <div className="relative z-10 -mt-32 pb-32">
        {/* 1. Home Command Center (Greeting + Pipeline + Pulse) */}
        <HomeDashboard />

        {/* 2. Studio / Brand Shortcuts */}
        <StudioRail />

        {/* 2.5 Critics Choice (S-Class Serendipity) */}
        <CriticsChoice />

        {/* 3. AI Curated Vaults */}
        <SmartCollections />

        {/* Interstitial: Proximity Bento */}
        <div className="py-12">
          <ProximityBento />
        </div>

        {/* Interstitial: The Foundry */}
        <div className="py-20">
          <Suspense fallback={<div className="h-[600px] animate-pulse bg-zinc-900 mx-10 lg:mx-24 rounded-[4rem]" />}>
            <BrandBlock
              text="Mai Foundry"
              onClick={() => document.getElementById('the-archives')?.scrollIntoView({ behavior: 'smooth' })}
              bgImage={getOptimizedImageUrl(
                'https://images.unsplash.com/photo-1574267432553-4b4628081c31',
                'landscape'
              )}
            />
          </Suspense>
        </div>

        {/* 5. Dynamic Content Rails */}
        <div className="space-y-12">
          {RAIL_CONFIGS.slice(0, visibleCount).map(config => (
            <div key={config.id} className="relative">
              <AtmosphericAsyncRail config={config} />
            </div>
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        {visibleCount < RAIL_CONFIGS.length && (
          <div ref={sentinelRef} className="h-40 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Loading more...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AtmosphericAsyncRail({ config }: { config: RailConfig }) {
  const { data, isLoading } = useQuery<Content[]>({
    queryKey: ['rail', config.id],
    queryFn: () => config.fetcher(),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const provider = config.providerId
    ? getProviderById(config.providerId) || getProviderBySlug(config.providerId)
    : null;

  if (isLoading) {
    return (
      <div className="px-10 lg:px-24 space-y-8 animate-pulse relative overflow-hidden">
        {provider && (
          <div
            className="absolute top-0 right-0 w-[400px] h-[400px] opacity-5 blur-[100px] pointer-events-none bg-[var(--brand-color)]"
            style={{ '--brand-color': provider.color } as React.CSSProperties}
          />
        )}
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-6 bg-zinc-800" />
          <div className="h-4 w-48 bg-zinc-900/50 rounded-full" />
        </div>
        <div className="flex gap-6 overflow-hidden pt-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={cn(
                'glass-card border-white/5 rounded-2xl relative overflow-hidden shrink-0',
                config.aspectRatio === '21:9' || config.aspectRatio === 'ultrawide'
                  ? 'w-[350px] md:w-[420px] aspect-[21/9]'
                  : config.aspectRatio === '16:9' || config.aspectRatio === 'landscape'
                    ? 'w-[280px] md:w-[350px] aspect-video'
                    : 'w-[160px] md:w-[200px] aspect-[2/3]'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AtmosphericRail
      title={config.title}
      items={data}
      railId={config.id}
      aspectRatio={config.aspectRatio}
      providerId={config.providerId}
    />
  );
}
