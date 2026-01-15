import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Content } from '@/lib/types/content';

interface HistoryState {
    history: Content[];
    addToHistory: (content: Content) => void;
    clearHistory: () => void;
    getLastWatched: () => Content | undefined;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set, get) => ({
            history: [],
            addToHistory: (content) => set((state) => {
                // Remove if already exists to move to top
                const filtered = state.history.filter(i => i.id !== content.id);
                // Keep only last 20
                return { history: [content, ...filtered].slice(0, 20) };
            }),
            clearHistory: () => set({ history: [] }),
            getLastWatched: () => get().history[0]
        }),
        {
            name: 'novastream-history-storage',
        }
    )
);
