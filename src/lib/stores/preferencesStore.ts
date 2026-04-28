/**
 * Consolidated User Preferences Store
 * Handles all user settings, preferences, and theme management
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { SOURCES } from '@/lib/config/sources';

// Types
export type Theme = 'Mai' | 'ocean' | 'cyberpunk' | 'oled';
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

export interface SubtitlePreferences {
  subtitleSize: number;
  subtitleColor: string;
  subtitleBackground: string;
  subtitleFont: 'Inter' | 'Roboto' | 'Outfit' | 'system-ui';
  subtitleOpacity: number;
}

export interface UIPreferences {
  theme: Theme;
  language: Language;
  compactMode: boolean;
  showThumbnails: boolean;
  animatedBackgrounds: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  hardwareAcceleration: boolean;
  activeSourceId: string;
  playerSettings: {
    volume: number;
    muted: boolean;
    playbackRate: number;
    quality: string;
  };
  oledOptimization: boolean;
  adaptiveColorSpace: boolean;
  hasCompletedOnboarding: boolean;
}

export interface ContentPreferences {
  preferredGenres: string[];
  genreWeights?: Record<string, number>;
  preferredVibes: string[];
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

interface UserPreferencesStore
  extends
    PlayerPreferences,
    UIPreferences,
    ContentPreferences,
    PrivacyPreferences,
    NotificationPreferences,
    AccessibilityPreferences,
    SubtitlePreferences {
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
  setHardwareAcceleration: (enabled: boolean) => void;
  setActiveSourceId: (id: string) => void;
  setPlayerSettings: (settings: Partial<UIPreferences['playerSettings']>) => void;
  setOledOptimization: (enabled: boolean) => void;
  setAdaptiveColorSpace: (enabled: boolean) => void;
  setHasCompletedOnboarding: (enabled: boolean) => void;

  // Actions - Content Preferences
  setPreferredGenres: (genres: string[]) => void;
  setGenreWeights: (weights: Record<string, number>) => void;
  addPreferredGenre: (genre: string) => void;
  removePreferredGenre: (genre: string) => void;
  setPreferredVibes: (vibes: string[]) => void;
  addPreferredVibe: (vibe: string) => void;
  removePreferredVibe: (vibe: string) => void;
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

  // Actions - Subtitle Preferences
  setSubtitleSize: (size: number) => void;
  setSubtitleColor: (color: string) => void;
  setSubtitleBackground: (background: string) => void;
  setSubtitleFont: (font: SubtitlePreferences['subtitleFont']) => void;
  setSubtitleOpacity: (opacity: number) => void;

  // Utility Actions
  resetAllPreferences: () => void;
  resetToDefaults: (category: keyof Omit<UserPreferencesStore, 'resetAllPreferences' | 'resetToDefaults'>) => void;
  exportPreferences: () => string;
  importPreferences: (preferencesJson: string) => void;
  cycleToNextSource: () => void;
}

// Default values
const defaultPlayerPreferences: PlayerPreferences = {
  autoPlay: true,
  autoPlayNext: true,
  defaultQuality: 'auto',
  defaultVolume: 1,
  subtitlesEnabled: true,
  subtitleLanguage: 'en',
  audioLanguage: 'dub',
  playbackSpeed: 1,
  skipIntro: true,
  skipCredits: false,
};

const defaultUIPreferences: UIPreferences = {
  theme: 'Mai',
  language: 'en',
  compactMode: false,
  showThumbnails: true,
  animatedBackgrounds: true,
  reduceMotion: false,
  highContrast: false,
  hardwareAcceleration: true,
  activeSourceId: 'vidlink',
  playerSettings: {
    volume: 1,
    muted: false,
    playbackRate: 1,
    quality: 'auto',
  },
  oledOptimization: true,
  adaptiveColorSpace: true,
  hasCompletedOnboarding: false,
};

const defaultContentPreferences: ContentPreferences = {
  preferredGenres: [],
  genreWeights: {},
  preferredVibes: [],
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

const defaultSubtitlePreferences: SubtitlePreferences = {
  subtitleSize: 24,
  subtitleColor: '#FFFFFF',
  subtitleBackground: 'rgba(0, 0, 0, 0.5)',
  subtitleFont: 'Outfit',
  subtitleOpacity: 1,
};

export const usePreferencesStore = createWithEqualityFn<UserPreferencesStore>()(
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
        ...defaultSubtitlePreferences,

        // Player Preferences Actions
        setAutoPlay: autoPlay => set({ autoPlay }),
        setAutoPlayNext: autoPlayNext => set({ autoPlayNext }),
        setDefaultQuality: defaultQuality => set({ defaultQuality }),
        setDefaultVolume: defaultVolume => set({ defaultVolume }),
        setSubtitlesEnabled: subtitlesEnabled => set({ subtitlesEnabled }),
        setSubtitleLanguage: subtitleLanguage => set({ subtitleLanguage }),
        setAudioLanguage: audioLanguage => set({ audioLanguage }),
        setPlaybackSpeed: playbackSpeed => set({ playbackSpeed }),
        setSkipIntro: skipIntro => set({ skipIntro }),
        setSkipCredits: skipCredits => set({ skipCredits }),

        // UI Preferences Actions
        setTheme: theme => {
          set({ theme });

          // Apply theme to DOM immediately
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.remove('theme-Mai', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
            if (theme !== 'Mai') {
              root.classList.add(`theme-${theme}`);
            }
          }
        },

        setLanguage: language => set({ language }),
        setCompactMode: compactMode => set({ compactMode }),
        setShowThumbnails: showThumbnails => set({ showThumbnails }),
        setAnimatedBackgrounds: animatedBackgrounds => set({ animatedBackgrounds }),
        setReduceMotion: reduceMotion => set({ reduceMotion }),
        setHighContrast: highContrast => set({ highContrast }),
        setHardwareAcceleration: hardwareAcceleration => set({ hardwareAcceleration }),
        setActiveSourceId: activeSourceId => set({ activeSourceId }),
        setPlayerSettings: playerSettings =>
          set(state => ({
            playerSettings: { ...state.playerSettings, ...playerSettings },
          })),
        setOledOptimization: oledOptimization => {
          set({ oledOptimization });
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('oled-blackout', oledOptimization);
          }
        },
        setAdaptiveColorSpace: adaptiveColorSpace => set({ adaptiveColorSpace }),
        setHasCompletedOnboarding: hasCompletedOnboarding => set({ hasCompletedOnboarding }),

        cycleToNextSource: () => {
          const currentId = get().activeSourceId;
          const currentIndex = SOURCES.findIndex(s => s.id === currentId);
          const nextIndex = (currentIndex + 1) % SOURCES.length;
          const nextSource = SOURCES[nextIndex];
          set({ activeSourceId: nextSource.id });
        },

        // Content Preferences Actions
        setPreferredGenres: preferredGenres => set({ preferredGenres }),
        setGenreWeights: genreWeights => set({ genreWeights }),
        addPreferredGenre: genre =>
          set(state => ({
            preferredGenres: state.preferredGenres.includes(genre)
              ? state.preferredGenres
              : [...state.preferredGenres, genre],
          })),
        removePreferredGenre: genre =>
          set(state => ({
            preferredGenres: state.preferredGenres.filter(g => g !== genre),
          })),
        setPreferredVibes: preferredVibes => set({ preferredVibes }),
        addPreferredVibe: vibe =>
          set(state => ({
            preferredVibes: state.preferredVibes.includes(vibe)
              ? state.preferredVibes
              : [...state.preferredVibes, vibe],
          })),
        removePreferredVibe: vibe =>
          set(state => ({
            preferredVibes: state.preferredVibes.filter(v => v !== vibe),
          })),
        setBlockedGenres: blockedGenres => set({ blockedGenres }),
        addBlockedGenre: genre =>
          set(state => ({
            blockedGenres: state.blockedGenres.includes(genre) ? state.blockedGenres : [...state.blockedGenres, genre],
          })),
        removeBlockedGenre: genre =>
          set(state => ({
            blockedGenres: state.blockedGenres.filter(g => g !== genre),
          })),
        setPreferredLanguages: preferredLanguages => set({ preferredLanguages }),
        setAdultContent: adultContent => set({ adultContent }),
        setFamilyFriendly: familyFriendly => set({ familyFriendly }),
        setLibrarySort: librarySort => set({ librarySort }),
        setContinueWatchingEnabled: continueWatchingEnabled => set({ continueWatchingEnabled }),
        setRecommendationsEnabled: recommendationsEnabled => set({ recommendationsEnabled }),

        // Privacy Preferences Actions
        setWatchHistoryEnabled: watchHistoryEnabled => set({ watchHistoryEnabled }),
        setAnalyticsEnabled: analyticsEnabled => set({ analyticsEnabled }),
        setCrashReportsEnabled: crashReportsEnabled => set({ crashReportsEnabled }),
        setPersonalizationEnabled: personalizationEnabled => set({ personalizationEnabled }),
        setShareWatchHistory: shareWatchHistory => set({ shareWatchHistory }),

        // Notification Preferences Actions
        setNewEpisodes: newEpisodes => set({ newEpisodes }),
        setRecommendations: recommendations => set({ recommendations }),
        setSystemUpdates: systemUpdates => set({ systemUpdates }),
        setEmailNotifications: emailNotifications => set({ emailNotifications }),
        setPushNotifications: pushNotifications => set({ pushNotifications }),
        setNotificationSound: soundEnabled => set({ soundEnabled }),

        // Accessibility Preferences Actions
        setFontSize: fontSize => set({ fontSize }),
        setScreenReader: screenReader => set({ screenReader }),
        setKeyboardNavigation: keyboardNavigation => set({ keyboardNavigation }),
        setFocusVisible: focusVisible => set({ focusVisible }),
        setColorBlindMode: colorBlindMode => set({ colorBlindMode }),
        setHighContrastMode: highContrastMode => set({ highContrastMode }),

        // Subtitle Preferences Actions
        setSubtitleSize: subtitleSize => set({ subtitleSize }),
        setSubtitleColor: subtitleColor => set({ subtitleColor }),
        setSubtitleBackground: subtitleBackground => set({ subtitleBackground }),
        setSubtitleFont: subtitleFont => set({ subtitleFont }),
        setSubtitleOpacity: subtitleOpacity => set({ subtitleOpacity }),

        // Utility Actions
        resetAllPreferences: () => {
          set({
            ...defaultPlayerPreferences,
            ...defaultUIPreferences,
            ...defaultContentPreferences,
            ...defaultPrivacyPreferences,
            ...defaultNotificationPreferences,
            ...defaultAccessibilityPreferences,
            ...defaultSubtitlePreferences,
          });

          // Apply theme to DOM
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.classList.remove('theme-Mai', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
          }
        },

        resetToDefaults: category => {
          switch (category) {
            case 'theme':
              set({ ...defaultUIPreferences });
              // Apply theme to DOM
              if (typeof document !== 'undefined') {
                const root = document.documentElement;
                root.classList.remove('theme-Mai', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
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
              hardwareAcceleration: state.hardwareAcceleration,
              activeSourceId: state.activeSourceId,
              playerSettings: state.playerSettings,
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
            subtitles: {
              subtitleSize: state.subtitleSize,
              subtitleColor: state.subtitleColor,
              subtitleBackground: state.subtitleBackground,
              subtitleFont: state.subtitleFont,
              subtitleOpacity: state.subtitleOpacity,
            },
          };

          return JSON.stringify(preferences, null, 2);
        },

        importPreferences: preferencesJson => {
          try {
            const preferences = JSON.parse(preferencesJson);

            // Apply imported preferences
            if (preferences.player) set({ ...preferences.player });
            if (preferences.ui) {
              set({ ...preferences.ui });
              // Apply theme to DOM
              if (preferences.ui.theme && typeof document !== 'undefined') {
                const root = document.documentElement;
                root.classList.remove('theme-Mai', 'theme-ocean', 'theme-cyberpunk', 'theme-oled');
                if (preferences.ui.theme !== 'Mai') {
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
        name: 'MaiWatch-preferences',
        storage: createJSONStorage(() => localStorage),
        partialize: state => ({
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
          hardwareAcceleration: state.hardwareAcceleration,
          activeSourceId: state.activeSourceId,
          playerSettings: state.playerSettings,
          oledOptimization: state.oledOptimization,
          adaptiveColorSpace: state.adaptiveColorSpace,
          hasCompletedOnboarding: state.hasCompletedOnboarding,

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

          subtitleSize: state.subtitleSize,
          subtitleColor: state.subtitleColor,
          subtitleBackground: state.subtitleBackground,
          subtitleFont: state.subtitleFont,
          subtitleOpacity: state.subtitleOpacity,
        }),
      }
    )
  )
);

export const usePreferencesActions = () =>
  usePreferencesStore(
    state => ({
      setAutoPlay: state.setAutoPlay,
      setAutoPlayNext: state.setAutoPlayNext,
      setDefaultQuality: state.setDefaultQuality,
      setDefaultVolume: state.setDefaultVolume,
      setSubtitlesEnabled: state.setSubtitlesEnabled,
      setSubtitleLanguage: state.setSubtitleLanguage,
      setAudioLanguage: state.setAudioLanguage,
      setPlaybackSpeed: state.setPlaybackSpeed,
      setSkipIntro: state.setSkipIntro,
      setSkipCredits: state.setSkipCredits,
      setTheme: state.setTheme,
      setLanguage: state.setLanguage,
      setCompactMode: state.setCompactMode,
      setShowThumbnails: state.setShowThumbnails,
      setAnimatedBackgrounds: state.setAnimatedBackgrounds,
      setReduceMotion: state.setReduceMotion,
      setHighContrast: state.setHighContrast,
      setHardwareAcceleration: state.setHardwareAcceleration,
      setActiveSourceId: state.setActiveSourceId,
      setPlayerSettings: state.setPlayerSettings,
      setPreferredGenres: state.setPreferredGenres,
      setGenreWeights: state.setGenreWeights,
      setPreferredVibes: state.setPreferredVibes,
      addPreferredVibe: state.addPreferredVibe,
      removePreferredVibe: state.removePreferredVibe,
      addPreferredGenre: state.addPreferredGenre,
      removePreferredGenre: state.removePreferredGenre,
      setBlockedGenres: state.setBlockedGenres,
      addBlockedGenre: state.addBlockedGenre,
      removeBlockedGenre: state.removeBlockedGenre,
      setPreferredLanguages: state.setPreferredLanguages,
      setAdultContent: state.setAdultContent,
      setFamilyFriendly: state.setFamilyFriendly,
      setLibrarySort: state.setLibrarySort,
      setContinueWatchingEnabled: state.setContinueWatchingEnabled,
      setRecommendationsEnabled: state.setRecommendationsEnabled,
      setWatchHistoryEnabled: state.setWatchHistoryEnabled,
      setAnalyticsEnabled: state.setAnalyticsEnabled,
      setCrashReportsEnabled: state.setCrashReportsEnabled,
      setPersonalizationEnabled: state.setPersonalizationEnabled,
      setShareWatchHistory: state.setShareWatchHistory,
      setNewEpisodes: state.setNewEpisodes,
      setRecommendations: state.setRecommendations,
      setSystemUpdates: state.setSystemUpdates,
      setEmailNotifications: state.setEmailNotifications,
      setPushNotifications: state.setPushNotifications,
      setNotificationSound: state.setNotificationSound,
      setFontSize: state.setFontSize,
      setScreenReader: state.setScreenReader,
      setKeyboardNavigation: state.setKeyboardNavigation,
      setFocusVisible: state.setFocusVisible,
      setColorBlindMode: state.setColorBlindMode,
      setHighContrastMode: state.setHighContrastMode,
      resetAllPreferences: state.resetAllPreferences,
      resetToDefaults: state.resetToDefaults,
      importPreferences: state.importPreferences,
      cycleToNextSource: state.cycleToNextSource,
      setOledOptimization: state.setOledOptimization,
      setAdaptiveColorSpace: state.setAdaptiveColorSpace,
      setHasCompletedOnboarding: state.setHasCompletedOnboarding,
    }),
    shallow
  );

// Selectors for optimized subscriptions
export const usePlayerPreferences = () =>
  usePreferencesStore(
    state => ({
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
    }),
    shallow
  );

export const useUIPreferences = () =>
  usePreferencesStore(
    state => ({
      theme: state.theme,
      language: state.language,
      compactMode: state.compactMode,
      showThumbnails: state.showThumbnails,
      animatedBackgrounds: state.animatedBackgrounds,
      reduceMotion: state.reduceMotion,
      highContrast: state.highContrast,
      hardwareAcceleration: state.hardwareAcceleration,
      activeSourceId: state.activeSourceId,
      playerSettings: state.playerSettings,
      oledOptimization: state.oledOptimization,
      adaptiveColorSpace: state.adaptiveColorSpace,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
    }),
    shallow
  );

export const useTheme = () => usePreferencesStore(state => state.theme);

export const useContentPreferences = () =>
  usePreferencesStore(
    state => ({
      preferredGenres: state.preferredGenres,
      genreWeights: state.genreWeights,
      blockedGenres: state.blockedGenres,
      preferredLanguages: state.preferredLanguages,
      adultContent: state.adultContent,
      familyFriendly: state.familyFriendly,
      librarySort: state.librarySort,
      continueWatchingEnabled: state.continueWatchingEnabled,
      recommendationsEnabled: state.recommendationsEnabled,
    }),
    shallow
  );

export const useActiveSource = () =>
  usePreferencesStore(state => {
    const source = SOURCES.find(s => s.id === state.activeSourceId);
    return source || SOURCES[0];
  }, shallow);

// Development utilities
if (process.env.NODE_ENV === 'development') {
  usePreferencesStore.subscribe(
    state => state.theme,
    theme => {
      console.log('🎨 Theme changed to:', theme);
    }
  );
}

// Backward compatibility alias
export const useUserPreferencesStore = usePreferencesStore;
