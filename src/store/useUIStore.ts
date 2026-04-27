import { createWithEqualityFn } from 'zustand/traditional';

interface UIState {
  isSidebarExpanded: boolean;
  isCommandCenterOpen: boolean;
  isSearchVisible: boolean;
  activeView: 'home' | 'browse' | 'live' | 'movies' | 'tv' | 'anime' | 'watchlist';

  setSidebarExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
  setCommandCenterOpen: (open: boolean) => void;
  toggleCommandCenter: () => void;
  setSearchVisible: (visible: boolean) => void;
  setActiveView: (view: UIState['activeView']) => void;
}

export const useUIStore = createWithEqualityFn<UIState>(set => ({
  isSidebarExpanded: false,
  isCommandCenterOpen: false,
  isSearchVisible: false,
  activeView: 'home',

  setSidebarExpanded: expanded => set({ isSidebarExpanded: expanded }),
  toggleSidebar: () => set(state => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  setCommandCenterOpen: open => set({ isCommandCenterOpen: open }),
  toggleCommandCenter: () => set(state => ({ isCommandCenterOpen: !state.isCommandCenterOpen })),
  setSearchVisible: visible => set({ isSearchVisible: visible }),
  setActiveView: view => set({ activeView: view }),
}));
