/**
 * Consolidated User Preferences Store
 * Handles all user settings, preferences, and theme management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Types
export type Theme = 'nova' | 'ocean' | 'cyberpunk' | 'oled';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';
export type Quality = 'auto' | '4k' | '1080p' | '720p' | '480p' | '360p';
export type SortOrder = 'recent' | 'az' | 'za' | 'rating' | 'year';

export interface PlayerPreferences {
  autoPlay: boolean;
  autoPlayNext: boolean;
  defaultQuality: Quality;
  defaultVolume: number;
  subtitlesEnabled: boolean;
  subtitleLanguage: string;
  audioLanguage: string;
  playbackSpeed: number;
  skipIntro: boolean;
  skipCredits: boolean;
}

export interface UIPreferences {
  theme: Theme;
  language: Language;
  compactMode: boolean;
  showThumbnails: boolean;
  animatedBackgrounds: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

export interface ContentPreferences {
  preferredGenres: string[];
  blockedGenres: string[];
  preferredLanguages: string[];
  adultContent: boolean;
  familyFriendly: boolean;
  librarySort: SortOrder;
  continueWatchingEnabled: boolean;
  recommendationsEnabled: boolean;
}

export interface PrivacyPreferences {
  watchHistoryEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  personalizationEnabled: boolean;
  shareWatchHistory: boolean;
}

export interface NotificationPreferences {
  newEpisodes: boolean;
  recommendations: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrastMode: boolean;
}

interface UserPreferencesStore extends 
  PlayerPreferences,
  UIPreferences,
  ContentPreferences,
  PrivacyPreferences,
  NotificationPreferences,
  AccessibilityPreferences {
  
  // Actions - Player Preferences
  setAutoPlay: (enabled: boolean) => void;
  setAutoPlayNext: (enabled: boolean) => void;
  setDefaultQuality: (quality: Quality) => void;
  setDefaultVolume: (volume: number) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  setSubtitleLanguage: (language: string) => void;
  setAudioLanguage: (language: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSkipIntro: (enabled: boolean) => void;
  setSkipCredits: (enabled: boolean) => void;

  // Actions - UI Preferences
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setCompactMode: (enabled: boolean) => void;
  setShowThumbnails: (enabled: boolean) => void;
  setAnimatedBackgrounds: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;

  // Actions - Content Preferences
  setPreferredGenres: (genres: string[]) => void;
  addPreferredGenre: (genre: string) => void;
  removePreferredGenre: (genre: string) => void;
  setBlockedGenres: (genres: string[]) => void;
  addBlockedGenre: (genre: string) => void;
  removeBlockedGenre: (genre: string) => void;
  setPreferredLanguages: (languages: string[]) => void;
  setAdultContent: (enabled: boolean) => void;
  setFamilyFriendly: (enabled: boolean) => void;
  setLibrarySort: (sort: SortOrder) => void;
  setContinueWatchingEnabled: (enabled: boolean) => void;
  setRecommendationsEnabled: (enabled: boolean) => void;

  // Actions - Privacy Preferences
  setWatchHistoryEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setCrashReportsEnabled: (enabled: boolean) => void;
  setPersonalizationEnabled: (enabled: boolean) => void;
  setShareWatchHistory: (enabled: boolean) => void;

  // Actions - Notification Preferences
  setNewEpisodes: (enabled: boolean) => void;
  setRecommendations: (enabled: boolean) => void;
  setSystemUpdates: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setNotificationSound: (enabled: boolean) => void;

  // Actions - Accessibility Preferences
  setFontSize: (size: AccessibilityPreferences['fontSize']) => void;
  setScreenReader: (enabled: boolean) => void;
  setKeyboardNavigation: (enabled: boolean) => void;
  setFocusVisible: (enabled: boolean) => void;
  setColorBlindMode: (mode: AccessibilityPreferences['colorBlindMode']) => void;
  setHighContrastMode: (enabled: boolean) => void;

  // Utility Actions
  resetAllPreferences: () => void;
  resetToDefaults: (category: keyof Omit<UserPreferencesStore, 'resetAllPreferences' | 'resetToDefaults'>) => void;
  exportPreferences: () => string;
  importPreferences: (preferencesJson: string) => void;
}

// Default values
const defaultPlayerPreferences: PlayerPreferences = {
  autoPlay: true,
  autoPlayNext: true,
  defaultQuality: 'auto',
  defaultVolume: 1,
  subtitlesEnabled: true,
  subtitleLanguage: 'en',
  audioLanguage: 'en',
  playbackSpeed: 1,
  skipIntro: true,
  skipCredits: false,
};

const defaultUIPreferences: UIPreferences = {
  theme: 'nova',
  language: 'en',
  compactMode: false,
  showThumbnails: true,
  animatedBackgrounds: true,
  reduceMotion: false,
  highContrast: false,
};

const defaultContentPreferences: ContentPreferences = {
  preferredGenres: [],
  blockedGenres: [],
  preferredLanguages: ['en'],
  adultContent: false,
  familyFriendly: false,
  librarySort: 'recent',
  continueWatchingEnabled: true,
  recommendationsEnabled: true,
};

const defaultPrivacyPreferences: PrivacyPreferences = {
  watchHistoryEnabled: true,
  analyticsEnabled: false,
  crashReportsEnabled: true,
  personalizationEnabled: true,
  shareWatchHistory: false,
};

const defaultNotificationPreferences: NotificationPreferences = {
  newEpisodes: true,
  recommendations: true,
  systemUpdates: true,
  emailNotifications: false,
  pushNotifications: true,
  soundEnabled: true,
};

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  fontSize: 'medium',
  screenReader: false,
  keyboardNavigation: true,
  focusVisible: true,
  colorBlindMode: 'none',
  highContrastMode: false,
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        ...defaultPlayerPreferences,
        ...defaultUIPreferences,
        ...defaultContentPreferences,
        ...defaultPrivacyPreferences,
        ...defaultNotificationPreferences,
        ...defaultAccessibilityPreferences,

        // Player Preferences Actions
        setAutoPlay: (autoPlay) => set({ autoPlay }),
        setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
        setDefaultQuality: (defaultQuality) => set({ defaultQuality }),
        setDefaultVolume: (defaultVolume) => set({ defaultVolume }),
        setSubtitlesEnabled: (subtitlesEnabled) => set({ subtitlesEnabled }),
        setSubtitleLanguage: (subtitleLanguage) => set({ subtitleLanguage }),
        setAudioLanguage: (audioLanguage) => set({ audioLanguage }),
        setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
        setSkipIntro: (skipIntro) => set({ skipIntro }),
        setSkipCredits: (skipCredits) => set({ skipCredits }),

        // UI Preferences Actions
        setTheme: (theme) => {
          set({ theme });
          
          // Apply theme to DOM immediately
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.remove('theme-nova', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
            if (theme !== 'nova') {
              root.classList.add(`theme-${theme}`);
            }
          }
        },
        
        setLanguage: (language) => set({ language }),
        setCompactMode: (compactMode) => set({ compactMode }),
        setShowThumbnails: (showThumbnails) => set({ showThumbnails }),
        setAnimatedBackgrounds: (animatedBackgrounds) => set({ animatedBackgrounds }),
        setReduceMotion: (reduceMotion) => set({ reduceMotion }),
        setHighContrast: (highContrast) => set({ highContrast }),

        // Content Preferences Actions
        setPreferredGenres: (preferredGenres) => set({ preferredGenres }),
        addPreferredGenre: (genre) => 
          set((state) => ({
            preferredGenres: state.preferredGenres.includes(genre) 
              ? state.preferredGenres 
              : [...state.preferredGenres, genre],
          })),
        removePreferredGenre: (genre) => 
          set((state) => ({
            preferredGenres: state.preferredGenres.filter(g => g !== genre),
          })),
        setBlockedGenres: (blockedGenres) => set({ blockedGenres }),
        addBlockedGenre: (genre) => 
          set((state) => ({
            blockedGenres: state.blockedGenres.includes(genre) 
              ? state.blockedGenres 
              : [...state.blockedGenres, genre],
          })),
        removeBlockedGenre: (genre) => 
          set((state) => ({
            blockedGenres: state.blockedGenres.filter(g => g !== genre),
          })),
        setPreferredLanguages: (preferredLanguages) => set({ preferredLanguages }),
        setAdultContent: (adultContent) => set({ adultContent }),
        setFamilyFriendly: (familyFriendly) => set({ familyFriendly }),
        setLibrarySort: (librarySort) => set({ librarySort }),
        setContinueWatchingEnabled: (continueWatchingEnabled) => set({ continueWatchingEnabled }),
        setRecommendationsEnabled: (recommendationsEnabled) => set({ recommendationsEnabled }),

        // Privacy Preferences Actions
        setWatchHistoryEnabled: (watchHistoryEnabled) => set({ watchHistoryEnabled }),
        setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
        setCrashReportsEnabled: (crashReportsEnabled) => set({ crashReportsEnabled }),
        setPersonalizationEnabled: (personalizationEnabled) => set({ personalizationEnabled }),
        setShareWatchHistory: (shareWatchHistory) => set({ shareWatchHistory }),

        // Notification Preferences Actions
        setNewEpisodes: (newEpisodes) => set({ newEpisodes }),
        setRecommendations: (recommendations) => set({ recommendations }),
        setSystemUpdates: (systemUpdates) => set({ systemUpdates }),
        setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
        setPushNotifications: (pushNotifications) => set({ pushNotifications }),
        setNotificationSound: (soundEnabled) => set({ soundEnabled }),

        // Accessibility Preferences Actions
        setFontSize: (fontSize) => set({ fontSize }),
        setScreenReader: (screenReader) => set({ screenReader }),
        setKeyboardNavigation: (keyboardNavigation) => set({ keyboardNavigation }),
        setFocusVisible: (focusVisible) => set({ focusVisible }),
        setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
        setHighContrastMode: (highContrastMode) => set({ highContrastMode }),

        // Utility Actions
        resetAllPreferences: () => {
          set({
            ...defaultPlayerPreferences,
            ...defaultUIPreferences,
            ...defaultContentPreferences,
            ...defaultPrivacyPreferences,
            ...defaultNotificationPreferences,
            ...defaultAccessibilityPreferences,
          });
          
          // Apply theme to DOM
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.remove('theme-nova', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
          }
        },

        resetToDefaults: (category) => {
          switch (category) {
            case 'theme':
              set({ ...defaultUIPreferences });
              // Apply theme to DOM
              if (typeof document !== 'undefined') {
                const root = document.documentElement;
                root.classList.remove('theme-nova', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
              }
              break;
            case 'defaultQuality':
            case 'defaultVolume':
              set({ ...defaultPlayerPreferences });
              break;
            case 'librarySort':
              set({ ...defaultContentPreferences });
              break;
            case 'watchHistoryEnabled':
              set({ ...defaultPrivacyPreferences });
              break;
            case 'newEpisodes':
              set({ ...defaultNotificationPreferences });
              break;
            case 'fontSize':
              set({ ...defaultAccessibilityPreferences });
              break;
          }
        },

        exportPreferences: () => {
          const state = get();
          const preferences = {
            player: {
              autoPlay: state.autoPlay,
              autoPlayNext: state.autoPlayNext,
              defaultQuality: state.defaultQuality,
              defaultVolume: state.defaultVolume,
              subtitlesEnabled: state.subtitlesEnabled,
              subtitleLanguage: state.subtitleLanguage,
              audioLanguage: state.audioLanguage,
              playbackSpeed: state.playbackSpeed,
              skipIntro: state.skipIntro,
              skipCredits: state.skipCredits,
            },
            ui: {
              theme: state.theme,
              language: state.language,
              compactMode: state.compactMode,
              showThumbnails: state.showThumbnails,
              animatedBackgrounds: state.animatedBackgrounds,
              reduceMotion: state.reduceMotion,
              highContrast: state.highContrast,
            },
            content: {
              preferredGenres: state.preferredGenres,
              blockedGenres: state.blockedGenres,
              preferredLanguages: state.preferredLanguages,
              adultContent: state.adultContent,
              familyFriendly: state.familyFriendly,
              librarySort: state.librarySort,
              continueWatchingEnabled: state.continueWatchingEnabled,
              recommendationsEnabled: state.recommendationsEnabled,
            },
            privacy: {
              watchHistoryEnabled: state.watchHistoryEnabled,
              analyticsEnabled: state.analyticsEnabled,
              crashReportsEnabled: state.crashReportsEnabled,
              personalizationEnabled: state.personalizationEnabled,
              shareWatchHistory: state.shareWatchHistory,
            },
            notifications: {
              newEpisodes: state.newEpisodes,
              recommendations: state.recommendations,
              systemUpdates: state.systemUpdates,
              emailNotifications: state.emailNotifications,
              pushNotifications: state.pushNotifications,
              soundEnabled: state.soundEnabled,
            },
            accessibility: {
              fontSize: state.fontSize,
              screenReader: state.screenReader,
              keyboardNavigation: state.keyboardNavigation,
              focusVisible: state.focusVisible,
              colorBlindMode: state.colorBlindMode,
              highContrastMode: state.highContrastMode,
            },
          };
          
          return JSON.stringify(preferences, null, 2);
        },

        importPreferences: (preferencesJson) => {
          try {
            const preferences = JSON.parse(preferencesJson);
            
            // Apply imported preferences
            if (preferences.player) set({ ...preferences.player });
            if (preferences.ui) {
              set({ ...preferences.ui });
              // Apply theme to DOM
              if (preferences.ui.theme && typeof document !== 'undefined') {
                const root = document.documentElement;
                root.classList.remove('theme-nova', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
                if (preferences.ui.theme !== 'nova') {
                  root.classList.add(`theme-${preferences.ui.theme}`);
                }
              }
            }
            if (preferences.content) set({ ...preferences.content });
            if (preferences.privacy) set({ ...preferences.privacy });
            if (preferences.notifications) set({ ...preferences.notifications });
            if (preferences.accessibility) set({ ...preferences.accessibility });
          } catch (error) {
            console.error('Failed to import preferences:', error);
          }
        },
      }),
      {
        name: 'novastream-preferences',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist all preferences except volatile ones
          autoPlay: state.autoPlay,
          autoPlayNext: state.autoPlayNext,
          defaultQuality: state.defaultQuality,
          defaultVolume: state.defaultVolume,
          subtitlesEnabled: state.subtitlesEnabled,
          subtitleLanguage: state.subtitleLanguage,
          audioLanguage: state.audioLanguage,
          playbackSpeed: state.playbackSpeed,
          skipIntro: state.skipIntro,
          skipCredits: state.skipCredits,
          
          theme: state.theme,
          language: state.language,
          compactMode: state.compactMode,
          showThumbnails: state.showThumbnails,
          animatedBackgrounds: state.animatedBackgrounds,
          reduceMotion: state.reduceMotion,
          highContrast: state.highContrast,
          
          preferredGenres: state.preferredGenres,
          blockedGenres: state.blockedGenres,
          preferredLanguages: state.preferredLanguages,
          adultContent: state.adultContent,
          familyFriendly: state.familyFriendly,
          librarySort: state.librarySort,
          continueWatchingEnabled: state.continueWatchingEnabled,
          recommendationsEnabled: state.recommendationsEnabled,
          
          watchHistoryEnabled: state.watchHistoryEnabled,
          analyticsEnabled: state.analyticsEnabled,
          crashReportsEnabled: state.crashReportsEnabled,
          personalizationEnabled: state.personalizationEnabled,
          shareWatchHistory: state.shareWatchHistory,
          
          newEpisodes: state.newEpisodes,
          recommendations: state.recommendations,
          systemUpdates: state.systemUpdates,
          emailNotifications: state.emailNotifications,
          pushNotifications: state.pushNotifications,
          soundEnabled: state.soundEnabled,
          
          fontSize: state.fontSize,
          screenReader: state.screenReader,
          keyboardNavigation: state.keyboardNavigation,
          focusVisible: state.focusVisible,
          colorBlindMode: state.colorBlindMode,
          highContrastMode: state.highContrastMode,
        }),
      }
    )
  )
);

// Selectors for optimized subscriptions
export const usePlayerPreferences = () => 
  useUserPreferencesStore((state) => ({
    autoPlay: state.autoPlay,
    autoPlayNext: state.autoPlayNext,
    defaultQuality: state.defaultQuality,
    defaultVolume: state.defaultVolume,
    subtitlesEnabled: state.subtitlesEnabled,
    subtitleLanguage: state.subtitleLanguage,
    audioLanguage: state.audioLanguage,
    playbackSpeed: state.playbackSpeed,
    skipIntro: state.skipIntro,
    skipCredits: state.skipCredits,
  }), shallow);

export const useUIPreferences = () => 
  useUserPreferencesStore((state) => ({
    theme: state.theme,
    language: state.language,
    compactMode: state.compactMode,
    showThumbnails: state.showThumbnails,
    animatedBackgrounds: state.animatedBackgrounds,
    reduceMotion: state.reduceMotion,
    highContrast: state.highContrast,
  }), shallow);

export const useTheme = () => useUserPreferencesStore((state) => state.theme);

export const useContentPreferences = () => 
  useUserPreferencesStore((state) => ({
    preferredGenres: state.preferredGenres,
    blockedGenres: state.blockedGenres,
    preferredLanguages: state.preferredLanguages,
    adultContent: state.adultContent,
    familyFriendly: state.familyFriendly,
    librarySort: state.librarySort,
    continueWatchingEnabled: state.continueWatchingEnabled,
    recommendationsEnabled: state.recommendationsEnabled,
  }), shallow);

// Development utilities
if (process.env.NODE_ENV === 'development') {
  useUserPreferencesStore.subscribe(
    (state) => state.theme,
    (theme) => {
      console.log('🎨 Theme changed to:', theme);
    }
  );
}