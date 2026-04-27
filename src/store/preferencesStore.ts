import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  autoSkip: boolean;
  preferredQuality: 'auto' | '1080p' | '720p' | '480p';
  subtitleScale: number;
  theme: 'dark' | 'light';
  audioLanguage: 'dub' | 'sub';

  setAutoSkip: (enabled: boolean) => void;
  setPreferredQuality: (quality: 'auto' | '1080p' | '720p' | '480p') => void;
  setSubtitleScale: (scale: number) => void;
  toggleTheme: () => void;
  setAudioLanguage: (lang: 'dub' | 'sub') => void;
}

export const usePreferencesStore = createWithEqualityFn<PreferencesState>()(
  persist(
    set => ({
      autoSkip: true,
      preferredQuality: 'auto',
      subtitleScale: 1,
      theme: 'dark',
      audioLanguage: 'dub',

      setAutoSkip: autoSkip => set({ autoSkip }),
      setPreferredQuality: preferredQuality => set({ preferredQuality }),
      setSubtitleScale: subtitleScale => set({ subtitleScale }),
      toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setAudioLanguage: audioLanguage => set({ audioLanguage }),
    }),
    {
      name: 'ns-prefs',
    }
  )
);
