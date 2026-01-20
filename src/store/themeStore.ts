import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'nova' | 'ocean' | 'cyberpunk' | 'oled';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'nova',
      setTheme: (theme) => {
        set({ theme });
        // Direct DOM manipulation for instant feedback, though layout effect is cleaner long term
        const root = document.documentElement;
        root.classList.remove('theme-nova', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
        if (theme !== 'nova') {
             root.classList.add(`theme-${theme}`);
        }
      },
    }),
    {
      name: 'novastream-theme',
    }
  )
);

// Helper to initialize theme on app load (avoid flashing wrong theme)
export const initializeTheme = () => {
    if (typeof window === 'undefined') return;
    try {
        const storage = localStorage.getItem('novastream-theme');
        if (storage) {
            const { state } = JSON.parse(storage);
            if (state && state.theme && state.theme !== 'nova') {
                document.documentElement.classList.add(`theme-${state.theme}`);
            }
        }
    } catch (e) {
        // Fallback
    }
}
