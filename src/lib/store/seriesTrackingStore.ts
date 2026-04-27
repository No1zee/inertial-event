import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Content } from '@/lib/types/content';

interface TrackedSeries {
  id: string;
  title: string;
  lastWatchedEpisode: number;
  lastWatchedSeason: number;
  lastChecked: string; // ISO Date
  hasNewEpisode: boolean;
}

interface SeriesTrackingState {
  trackedSeries: Record<string, TrackedSeries>;
  trackSeries: (content: Content, season: number, episode: number) => void;
  untrackSeries: (id: string) => void;
  markAsSeen: (id: string) => void;
  updateStatus: (id: string, hasNew: boolean) => void;
  getProgress: (id: string) => { season: number; episode: number } | null;
}

export const useSeriesTrackingStore = createWithEqualityFn<SeriesTrackingState>()(
  persist(
    (set, get) => ({
      trackedSeries: {},
      getProgress: id => {
        const tracked = get().trackedSeries[id];
        if (!tracked) return null;
        return { season: tracked.lastWatchedSeason, episode: tracked.lastWatchedEpisode };
      },
      trackSeries: (content, season, episode) =>
        set(state => ({
          trackedSeries: {
            ...state.trackedSeries,
            [String(content.id)]: {
              id: String(content.id),
              title: content.title,
              lastWatchedSeason: season,
              lastWatchedEpisode: episode,
              lastChecked: new Date().toISOString(),
              hasNewEpisode: false,
            },
          },
        })),
      untrackSeries: id =>
        set(state => {
          const { [id]: _unused, ...rest } = state.trackedSeries;
          return { trackedSeries: rest };
        }),
      markAsSeen: id =>
        set(state => ({
          trackedSeries: {
            ...state.trackedSeries,
            [id]: state.trackedSeries[id]
              ? {
                  ...state.trackedSeries[id],
                  hasNewEpisode: false,
                  lastChecked: new Date().toISOString(),
                }
              : state.trackedSeries[id],
          },
        })),
      updateStatus: (id, hasNew) =>
        set(state => ({
          trackedSeries: {
            ...state.trackedSeries,
            [id]: state.trackedSeries[id]
              ? {
                  ...state.trackedSeries[id],
                  hasNewEpisode: hasNew,
                  lastChecked: new Date().toISOString(),
                }
              : state.trackedSeries[id],
          },
        })),
    }),
    {
      name: 'series-tracking-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
