'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { CinemaMarquee } from '@/components/content/CinemaMarquee';
import { AtmosphericAsyncRail } from '@/components/content/AtmosphericAsyncRail';
import { ProximityBento } from '@/components/content/ProximityBento';
import { SmartCollections } from '@/components/home/SmartCollections';
import { CriticsChoice } from '@/components/home/CriticsChoice';
import { StudioRail } from '@/components/home/StudioRail';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { UpcomingPreviews } from '@/components/home/UpcomingPreviews';
import { PersonalLibrary } from '@/components/home/PersonalLibrary';
import { contentApi } from '@/lib/api/content';
import { useActiveProfile } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { Content } from '@/lib/types/content';
import { getOptimizedImageUrl } from '@/lib/utils/image';

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
  playTrailerOnClick?: boolean;
}

// Rails Configuration (Standardized)
const RAIL_CONFIGS: RailConfig[] = [
  { id: 'popular_tv', title: 'Global Series', fetcher: () => contentApi.getPopularTV(Math.floor(Math.random() * 100) + 1), aspectRatio: '16:9' as const },
  {
    id: 's_class_bangers',
    title: "Director's Cut",
    fetcher: () => contentApi.getBangers('movie', Math.floor(Math.random() * 20) + 1),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'african_cinema',
    title: 'African Cinema',
    fetcher: () => contentApi.getAfricanMovies(),
    aspectRatio: 'poster' as const,
    providerId: 'acu',
  },
  {
    id: 'netflix_originals',
    title: 'Netflix Originals',
    fetcher: () => contentApi.discover({ with_networks: '213', page: Math.floor(Math.random() * 150) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'netflix',
  },
  {
    id: 'hbo_prestige',
    title: 'HBO Prestige',
    fetcher: () => contentApi.discover({ with_networks: '49', page: Math.floor(Math.random() * 50) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'hbo',
  },
  {
    id: 'adult_swim',
    title: 'Adult Swim Collection',
    fetcher: () => contentApi.discover({ with_networks: '80', page: Math.floor(Math.random() * 10) + 1 }, 'tv'),
    aspectRatio: '16:9' as const,
    providerId: 'adult-swim',
  },
  {
    id: 'marvel_universe',
    title: 'Marvel Studios',
    fetcher: () => contentApi.discover({ with_keywords: '180547', page: Math.floor(Math.random() * 3) + 1 }, 'movie'),
    aspectRatio: '16:9' as const,
  },
  {
    id: 'disney_plus',
    title: 'Disney+ Magic',
    fetcher: () => contentApi.discover({ with_networks: '2739', page: Math.floor(Math.random() * 100) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'disney-plus',
  },
  {
    id: 'hulu_picks',
    title: 'Hulu Originals',
    fetcher: () => contentApi.discover({ with_networks: '453', page: Math.floor(Math.random() * 100) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'hulu',
  },
  {
    id: 'a24_gallery',
    title: 'A24 Gallery',
    fetcher: () => contentApi.discover({ with_companies: '41077', page: Math.floor(Math.random() * 20) + 1 }, 'movie'),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'korean_dramas',
    title: 'Korean Dramas',
    fetcher: () => contentApi.getKoreanDramas(),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'day_one_movies',
    title: 'Premiere Releases',
    fetcher: () => contentApi.getDayOneDrops('movie', Math.floor(Math.random() * 15) + 1),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'upcoming',
    title: 'Coming Soon',
    fetcher: () => contentApi.getUpcoming(Math.floor(Math.random() * 5) + 1),
    aspectRatio: '16:9' as const,
    playTrailerOnClick: true,
  },
  {
    id: 'action',
    title: 'High-Octane Action',
    fetcher: () => contentApi.getByGenre(28, 'movie', Math.floor(Math.random() * 250) + 1),
    aspectRatio: '21:9' as const,
  },
  {
    id: 'hidden_gems',
    title: 'Hidden Gems',
    fetcher: () => contentApi.getUnderrated('movie', Math.floor(Math.random() * 100) + 1),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'amazon_prime',
    title: 'Prime Video Picks',
    fetcher: () => contentApi.discover({ with_networks: '1024', page: Math.floor(Math.random() * 100) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'prime-video',
  },
  {
    id: 'scifi',
    title: 'Sci-Fi Picks',
    fetcher: () => contentApi.getByGenre(878, 'movie', Math.floor(Math.random() * 250) + 1),
    aspectRatio: '16:9' as const,
  },
  {
    id: 'paramount_plus',
    title: 'Paramount+ Originals',
    fetcher: () => contentApi.discover({ with_networks: '4330', page: Math.floor(Math.random() * 50) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
    providerId: 'paramount-plus',
  },
  {
    id: 'anime',
    title: 'Anime Spotlight',
    fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc', page: Math.floor(Math.random() * 150) + 1 }, 'tv'),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'thrillers',
    title: 'Thrilling Suspense',
    fetcher: () => contentApi.getByGenre(53, 'movie', Math.floor(Math.random() * 250) + 1),
    aspectRatio: '21:9' as const,
  },
  {
    id: 'documentary',
    title: 'Truth in Vision',
    fetcher: () => contentApi.getByGenre(99, 'movie', Math.floor(Math.random() * 100) + 1),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'comedy',
    title: 'Infinite Laughs',
    fetcher: () => contentApi.getByGenre(35, 'movie', Math.floor(Math.random() * 250) + 1),
    aspectRatio: 'poster' as const,
  },
  {
    id: 'horror',
    title: 'Late Night Thrills',
    fetcher: () => contentApi.getByGenre(27, 'movie', Math.floor(Math.random() * 150) + 1),
    aspectRatio: 'poster' as const,
  },
];



export default function DashboardPage() {
  const hydrated = useHydrated();
  const activeProfile = useActiveProfile();
  const [visibleCount, setVisibleCount] = useState(4);
  
  // 0. Institutional Serendipity Salt (Stable for session, but random)
  const serendipitySalt = useMemo(() => Math.random(), []);

  const sortedRails = useMemo(() => {
    // 1. Base Randomization (Shuffled by salt)
    const shuffledBase = [...RAIL_CONFIGS].sort((a, b) => {
      const hashA = (a.id.length * serendipitySalt) % 1;
      const hashB = (b.id.length * serendipitySalt) % 1;
      return hashA - hashB;
    });

    if (!hydrated || !activeProfile?.preferences) return shuffledBase;
    
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
      'fantasy': 'scifi', 
      'thriller': 'thrillers',
      'mystery': 'thrillers',
    };

    // Vibe to Rail boosts
    const VIBE_BOOSTS: Record<string, string[]> = {
      'high-energy': ['action', 'scifi', 'day_one_movies', 'marvel_universe', 'thrillers'],
      'chilled': ['comedy', 'family', 'anime', 'amazon_prime', 'disney_plus'],
      'dark-gritty': ['horror', 'action', 'korean_dramas', 'hbo_prestige', 'thrillers'],
      'epic': ['scifi', 'african_cinema', 'netflix_originals', 'marvel_universe', 'hbo_prestige'],
      'thought-provoking': ['documentary', 'popular_tv', 'hulu_picks', 'a24_gallery', 'hbo_prestige'],
      'lighthearted': ['comedy', 'anime', 'family', 'disney_plus', 'amazon_prime'],
    };

    return shuffledBase.sort((a, b) => {
      let scoreA = (a.id.length * serendipitySalt) % 2; // Small base randomness
      let scoreB = (b.id.length * serendipitySalt) % 2;

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
  }, [hydrated, activeProfile?.preferences, serendipitySalt]);

  const { ref: sentinelRef, inView: isSentinelInView } = useInView({
    rootMargin: '600px 0px',
    threshold: 0.1,
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Serendipity] Active Rails:', { 
        visibleCount, 
        total: sortedRails.length,
        salt: serendipitySalt
      });
    }
  }, [isSentinelInView, visibleCount, sortedRails.length, serendipitySalt]);

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

      <div className="relative z-10 -mt-44 pb-32">
        {/* 1. Home Dashboard (Greeting + Pipeline + Pulse) */}
        <HomeDashboard />

        {/* 2. Studio / Brand Shortcuts */}
        <StudioRail />

        {/* 2.5 Critics Choice (S-Class Serendipity) */}
        <CriticsChoice />

        {/* 3. Primary Content Rails - Moved up for better accessibility */}
        <div className="space-y-12 mb-16">
          {sortedRails.slice(0, 4).map(config => (
            <div key={config.id} className="relative">
              <AtmosphericAsyncRail config={config} salt={serendipitySalt} />
            </div>
          ))}
        </div>

        {/* Interstitial: Proximity Bento */}
        <div className="py-8">
          <ProximityBento />
        </div>

        {/* Institutional Journey: Gateway -> Experience */}
        <div className="space-y-12 py-4">
          <section className="space-y-12">
            <Suspense fallback={<div className="h-[600px] animate-pulse bg-zinc-900 mx-10 lg:mx-24 rounded-[4rem]" />}>
              <BrandBlock
                text="The Library"
                subtext="Explore thousands of cinematic masterpieces from around the world. Access high-quality streaming restored for the modern experience."
                variant="library"
                onClick={() => document.getElementById('the-collection')?.scrollIntoView({ behavior: 'smooth' })}
                bgImage={getOptimizedImageUrl(
                  'https://images.unsplash.com/photo-1507924538820-ede94a04019d',
                  'landscape'
                ) || undefined}
              />
            </Suspense>
            <SmartCollections />
          </section>

          {/* More Content Rails */}
          <div className="space-y-12 py-4">
            {sortedRails.slice(4, 8).map(config => (
              <div key={config.id} className="relative">
                <AtmosphericAsyncRail config={config} salt={serendipitySalt} />
              </div>
            ))}
          </div>

          <section className="space-y-12">
            <Suspense fallback={<div className="h-[600px] animate-pulse bg-zinc-900 mx-10 lg:mx-24 rounded-[4rem]" />}>
              <BrandBlock
                text="My List"
                subtext="Keep track of everything you want to watch. Your personalized collection of movies and shows, synced across all your devices."
                variant="personal"
                onClick={() => document.getElementById('personal-library')?.scrollIntoView({ behavior: 'smooth' })}
                bgImage={getOptimizedImageUrl(
                  'https://images.unsplash.com/photo-1517649763962-0c623066013b',
                  'landscape'
                ) || undefined}
              />
            </Suspense>
            <PersonalLibrary />
          </section>
        </div>

        {/* Remaining Dynamic Content Rails */}
        <div className="space-y-12">
          {sortedRails.slice(8, visibleCount).map(config => (
            <div key={config.id} className="relative">
              <AtmosphericAsyncRail config={config} salt={serendipitySalt} />
            </div>
          ))}
        </div>

          <section className="space-y-12">
            <Suspense fallback={<div className="h-[600px] animate-pulse bg-zinc-900 mx-10 lg:mx-24 rounded-[4rem]" />}>
              <BrandBlock
                text="Upcoming"
                subtext="Get an exclusive look at upcoming releases and directorial previews. Stay ahead with the latest additions to our platform."
                variant="previews"
                onClick={() => document.getElementById('upcoming-pulse')?.scrollIntoView({ behavior: 'smooth' })}
                bgImage={getOptimizedImageUrl(
                  'https://images.unsplash.com/photo-1574267432553-4b4628081c31',
                  'landscape'
                ) || undefined}
              />
            </Suspense>
            <div id="upcoming-pulse">
              <UpcomingPreviews />
            </div>
          </section>
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
  );
}
