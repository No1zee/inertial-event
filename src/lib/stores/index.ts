/**
 * NovaStream State Management - Consolidated Index
 * 
 * This is the main entry point for all state management in NovaStream.
 * Import stores and hooks from here to maintain a clean architecture.
 */

// Re-export all stores
export { usePlayerStore, usePlayerPlayback, usePlayerAudio, usePlayerVideo, usePlayerUI, useCurrentMedia, usePlayerActions } from './playerStore';
export { useUIStore, useModalState, useAllModals, useNavigationState, useLayoutState, useNotifications, useChannelState, useModalActions, useNavigationActions, useNotificationActions, useChannelActions } from './uiStore';
export { useUserPreferencesStore, usePlayerPreferences, useUIPreferences, useTheme, useContentPreferences } from './preferencesStore';
export { useLocalDataStore, useWatchHistory, useLibrary, useCollections, useDownloads, useContinueWatching, useWatchHistoryActions, useLibraryActions, useCollectionActions, useDownloadActions } from './localDataStore';
export { useAuthStore, useAuth, useUser, useSession, useAuthActions } from './authStore';

// Re-export types
export type {
  PlaybackState,
  AudioState,
  VideoState,
  UIState as PlayerUIState,
  PlayerMedia,
} from './playerStore';

export type {
  ModalState,
  NavigationState,
  LayoutState,
  NotificationState,
  ChannelState,
} from './uiStore';

export type {
  PlayerPreferences,
  UIPreferences,
  ContentPreferences,
  PrivacyPreferences,
  NotificationPreferences,
  AccessibilityPreferences,
  Theme,
  Language,
  Quality,
  SortOrder,
} from './preferencesStore';

export type {
  WatchHistoryItem,
  LibraryItem,
  Collection,
  DownloadItem,
  ContinueWatchingItem,
} from './localDataStore';

export type {
  User,
  AuthSession,
  AuthState,
} from './authStore';

// Utility exports for backward compatibility
export const initializeTheme = () => {
  if (typeof window === 'undefined') return;
  
  try {
    import('./preferencesStore').then(({ useUserPreferencesStore }) => {
      const state = useUserPreferencesStore.getState();
      
      // Apply theme to DOM
      if (state.theme !== 'nova') {
        document.documentElement.classList.add(`theme-${state.theme}`);
      }
    });
  } catch (e) {
    console.warn('Failed to initialize theme:', e);
  }
};

// Development utilities
export const debugState = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 NovaStream State Debug');
    
    try {
      const { usePlayerStore } = await import('./playerStore');
      console.group('Player Store');
      console.log(usePlayerStore.getState());
      console.groupEnd();
    } catch (e) {
      console.warn('Could not load player store:', e);
    }
    
    try {
      const { useUIStore } = await import('./uiStore');
      console.group('UI Store');
      console.log(useUIStore.getState());
      console.groupEnd();
    } catch (e) {
      console.warn('Could not load UI store:', e);
    }
    
    try {
      const { useUserPreferencesStore } = await import('./preferencesStore');
      console.group('User Preferences Store');
      console.log(useUserPreferencesStore.getState());
      console.groupEnd();
    } catch (e) {
      console.warn('Could not load preferences store:', e);
    }
    
    try {
      const { useLocalDataStore } = await import('./localDataStore');
      console.group('Local Data Store');
      console.log(useLocalDataStore.getState());
      console.groupEnd();
    } catch (e) {
      console.warn('Could not load local data store:', e);
    }
    
    try {
      const { useAuthStore } = await import('./authStore');
      console.group('Auth Store');
      console.log(useAuthStore.getState());
      console.groupEnd();
    } catch (e) {
      console.warn('Could not load auth store:', e);
    }
    
    console.groupEnd();
  }
};

// State reset utilities
export const resetAllStores = async () => {
  console.warn('🔄 Resetting all stores...');
  
  try {
    const { usePlayerStore } = await import('./playerStore');
    usePlayerStore.getState().resetPlayer();
  } catch (e) {
    console.warn('Could not reset player store:', e);
  }
  
  try {
    const { useUIStore } = await import('./uiStore');
    useUIStore.getState().resetUI();
  } catch (e) {
    console.warn('Could not reset UI store:', e);
  }
  
  try {
    const { useUserPreferencesStore } = await import('./preferencesStore');
    useUserPreferencesStore.getState().resetAllPreferences();
  } catch (e) {
    console.warn('Could not reset preferences store:', e);
  }
  
  try {
    const { useLocalDataStore } = await import('./localDataStore');
    useLocalDataStore.getState().clearAllData();
  } catch (e) {
    console.warn('Could not reset local data store:', e);
  }
  
  try {
    const { useAuthStore } = await import('./authStore');
    useAuthStore.getState().logout();
  } catch (e) {
    console.warn('Could not logout user:', e);
  }
};

// Export default object for convenience (async for lazy loading)
export default {
  // Utilities
  initializeTheme,
  debugState,
  resetAllStores,
  
  // Lazy-loaded accessors
  getStores: async () => {
    const [
      { usePlayerStore },
      { useUIStore },
      { useUserPreferencesStore },
      { useLocalDataStore },
      { useAuthStore },
    ] = await Promise.all([
      import('./playerStore'),
      import('./uiStore'),
      import('./preferencesStore'),
      import('./localDataStore'),
      import('./authStore'),
    ]);
    
    return {
      // Stores
      player: usePlayerStore,
      ui: useUIStore,
      preferences: useUserPreferencesStore,
      localData: useLocalDataStore,
      auth: useAuthStore,
    };
  },
  
  getSelectors: async () => {
    const selectors = await Promise.all([
      import('./playerStore'),
      import('./uiStore'),
      import('./preferencesStore'),
      import('./localDataStore'),
      import('./authStore'),
    ]);
    
    const [
      { usePlayerPlayback, usePlayerActions },
      { useModalState, useNavigationState, useModalActions, useNavigationActions },
      { useTheme, useContentPreferences },
      { useWatchHistory, useLibrary, useContinueWatching, useLibraryActions },
      { useAuth, useUser, useAuthActions },
    ] = selectors;
    
    return {
      // Selectors
      usePlayer: usePlayerPlayback,
      useModal: useModalState,
      useNavigation: useNavigationState,
      useAuth: useAuth,
      useUser: useUser,
      useTheme: useTheme,
      useWatchHistory: useWatchHistory,
      useLibrary: useLibrary,
      useContinueWatching: useContinueWatching,
      useContentPreferences: useContentPreferences,
      
      // Actions
      usePlayerActions,
      useModalActions,
      useNavigationActions,
      useAuthActions,
      useLibraryActions,
    };
  },
};