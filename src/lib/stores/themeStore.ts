import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

export type Theme = 'Nova' | 'ocean' | 'cyberpunk' | 'oled' | 'heritage';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = createWithEqualityFn<ThemeState>()(
  persist(
    set => ({
      theme: 'Nova',
      setTheme: theme => {
        set({ theme });
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          // Remove all possible theme classes
          root.classList.remove('theme-Nova', 'theme-ocean', 'theme-cyberpunk', 'theme-oled', 'theme-heritage');
          // Add new theme class (except for default Nova)
          if (theme !== 'Nova') {
            root.classList.add(`theme-${theme}`);
          }
        }
      },
    }),
    {
      name: 'NovaStream-theme',
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
    const storage = localStorage.getItem('NovaStream-theme');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state && state.theme && state.theme !== 'Nova') {
        document.documentElement.classList.add(`theme-${state.theme}`);
      }
    }
  } catch (e) {
    console.warn('[ThemeStore] Failed to initialize theme:', e);
  }
};
