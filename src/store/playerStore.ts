import { create } from 'zustand';

interface PlayerState {
    currentContentId: string | null;
    currentTime: number;
    duration: number;
    isBuffering: boolean;
    volume: number;

    setPlayerState: (state: Partial<PlayerState>) => void;
    resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    currentContentId: null,
    currentTime: 0,
    duration: 0,
    isBuffering: false,
    volume: 1,

    setPlayerState: (newState) => set((state) => ({ ...state, ...newState })),
    resetPlayer: () => set({ currentContentId: null, currentTime: 0, duration: 0, isBuffering: false }),
}));
