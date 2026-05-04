'use client';

import { useEffect } from 'react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { initializeTheme, useThemeStore, Theme } from '@/lib/stores/themeStore';

export function DashboardClientInit() {
  const migrate = useLocalDataStore(state => state.migrateLegacyData);
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Initialize Theme from localDataStore (Institutional Source of Truth)
    const storedTheme = useLocalDataStore.getState().globalPreferences.theme;
    if (storedTheme) {
      useThemeStore.getState().setTheme(storedTheme as Theme);
    } else {
      initializeTheme();
    }
    
    migrate();

    // Pre-warm the cache with critical rails
    const prefetchRails = async () => {
      const rails = [
        { id: 'trending', fetcher: () => contentApi.getTrending(1) },
        { id: 'popular_tv', fetcher: () => contentApi.getPopularTV(1) },
        { id: 'african_cinema', fetcher: contentApi.getAfricanMovies },
        { id: 'netflix_originals', fetcher: () => contentApi.discover({ with_networks: '213' }, 'tv') },
        { id: 'hbo_prestige', fetcher: () => contentApi.discover({ with_networks: '49' }, 'tv') },
        { id: 's_class_bangers', fetcher: () => contentApi.getBangers('movie') },
        { id: 'anime', fetcher: () => contentApi.getAnime(1) },
        { id: 'day_one_movies', fetcher: () => contentApi.getDayOneDrops('movie') },
      ];


      // Use sequential prefetching to avoid network congestion during LCP
      // Trending is highest priority, followed by others with a delay
      for (const rail of rails) {
        try {
          await queryClient.prefetchQuery({
            queryKey: rail.id === 'trending' ? ['trending'] : ['rail', rail.id],
            queryFn: () => rail.fetcher(),
            staleTime: 1000 * 60 * 60,
          });
        } catch (e) {
          console.debug(`[Prefetch] Failed for ${rail.id}:`, e);
        }

        // Stagger requests by 400ms to allow Hero Image to win the network race
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    };

    prefetchRails();
  }, [migrate, queryClient]);

  return null;
}
