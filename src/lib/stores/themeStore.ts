import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

export type Theme = 'Mai' | 'ocean' | 'cyberpunk' | 'oled' | 'heritage';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = createWithEqualityFn<ThemeState>()(
  persist(
    set => ({
      theme: 'Mai',
      setTheme: theme => {
        set({ theme });
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          // Remove all possible theme classes
          root.classList.remove('theme-Mai', 'theme-ocean', 'theme-cyberpunk', 'theme-oled', 'theme-heritage');
          // Add new theme class (except for default Mai)
          if (theme !== 'Mai') {
            root.classList.add(`theme-${theme}`);
          }
        }
      },
    }),
    {
      name: 'MaiWatch-theme',
    }
  )
);

/**
 * Institutional Theme Initializer
 * Prevents FOUC (Flash of Unstyled Content) by applying the theme class 
 * as early as possible in the client lifecycle.
 */
export const initializeTheme = () => {
  if (typeof window === 'undefined') return;
  try {
    const storage = localStorage.getItem('MaiWatch-theme');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state && state.theme && state.theme !== 'Mai') {
        document.documentElement.classList.add(`theme-${state.theme}`);
      }
    }
  } catch (e) {
    console.warn('[ThemeStore] Failed to initialize theme:', e);
  }
};
