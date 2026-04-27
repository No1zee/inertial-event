import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

export type Theme = 'Mai' | 'ocean' | 'cyberpunk' | 'oled';

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
        // Direct DOM manipulation for instant feedback
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('theme-Mai', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
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

// Helper to initialize theme on app load
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
  } catch {
    // Fallback
  }
};
