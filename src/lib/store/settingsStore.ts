import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    quality: '4k' | '1080p' | '720p' | '360p' | 'auto';
    audioLanguage: string;
    subtitleLanguage: string;
    subtitleEnabled: boolean;
    autoplay: boolean;
    hardwareAcceleration: boolean;
    librarySort: 'recent' | 'az';
    volume: number;
    
    // Actions
    setQuality: (q: SettingsState['quality']) => void;
    setAudioLanguage: (lang: string) => void;
    setSubtitleLanguage: (lang: string) => void;
    setSubtitleEnabled: (enabled: boolean) => void;
    setAutoplay: (enabled: boolean) => void;
    setHardwareAcceleration: (enabled: boolean) => void;
    setLibrarySort: (sort: 'recent' | 'az') => void;
    setVolume: (v: number) => void;
    resetSettings: () => void;
}

const defaultSettings = {
    quality: 'auto' as const,
    audioLanguage: 'en',
    subtitleLanguage: 'en',
    subtitleEnabled: true,
    autoplay: true,
    hardwareAcceleration: true,
    librarySort: 'recent' as const,
    volume: 1,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...defaultSettings,
            setQuality: (quality) => set({ quality }),
            setAudioLanguage: (audioLanguage) => set({ audioLanguage }),
            setSubtitleLanguage: (subtitleLanguage) => set({ subtitleLanguage }),
            setSubtitleEnabled: (subtitleEnabled) => set({ subtitleEnabled }),
            setAutoplay: (autoplay) => set({ autoplay }),
            setHardwareAcceleration: (hardwareAcceleration) => set({ hardwareAcceleration }),
            setLibrarySort: (librarySort) => set({ librarySort }),
            setVolume: (volume) => set({ volume }),
            resetSettings: () => set(defaultSettings),
        }),
        {
            name: 'novastream-settings',
        }
    )
);
