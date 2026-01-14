import { create } from 'zustand';

// Simple content cache to avoid re-fetching too often if needed, 
// though React Query handles most of this. This store can handle
// client-side specific content state like "continue watching" queue locally
// before syncing.

interface ContinueWatchingItem {
    id: string;
    title: string;
    poster: string;
    progress: number; // 0-100
    timestamp: number;
}

interface ContentState {
    continueWatching: ContinueWatchingItem[];

    // Actions
    updateProgress: (item: ContinueWatchingItem) => void;
    removeFromContinueWatching: (id: string) => void;
}

// We persist continue watching locally for immediate access
import { persist } from 'zustand/middleware';

export const useContentStore = create<ContentState>()(
    persist(
        (set) => ({
            continueWatching: [],

            updateProgress: (item) => set((state) => {
                const filtered = state.continueWatching.filter(i => i.id !== item.id);
                return { continueWatching: [item, ...filtered].slice(0, 20) }; // Keep last 20
            }),
            removeFromContinueWatching: (id) => set((state) => ({
                continueWatching: state.continueWatching.filter(i => i.id !== id)
            })),
        }),
        {
            name: 'novastream-content-storage',
        }
    )
);
