import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import { Content } from '@/lib/types/content';
import { minifyContent } from '@/utils/contentHelpers';

interface HistoryState {
  history: Content[];
  addToHistory: (content: Content) => void;
  clearHistory: () => void;
  getLastWatched: () => Content | undefined;
  getContinueWatching: () => Content[];
}

export const useHistoryStore = createWithEqualityFn<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      addToHistory: content =>
        set(state => {
          // Remove if already exists to move to top
          const filtered = state.history.filter(i => String(i.id) !== String(content.id));

          // Ensure we keep the latest progress and minify
          const newItem = minifyContent({
            ...content,
            lastWatched: Date.now(),
          }) as Content; // Cast back to Content for type compatibility, though runtime is smaller

          // Keep only last 50
          return { history: [newItem, ...filtered].slice(0, 50) };
        }),
      clearHistory: () => set({ history: [] }),
      getLastWatched: () => get().history[0],
      getContinueWatching: () => {
        const history = get().history;
        return history.filter(item => {
          // Start basic validity check
          if (!item.progress) return false;

          // If no duration (e.g. stream), we can't calculate percentage.
          // But if progress > 60s (1 min), assume it's worth watching.
          const duration = item.duration || 0;

          if (duration > 0) {
            const pct = item.progress / duration;
            return pct > 0.05 && pct < 0.9;
          } else {
            // Fallback for streams/missing duration: Keep if watched > 1 minute
            return item.progress > 60;
          }
        });
      },
    }),
    {
      name: 'NovaStream-history-storage',
    }
  )
);
