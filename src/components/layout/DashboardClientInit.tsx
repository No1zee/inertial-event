'use client';

import { useEffect } from 'react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';

export function DashboardClientInit() {
  const migrate = useLocalDataStore(state => state.migrateLegacyData);
  const queryClient = useQueryClient();

  useEffect(() => {
    migrate();

    // Pre-warm the cache with critical rails
    const prefetchRails = async () => {
      const rails = [
        { id: 'popular_tv', fetcher: contentApi.getPopularTV },
        { id: 'african_cinema', fetcher: contentApi.getAfricanMovies },
        { id: 'trending', fetcher: () => contentApi.getTrending(1) },
      ];

      // Use sequential prefetching to avoid network congestion during LCP
      // Trending is highest priority, followed by others with a delay
      for (const rail of rails) {
        await queryClient.prefetchQuery({
          queryKey: rail.id === 'trending' ? ['trending'] : ['rail', rail.id],
          queryFn: () => rail.fetcher(),
          staleTime: 1000 * 60 * 60,
        });

        // Stagger requests by 250ms to allow Hero Image to win the network race
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    };

    prefetchRails();
  }, [migrate, queryClient]);

  return null;
}
