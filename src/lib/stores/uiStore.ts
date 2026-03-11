/**
 * Consolidated UI Store
 * Handles all UI state that is not related to the player
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { Content } from '@/lib/types/content';

// Types
export interface ModalState {
  contentModal: {
    isOpen: boolean;
    content: Content | null;
  };
  settingsModal: {
    isOpen: boolean;
    activeTab: 'general' | 'player' | 'accessibility';
  };
  castModal: {
    isOpen: boolean;
  };
  searchModal: {
    isOpen: boolean;
    initialQuery?: string;
  };
}

export interface NavigationState {
  sidebarOpen: boolean;
  activeSection: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

export interface LayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenHeight: number;
  screenWidth: number;
}

export interface NotificationState {
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    duration?: number;
    timestamp: number;
  }>;
}

export interface ChannelState {
  scrollPositions: Record<string, number>;
  visibleCounts: Record<string, number>;
  activeFilters: Record<string, Record<string, any>>;
}

interface UIStore extends ModalState, NavigationState, LayoutState, NotificationState, ChannelState {
  // Modal actions
  openContentModal: (content: Content) => void;
  closeContentModal: () => void;
  openSettingsModal: (tab?: ModalState['settingsModal']['activeTab']) => void;
  closeSettingsModal: () => void;
  openCastModal: () => void;
  closeCastModal: () => void;
  openSearchModal: (query?: string) => void;
  closeSearchModal: () => void;
  closeAllModals: () => void;

  // Navigation actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveSection: (section: string) => void;
  setBreadcrumbs: (breadcrumbs: NavigationState['breadcrumbs']) => void;
  addBreadcrumb: (breadcrumb: { label: string; href?: string }) => void;

  // Layout actions
  updateLayout: (layout: Partial<LayoutState>) => void;

  // Notification actions
  addNotification: (notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Channel actions
  setChannelScrollPosition: (channelId: string, position: number) => void;
  setChannelVisibleCount: (channelId: string, count: number) => void;
  setChannelFilter: (channelId: string, filter: Record<string, any>) => void;
  clearChannelState: (channelId: string) => void;

  // Reset actions
  resetUI: () => void;
}

// Default values
const defaultModalState: ModalState = {
  contentModal: { isOpen: false, content: null },
  settingsModal: { isOpen: false, activeTab: 'general' },
  castModal: { isOpen: false },
  searchModal: { isOpen: false },
};

const defaultNavigationState: NavigationState = {
  sidebarOpen: false,
  activeSection: 'home',
  breadcrumbs: [],
};

const defaultLayoutState: LayoutState = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenHeight: 1080,
  screenWidth: 1920,
};

const defaultNotificationState: NotificationState = {
  notifications: [],
};

const defaultChannelState: ChannelState = {
  scrollPositions: {},
  visibleCounts: {},
  activeFilters: {},
};

export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        ...defaultModalState,
        ...defaultNavigationState,
        ...defaultLayoutState,
        ...defaultNotificationState,
        ...defaultChannelState,

        // Modal actions
        openContentModal: (content) => 
          set((state) => ({
            contentModal: { isOpen: true, content },
          })),

        closeContentModal: () => 
          set((state) => ({
            contentModal: { isOpen: false, content: null },
          })),

        openSettingsModal: (tab = 'general') => 
          set((state) => ({
            settingsModal: { isOpen: true, activeTab: tab },
          })),

        closeSettingsModal: () => 
          set((state) => ({
            settingsModal: { isOpen: false, activeTab: 'general' },
          })),

        openCastModal: () => 
          set((state) => ({
            castModal: { isOpen: true },
          })),

        closeCastModal: () => 
          set((state) => ({
            castModal: { isOpen: false },
          })),

        openSearchModal: (initialQuery) => 
          set((state) => ({
            searchModal: { isOpen: true, initialQuery },
          })),

        closeSearchModal: () => 
          set((state) => ({
            searchModal: { isOpen: false, initialQuery: undefined },
          })),

        closeAllModals: () => 
          set((state) => ({
            contentModal: { isOpen: false, content: null },
            settingsModal: { isOpen: false, activeTab: 'general' },
            castModal: { isOpen: false },
            searchModal: { isOpen: false, initialQuery: undefined },
          })),

        // Navigation actions
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        
        toggleSidebar: () => 
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setActiveSection: (activeSection) => 
          set({ activeSection, breadcrumbs: [] }),

        setBreadcrumbs: (breadcrumbs) => 
          set({ breadcrumbs }),

        addBreadcrumb: (breadcrumb) => 
          set((state) => ({
            breadcrumbs: [...state.breadcrumbs, breadcrumb],
          })),

        // Layout actions
        updateLayout: (layout) => 
          set((state) => ({ ...state, ...layout })),

        // Notification actions
        addNotification: (notification) => {
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const timestamp = Date.now();
          
          const newNotification = { ...notification, id, timestamp };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));

          // Auto-remove notification after duration
          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },

        removeNotification: (id) => 
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),

        clearNotifications: () => 
          set({ notifications: [] }),

        // Channel actions
        setChannelScrollPosition: (channelId, scrollPos) => 
          set((state) => ({
            scrollPositions: {
              ...state.scrollPositions,
              [channelId]: scrollPos,
            },
          })),

        setChannelVisibleCount: (channelId, visibleCount) => 
          set((state) => ({
            visibleCounts: {
              ...state.visibleCounts,
              [channelId]: visibleCount,
            },
          })),

        setChannelFilter: (channelId, filter) => 
          set((state) => ({
            activeFilters: {
              ...state.activeFilters,
              [channelId]: {
                ...state.activeFilters[channelId],
                ...filter,
              },
            },
          })),

        clearChannelState: (channelId) => 
          set((state) => {
            const { [channelId]: removedScroll, ...restScrollPositions } = state.scrollPositions;
            const { [channelId]: removedVisible, ...restVisibleCounts } = state.visibleCounts;
            const { [channelId]: removedFilters, ...restActiveFilters } = state.activeFilters;

            return {
              scrollPositions: restScrollPositions,
              visibleCounts: restVisibleCounts,
              activeFilters: restActiveFilters,
            };
          }),

        // Reset actions
        resetUI: () => ({
          ...defaultModalState,
          ...defaultNavigationState,
          ...defaultLayoutState,
          ...defaultNotificationState,
          ...defaultChannelState,
        }),
      }),
      {
        name: 'novastream-ui',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist UI preferences, not ephemeral state
          sidebarOpen: state.sidebarOpen,
          scrollPositions: state.scrollPositions,
          visibleCounts: state.visibleCounts,
          activeFilters: state.activeFilters,
        }),
      }
    )
  )
);

// Selectors for optimized subscriptions
export const useModalState = () => 
  useUIStore((state) => state.contentModal, shallow);

export const useAllModals = () => 
  useUIStore((state) => ({
    contentModal: state.contentModal,
    settingsModal: state.settingsModal,
    castModal: state.castModal,
    searchModal: state.searchModal,
  }), shallow);

export const useNavigationState = () => 
  useUIStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    activeSection: state.activeSection,
    breadcrumbs: state.breadcrumbs,
  }), shallow);

export const useLayoutState = () => 
  useUIStore((state) => ({
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
    screenHeight: state.screenHeight,
    screenWidth: state.screenWidth,
  }), shallow);

export const useNotifications = () => 
  useUIStore((state) => state.notifications, shallow);

export const useChannelState = (channelId?: string) => 
  useUIStore((state) => {
    if (!channelId) return { scrollPositions: state.scrollPositions, visibleCounts: state.visibleCounts, activeFilters: state.activeFilters };
    
    return {
      scrollPosition: state.scrollPositions[channelId] || 0,
      visibleCount: state.visibleCounts[channelId] || 2,
      activeFilter: state.activeFilters[channelId] || {},
    };
  }, shallow);

// Action selectors for cleaner imports
export const useModalActions = () => 
  useUIStore((state) => ({
    openContentModal: state.openContentModal,
    closeContentModal: state.closeContentModal,
    openSettingsModal: state.openSettingsModal,
    closeSettingsModal: state.closeSettingsModal,
    openCastModal: state.openCastModal,
    closeCastModal: state.closeCastModal,
    openSearchModal: state.openSearchModal,
    closeSearchModal: state.closeSearchModal,
    closeAllModals: state.closeAllModals,
  }));

export const useNavigationActions = () => 
  useUIStore((state) => ({
    setSidebarOpen: state.setSidebarOpen,
    toggleSidebar: state.toggleSidebar,
    setActiveSection: state.setActiveSection,
    setBreadcrumbs: state.setBreadcrumbs,
    addBreadcrumb: state.addBreadcrumb,
  }));

export const useNotificationActions = () => 
  useUIStore((state) => ({
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
  }));

export const useChannelActions = () => 
  useUIStore((state) => ({
    setChannelScrollPosition: state.setChannelScrollPosition,
    setChannelVisibleCount: state.setChannelVisibleCount,
    setChannelFilter: state.setChannelFilter,
    clearChannelState: state.clearChannelState,
  }));

// Development utilities
if (process.env.NODE_ENV === 'development') {
  useUIStore.subscribe(
    (state) => state.contentModal,
    (modalState, prevModalState) => {
      console.log('🖼️ Modal State changed:', {
        from: prevModalState,
        to: modalState,
      });
    }
  );
}