import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
    autoSkip: boolean;
    preferredQuality: 'auto' | '1080p' | '720p' | '480p';
    subtitleScale: number;
    theme: 'dark' | 'light';

    setAutoSkip: (enabled: boolean) => void;
    setPreferredQuality: (quality: 'auto' | '1080p' | '720p' | '480p') => void;
    setSubtitleScale: (scale: number) => void;
    toggleTheme: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            autoSkip: true,
            preferredQuality: 'auto',
            subtitleScale: 1,
            theme: 'dark',

            setAutoSkip: (autoSkip) => set({ autoSkip }),
            setPreferredQuality: (preferredQuality) => set({ preferredQuality }),
            setSubtitleScale: (subtitleScale) => set({ subtitleScale }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
        }),
        {
            name: 'ns-prefs',
        }
    )
);
