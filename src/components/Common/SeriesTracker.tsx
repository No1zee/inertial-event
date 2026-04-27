'use client';

import React, { useEffect } from 'react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { contentApi } from '@/lib/api/content';
import { toast } from 'sonner';

export const SeriesTracker: React.FC = () => {
  const contentState = useLocalDataStore(state => state.contentState);
  // Removed non-existent updateContentState to fix build error

  useEffect(() => {
    const checkNewEpisodes = async () => {
      const seriesIds = Object.keys(contentState).filter(
        id => contentState[id].type === 'tv' || contentState[id].type === 'anime'
      );

      const now = new Date().getTime();

      for (const id of seriesIds) {
        const state = contentState[id];
        if (!state) continue;

        // Simplified check: if not completed, we might want to check for new episodes
        // In a real app, we'd check against the total episodes count

        try {
          // Only check once every 24 hours to be respectful to the API
          const lastUpdated = state.updatedAt || 0;
          if (now - lastUpdated < 24 * 60 * 60 * 1000) continue;

          const details = await contentApi.getDetails(Number(id), state.type === 'anime' ? 'tv' : 'tv');

          if (details && details.lastAirDate) {
            const lastAir = new Date(details.lastAirDate);
            const diffDays = (now - lastAir.getTime()) / (1000 * 3600 * 24);

            if (diffDays >= 0 && diffDays < 7) {
              // We could flag it here if we had a hasNewEpisode field
              // For now, we'll just show a toast if it's very recent
              toast.info(`New episode of "${state.title}"!`, {
                description: `Release date: ${details.lastAirDate}`,
                duration: 3000,
              });
            }
          }
        } catch (err) {
          console.error(`Failed to check updates for series ${id}:`, err);
        }
      }
    };

    checkNewEpisodes();
    const interval = setInterval(checkNewEpisodes, 4 * 3600 * 1000); // Check every 4 hours
    return () => clearInterval(interval);
  }, [contentState]);

  return null;
};
