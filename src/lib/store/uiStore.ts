import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

interface ChannelUIState {
  scrollPos: number;
  visibleCount: number;
}

interface UIStore {
  // Legacy Sidebar State (kept for compatibility during transition)
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Cinematic Shell State
  isRailExpanded: boolean;
  setIsRailExpanded: (expanded: boolean) => void;

  isCommandCenterOpen: boolean;
  setCommandCenterOpen: (open: boolean) => void;
  toggleCommandCenter: () => void;

  activeView: 'home' | 'browse' | 'live' | 'movies' | 'tv' | 'anime' | 'watchlist' | 'files' | 'history' | 'profile';
  setActiveView: (view: UIStore['activeView']) => void;

  // Map channelId -> State
  channelStates: Record<string, ChannelUIState>;
  setChannelState: (channelId: string, state: Partial<ChannelUIState>) => void;
  getChannelState: (channelId: string) => ChannelUIState;
}

export type { UIStore };

export const useUIStore = createWithEqualityFn<UIStore>()(
  persist(
    (set, get) => ({
      // Sidebar Implementation
      sidebarOpen: false,
      setSidebarOpen: open => set({ sidebarOpen: open }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

      // Cinematic implementation
      isRailExpanded: false,
      setIsRailExpanded: expanded => set({ isRailExpanded: expanded }),

      isCommandCenterOpen: false,
      setCommandCenterOpen: open => set({ isCommandCenterOpen: open }),
      toggleCommandCenter: () => set(state => ({ isCommandCenterOpen: !state.isCommandCenterOpen })),

      activeView: 'home',
      setActiveView: view => set({ activeView: view }),

      channelStates: {},
      setChannelState: (channelId, newState) =>
        set(state => ({
          channelStates: {
            ...state.channelStates,
            [channelId]: {
              ...(state.channelStates[channelId] || { scrollPos: 0, visibleCount: 2 }), // Default values
              ...newState,
            },
          },
        })),
      getChannelState: channelId => {
        return get().channelStates[channelId] || { scrollPos: 0, visibleCount: 2 };
      },
    }),
    {
      name: 'ui-storage',
      partialize: state => ({
        sidebarOpen: state.sidebarOpen,
        channelStates: state.channelStates,
        activeView: state.activeView,
      }),
    }
  )
);
