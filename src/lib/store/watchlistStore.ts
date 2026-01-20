import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Content } from '@/lib/types/content';

interface WatchlistState {
    watchlist: Content[];
    addToWatchlist: (content: Content) => void;
    removeFromWatchlist: (id: string) => void;
    isInWatchlist: (id: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
    persist(
        (set, get) => ({
            watchlist: [],
            addToWatchlist: (content) => set((state) => {
                if (state.watchlist.some(i => i.id === content.id)) return state;
                const newItem = { ...content, addedAt: Date.now() };
                return { watchlist: [newItem, ...state.watchlist] };
            }),
            removeFromWatchlist: (id) => set((state) => ({
                watchlist: state.watchlist.filter(i => i.id !== id)
            })),
            isInWatchlist: (id) => get().watchlist.some(i => i.id === id)
        }),
        {
            name: 'novastream-watchlist-storage',
        }
    )
);
