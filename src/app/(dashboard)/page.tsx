'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { CinemaMarquee } from '@/components/content/CinemaMarquee';
import { AtmosphericRail } from '@/components/content/AtmosphericRail';
import { AtmosphericAsyncRail } from '@/components/content/AtmosphericAsyncRail';
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
    title: 'Netflix Originals',
    fetcher: () => contentApi.discover({ with_networks: '213' }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'netflix',
  },
  {
    id: 'adult_swim',
    title: 'Adult Swim Vault',
    fetcher: () => contentApi.discover({ with_networks: '80' }, 'tv'),
    aspectRatio: '16:9' as const,
    providerId: 'adult-swim',
  },
  {
    id: 'hulu_picks',
    title: 'Hulu Originals',
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
  {
    id: 'documentary',
    title: 'Truth in Vision',
    fetcher: () => contentApi.getByGenre(99, 'movie'),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'comedy',
    title: 'Infinite Laughs',
    fetcher: () => contentApi.getByGenre(35, 'movie'),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'horror',
    title: 'Late Night Thrills',
    fetcher: () => contentApi.getByGenre(27, 'movie'),
    aspectRatio: 'poster' as const,
  },
];

import { useMemo } from 'react';

export default function DashboardPage() {
  const hydrated = useHydrated();
  const activeProfile = useActiveProfile();
  const [visibleCount, setVisibleCount] = useState(4);
  // sentinelRef is now handled by useInView hook below
  
  const sortedRails = useMemo(() => {
    if (!hydrated || !activeProfile?.preferences) return RAIL_CONFIGS;
    
    const { genreWeights, vibes } = activeProfile.preferences;
    const weights = genreWeights || {};
    const activeVibes = vibes || [];
    
    // Mapping between onboarding IDs and rail IDs
    const ID_MAPPING: Record<string, string> = {
      'sci-fi': 'scifi',
      'action': 'action',
      'horror': 'horror',
      'comedy': 'comedy',
      'drama': 'popular_tv', 
      'documentary': 'documentary',
      'anime': 'anime',
      'k-drama': 'korean_dramas',
      'fantasy': 'scifi', // Map fantasy to scifi for now
    };

    // Vibe to Rail boosts
    const VIBE_BOOSTS: Record<string, string[]> = {
      'high-energy': ['action', 'scifi', 'day_one_movies'],
      'chilled': ['comedy', 'family', 'anime'],
      'dark-gritty': ['horror', 'action', 'korean_dramas'],
      'epic': ['scifi', 'african_cinema', 'netflix_originals'],
      'thought-provoking': ['documentary', 'popular_tv', 'hulu_picks'],
      'lighthearted': ['comedy', 'anime', 'family'],
    };

    return [...RAIL_CONFIGS].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 1. Genre Weights (Direct or Mapped)
      Object.entries(ID_MAPPING).forEach(([genreId, railId]) => {
        if (a.id === railId) scoreA += (weights[genreId] || 0) * 10;
        if (b.id === railId) scoreB += (weights[genreId] || 0) * 10;
      });

      // 2. Vibe Boosts
      activeVibes.forEach(vibeId => {
        if (VIBE_BOOSTS[vibeId]?.includes(a.id)) scoreA += 5;
        if (VIBE_BOOSTS[vibeId]?.includes(b.id)) scoreB += 5;
      });

      // 3. Fallback to default weights
      scoreA += weights[a.id] || 0;
      scoreB += weights[b.id] || 0;
      
      return scoreB - scoreA;
    });
  }, [hydrated, activeProfile?.preferences]);

  const { ref: sentinelRef, inView: isSentinelInView } = useInView({
    rootMargin: '600px 0px',
    threshold: 0.1,
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[InfiniteScroll] Update:', { 
        isSentinelInView, 
        visibleCount, 
        total: sortedRails.length,
        canLoadMore: visibleCount < sortedRails.length 
      });
    }
  }, [isSentinelInView, visibleCount, sortedRails.length]);

  // Only increment if we're in view AND not already at the end
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isSentinelInView && visibleCount < sortedRails.length) {
      // Small delay to prevent rapid-fire state updates
      timer = setTimeout(() => {
        setVisibleCount(prev => {
          const next = Math.min(prev + 2, sortedRails.length);
          return next;
        });
      }, 200);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSentinelInView, visibleCount, sortedRails.length]);

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
          {sortedRails.slice(0, visibleCount).map(config => (
            <div key={config.id} className="relative">
              <AtmosphericAsyncRail config={config} />
            </div>
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        {visibleCount < sortedRails.length && (
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
