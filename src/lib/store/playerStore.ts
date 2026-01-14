import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerState {
    isPlaying: boolean;
    volume: number;
    muted: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    quality: string;
    isFullscreen: boolean;
    showControls: boolean;

    // Actions
    setPlaying: (playing: boolean) => void;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setPlaybackRate: (rate: number) => void;
    setQuality: (quality: string) => void;
    setFullscreen: (fullscreen: boolean) => void;
    setShowControls: (show: boolean) => void;
    reset: () => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set) => ({
            isPlaying: false,
            volume: 1,
            muted: false,
            currentTime: 0,
            duration: 0,
            playbackRate: 1,
            quality: 'auto',
            isFullscreen: false,
            showControls: true,

            setPlaying: (isPlaying) => set({ isPlaying }),
            setVolume: (volume) => set({ volume }),
            setMuted: (muted) => set({ muted }),
            setCurrentTime: (currentTime) => set({ currentTime }),
            setDuration: (duration) => set({ duration }),
            setPlaybackRate: (playbackRate) => set({ playbackRate }),
            setQuality: (quality) => set({ quality }),
            setFullscreen: (isFullscreen) => set({ isFullscreen }),
            setShowControls: (showControls) => set({ showControls }),
            reset: () => set({
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                isFullscreen: false,
                showControls: true
            })
        }),
        {
            name: 'novastream-player-storage',
            partialize: (state) => ({
                volume: state.volume,
                muted: state.muted,
                quality: state.quality,
                playbackRate: state.playbackRate
            }),
        }
    )
);
