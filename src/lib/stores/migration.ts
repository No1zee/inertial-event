/**
 * NovaStream State Migration Utility (Simplified)
 *
 * This utility helps migrate from old scattered state management
 * to new consolidated architecture while maintaining backward compatibility.
 * It reads directly from localStorage to avoid import issues.
 */

import { usePlayerStore, useUIStore, useUserPreferencesStore, useLocalDataStore, useAuthStore } from './index';
import { Theme, Quality, SortOrder } from './preferencesStore';
import { User } from './authStore';

interface MigrationResult {
  success: boolean;
  migrated: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Safely parse JSON from localStorage
 */
const safeParseJSON = (key: string): unknown => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Failed to parse ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Migrates data from old stores to new consolidated stores
 */
export const migrateState = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    migrated: [],
    errors: [],
    warnings: [],
  };

  try {
    console.log('🔄 Starting NovaStream state migration...');

    // 0. Brand Migration (MaiWatch -> NovaStream)
    const brandMappings = {
      'MaiWatch-player': 'NovaStream-player',
      'MaiWatch-ui': 'NovaStream-ui',
      'MaiWatch-preferences': 'NovaStream-preferences',
      'MaiWatch-local-data': 'NovaStream-local-data',
      'MaiWatch-auth': 'NovaStream-auth',
      'MaiWatch-theme': 'NovaStream-theme',
    };

    Object.entries(brandMappings).forEach(([oldKey, newKey]) => {
      const data = localStorage.getItem(oldKey);
      if (data && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, data);
        result.migrated.push(`Brand migration: ${oldKey} -> ${newKey}`);
        console.log(`✅ Migrated brand key: ${oldKey} -> ${newKey}`);
      }
    });

    // 1. Migrate Player State
    try {
      const oldPlayerData = safeParseJSON('MaiWatch-player-storage') as { state?: Record<string, unknown> } | null;
      if (oldPlayerData?.state) {
        const oldPlayer = oldPlayerData.state;
        const newPlayer = usePlayerStore.getState();

        if (oldPlayer.volume !== undefined) {
          newPlayer.setVolume(Number(oldPlayer.volume));
          newPlayer.setMuted(Boolean(oldPlayer.muted));
          newPlayer.setPlaybackRate(Number(oldPlayer.playbackRate || 1));
          result.migrated.push('Player audio preferences');
        }

        if (oldPlayer.quality && oldPlayer.quality !== 'auto') {
          const quality = String(oldPlayer.quality);
          if (['auto', '4k', '1080p', '720p', '480p', '360p'].includes(quality)) {
            newPlayer.setQuality(quality as Quality);
            result.migrated.push('Player quality preference');
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate player state: ${error}`);
      result.success = false;
    }

    // 2. Migrate UI State
    try {
      const oldUIData = safeParseJSON('ui-storage') as { state?: Record<string, unknown> } | null;
      if (oldUIData?.state) {
        const oldUI = oldUIData.state;
        const newUI = useUIStore.getState();

        if (oldUI.sidebarOpen !== undefined) {
          newUI.setSidebarOpen(Boolean(oldUI.sidebarOpen));
          result.migrated.push('Sidebar state');
        }

        // Migrate channel states
        const channelStates = (oldUI.channelStates || {}) as Record<string, Record<string, unknown>>;
        Object.entries(channelStates).forEach(([channelId, state]) => {
          if (state && typeof state.scrollPos === 'number') {
            newUI.setChannelScrollPosition(channelId, state.scrollPos);
          }
          if (state && typeof state.visibleCount === 'number') {
            newUI.setChannelVisibleCount(channelId, state.visibleCount);
          }
        });

        if (Object.keys(channelStates).length > 0) {
          result.migrated.push('Channel states');
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate UI state: ${error}`);
      result.success = false;
    }

    // 3. Migrate Theme
    try {
      const oldThemeData = safeParseJSON('MaiWatch-theme') as { state?: { theme?: string } } | null;
      if (oldThemeData?.state?.theme) {
        const oldTheme = oldThemeData.state.theme;
        const newPrefs = useUserPreferencesStore.getState();

        if (oldTheme !== 'Mai') {
          const theme = String(oldTheme);
          if (['Mai', 'ocean', 'cyberpunk', 'oled'].includes(theme)) {
            newPrefs.setTheme(theme as Theme);
            result.migrated.push('Theme preference');
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate theme: ${error}`);
      result.success = false;
    }

    // 4. Migrate Settings
    try {
      const oldSettingsData = safeParseJSON('MaiWatch-settings') as { state?: Record<string, unknown> } | null;
      if (oldSettingsData?.state) {
        const oldSettings = oldSettingsData.state;
        const newPrefs = useUserPreferencesStore.getState();

        const settingsMigrated: string[] = [];

        if (oldSettings.quality) {
          const quality = String(oldSettings.quality);
          if (['auto', '4k', '1080p', '720p', '480p', '360p'].includes(quality)) {
            newPrefs.setDefaultQuality(quality as Quality);
            settingsMigrated.push('quality');
          }
        }

        if (oldSettings.volume !== undefined) {
          newPrefs.setDefaultVolume(Number(oldSettings.volume));
          settingsMigrated.push('volume');
        }

        if (oldSettings.subtitleLanguage) {
          newPrefs.setSubtitleLanguage(String(oldSettings.subtitleLanguage));
          settingsMigrated.push('subtitle language');
        }

        if (oldSettings.subtitleEnabled !== undefined) {
          newPrefs.setSubtitlesEnabled(Boolean(oldSettings.subtitleEnabled));
          settingsMigrated.push('subtitle enabled');
        }

        if (oldSettings.autoplay !== undefined) {
          newPrefs.setAutoPlay(Boolean(oldSettings.autoplay));
          settingsMigrated.push('autoplay');
        }

        if (oldSettings.librarySort) {
          const sort = String(oldSettings.librarySort);
          if (['recent', 'az', 'za', 'rating', 'year'].includes(sort)) {
            newPrefs.setLibrarySort(sort as SortOrder);
            settingsMigrated.push('library sort');
          }
        }

        if (settingsMigrated.length > 0) {
          result.migrated.push(`Settings: ${settingsMigrated.join(', ')}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate settings: ${error}`);
      result.success = false;
    }

    // 5. Migrate Auth
    try {
      const oldAuthData = safeParseJSON('MaiWatch-auth-storage') as {
        state?: {
          user?: Record<string, unknown>;
          isAuthenticated?: boolean;
        };
      } | null;
      if (oldAuthData?.state?.user && oldAuthData.state.isAuthenticated) {
        const oldAuth = oldAuthData.state;

        if (oldAuth.user) {
          const role = String(oldAuth.user.role || 'user');
          const validRoles = ['user', 'admin', 'moderator'];
          const userRole = (validRoles.includes(role) ? role : 'user') as User['role'];

          useAuthStore.getState().updateUser({
            id: String(oldAuth.user.id),
            username: String(oldAuth.user.username),
            email: String(oldAuth.user.email),
            role: userRole,
            avatar: oldAuth.user.avatar ? String(oldAuth.user.avatar) : undefined,
          });
          result.migrated.push('User authentication');
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate auth: ${error}`);
      result.success = false;
    }

    // 6. Migrate Library/Watch History
    try {
      const oldLibraryData = safeParseJSON('MaiWatch-library') as {
        state?: {
          library?: Record<string, unknown>[];
          watchHistory?: Record<string, unknown>[];
        };
      } | null;

      if (oldLibraryData?.state) {
        const oldLibrary = oldLibraryData.state;
        const newLocalData = useLocalDataStore.getState();

        // Migrate library
        if (oldLibrary.library && Array.isArray(oldLibrary.library)) {
          oldLibrary.library.forEach(item => {
            if (!item || !item.id) return;
            newLocalData.addToLibrary({
              contentId: String(item.id),
              type: (item.media_type || 'movie') as 'movie' | 'tv' | 'anime',
              title: String(item.title || item.name || 'Unknown'),
              poster: String(item.poster_path || ''),
              backdrop: String(item.backdrop_path || ''),
              rating: Number(item.vote_average || 0),
              year: item.release_date ? parseInt(String(item.release_date).split('-')[0]) : undefined,
              genres: Array.isArray(item.genre_ids) ? (item.genre_ids as number[]).map(String) : [],
              runtime: Number(item.runtime || 0),
              favorite: false,
            });
          });

          if (oldLibrary.library.length > 0) {
            result.migrated.push(`${oldLibrary.library.length} library items`);
          }
        }

        // Migrate watch history
        if (oldLibrary.watchHistory && Array.isArray(oldLibrary.watchHistory)) {
          oldLibrary.watchHistory.forEach(item => {
            if (!item || !item.tmdbId) return;
            newLocalData.addToWatchHistory({
              contentId: String(item.tmdbId),
              type: (item.media_type || 'movie') as 'movie' | 'tv' | 'anime',
              title: String(item.title || 'Unknown'),
              poster: String(item.poster_path || ''),
              backdrop: String(item.backdrop_path || ''),
              currentTime: Number(item.currentTime || 0),
              duration: Number(item.duration || 0),
              season: item.season ? Number(item.season) : undefined,
              episode: item.episode ? Number(item.episode) : undefined,
              source: String(item.magnet || item.torrentUrl || ''),
            });
          });

          if (oldLibrary.watchHistory.length > 0) {
            result.migrated.push(`${oldLibrary.watchHistory.length} watch history items`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate local data: ${error}`);
      result.success = false;
    }

    // 7. Migrate Continue Watching
    try {
      const oldContentData = safeParseJSON('MaiWatch-content-storage') as {
        state?: {
          continueWatching?: unknown[];
        };
      } | null;
      if (oldContentData?.state?.continueWatching) {
        const oldContent = oldContentData.state;

        if (oldContent.continueWatching && oldContent.continueWatching.length > 0) {
          result.warnings.push('Continue watching is now derived from watch history');
        }
      }
    } catch (error) {
      result.warnings.push(`Continue watching migration skipped: ${error}`);
    }

    console.log('✅ Migration completed:', result);

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error('❌ Migration failed:', result);
    return result;
  }
};

/**
 * Clears old store data after successful migration
 */
export const clearOldStores = (): void => {
  console.warn('🧹 Clearing old stores...');

  try {
    // Clear old store data
    const oldKeys = [
      'MaiWatch-library',
      'MaiWatch-player-storage',
      'ui-storage',
      'MaiWatch-theme',
      'MaiWatch-settings',
      'MaiWatch-auth-storage',
      'MaiWatch-content-storage',
      'MaiWatch-player',
      'MaiWatch-ui',
      'MaiWatch-preferences',
      'MaiWatch-local-data',
      'MaiWatch-auth',
    ];

    oldKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ Old stores cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear old stores:', error);
  }
};

/**
 * Checks if migration is needed
 */
export const needsMigration = (): boolean => {
  if (typeof window === 'undefined') return false;

  const oldKeys = [
    'MaiWatch-library',
    'MaiWatch-player-storage',
    'ui-storage',
    'MaiWatch-theme',
    'MaiWatch-settings',
    'MaiWatch-auth-storage',
    'MaiWatch-content-storage',
  ];

  const newKeys = ['NovaStream-player', 'NovaStream-ui', 'NovaStream-preferences', 'NovaStream-local-data', 'NovaStream-auth'];

  const hasOldData = oldKeys.some(key => localStorage.getItem(key) !== null);
  const hasNewData = newKeys.some(key => localStorage.getItem(key) !== null);

  return hasOldData && !hasNewData;
};

/**
 * Automatic migration runner
 */
export const runAutoMigration = (): Promise<MigrationResult> => {
  return new Promise(async resolve => {
    if (!needsMigration()) {
      resolve({
        success: true,
        migrated: [],
        errors: [],
        warnings: ['No migration needed'],
      });
      return;
    }

    console.log('🚀 Running automatic migration...');

    try {
      const result = await migrateState();

      if (result.success) {
        // Clear old stores after successful migration
        setTimeout(() => {
          clearOldStores();
          resolve(result);
        }, 1000);
      } else {
        resolve(result);
      }
    } catch (error) {
      resolve({
        success: false,
        migrated: [],
        errors: [`Auto-migration failed: ${error}`],
        warnings: [],
      });
    }
  });
};

/**
 * Creates a migration UI component for manual migration
 */
export const createMigrationUI = () => {
  return {
    runMigration: migrateState,
    clearOldData: clearOldStores,
    checkNeedsMigration: needsMigration,
    runAutoMigration,
  };
};
