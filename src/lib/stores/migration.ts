/**
 * NovaStream State Migration Utility (Simplified)
 * 
 * This utility helps migrate from old scattered state management
 * to new consolidated architecture while maintaining backward compatibility.
 * It reads directly from localStorage to avoid import issues.
 */

import { usePlayerStore, useUIStore, useUserPreferencesStore, useLocalDataStore, useAuthStore } from './index';

interface MigrationResult {
  success: boolean;
  migrated: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Safely parse JSON from localStorage
 */
const safeParseJSON = (key: string): any => {
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

    // 1. Migrate Player State
    try {
      const oldPlayerData = safeParseJSON('novastream-player-storage');
      if (oldPlayerData?.state) {
        const oldPlayer = oldPlayerData.state;
        const newPlayer = usePlayerStore.getState();
        
        if (oldPlayer.volume !== 1 || oldPlayer.muted !== false || oldPlayer.playbackRate !== 1) {
          newPlayer.setVolume(oldPlayer.volume);
          newPlayer.setMuted(oldPlayer.muted);
          newPlayer.setPlaybackRate(oldPlayer.playbackRate);
          result.migrated.push('Player audio preferences');
        }
        
        if (oldPlayer.quality !== 'auto') {
          newPlayer.setQuality(oldPlayer.quality);
          result.migrated.push('Player quality preference');
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate player state: ${error}`);
      result.success = false;
    }

    // 2. Migrate UI State
    try {
      const oldUIData = safeParseJSON('ui-storage');
      if (oldUIData?.state) {
        const oldUI = oldUIData.state;
        const newUI = useUIStore.getState();
        
        if (oldUI.sidebarOpen !== false) {
          newUI.setSidebarOpen(oldUI.sidebarOpen);
          result.migrated.push('Sidebar state');
        }
        
        // Migrate channel states
        Object.entries(oldUI.channelStates || {}).forEach(([channelId, state]: [string, any]) => {
          if (state.scrollPos !== 0) {
            newUI.setChannelScrollPosition(channelId, state.scrollPos);
          }
          if (state.visibleCount !== 2) {
            newUI.setChannelVisibleCount(channelId, state.visibleCount);
          }
        });
        
        if (Object.keys(oldUI.channelStates || {}).length > 0) {
          result.migrated.push('Channel states');
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate UI state: ${error}`);
      result.success = false;
    }

    // 3. Migrate Theme
    try {
      const oldThemeData = safeParseJSON('novastream-theme');
      if (oldThemeData?.state?.theme) {
        const oldTheme = oldThemeData.state.theme;
        const newPrefs = useUserPreferencesStore.getState();
        
        if (oldTheme !== 'nova') {
          newPrefs.setTheme(oldTheme);
          result.migrated.push('Theme preference');
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate theme: ${error}`);
      result.success = false;
    }

    // 4. Migrate Settings
    try {
      const oldSettingsData = safeParseJSON('novastream-settings');
      if (oldSettingsData?.state) {
        const oldSettings = oldSettingsData.state;
        const newPrefs = useUserPreferencesStore.getState();
        
        const settingsMigrated: string[] = [];
        
        if (oldSettings.quality !== 'auto') {
          newPrefs.setDefaultQuality(oldSettings.quality);
          settingsMigrated.push('quality');
        }
        
        if (oldSettings.volume !== 1) {
          newPrefs.setDefaultVolume(oldSettings.volume);
          settingsMigrated.push('volume');
        }
        
        if (oldSettings.subtitleLanguage !== 'en') {
          newPrefs.setSubtitleLanguage(oldSettings.subtitleLanguage);
          settingsMigrated.push('subtitle language');
        }
        
        if (oldSettings.subtitleEnabled !== true) {
          newPrefs.setSubtitlesEnabled(oldSettings.subtitleEnabled);
          settingsMigrated.push('subtitle enabled');
        }
        
        if (oldSettings.autoplay !== true) {
          newPrefs.setAutoPlay(oldSettings.autoplay);
          settingsMigrated.push('autoplay');
        }
        
        if (oldSettings.librarySort !== 'recent') {
          newPrefs.setLibrarySort(oldSettings.librarySort);
          settingsMigrated.push('library sort');
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
      const oldAuthData = safeParseJSON('novastream-auth-storage');
      if (oldAuthData?.state?.user && oldAuthData.state.isAuthenticated) {
        const oldAuth = oldAuthData.state;
        const newAuth = useAuthStore.getState();
        
        // Only migrate basic user info
        if (oldAuth.user) {
          newAuth.updateUser({
            id: oldAuth.user.id,
            username: oldAuth.user.username,
            email: oldAuth.user.email,
            role: oldAuth.user.role,
            avatar: oldAuth.user.avatar,
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
      const oldLibraryData = safeParseJSON('novastream-library');
      if (oldLibraryData?.state) {
        const oldLibrary = oldLibraryData.state;
        const newLocalData = useLocalDataStore.getState();
        
        // Migrate library
        if (oldLibrary.library && Array.isArray(oldLibrary.library)) {
          oldLibrary.library.forEach((item: any) => {
            newLocalData.addToLibrary({
              contentId: item.id.toString(),
              type: item.media_type || 'movie',
              title: item.title || item.name,
              poster: item.poster_path,
              backdrop: item.backdrop_path,
              rating: item.vote_average,
              year: item.release_date ? parseInt(item.release_date.split('-')[0]) : undefined,
              genres: item.genre_ids,
              runtime: item.runtime,
              favorite: false, // No favorite data in old store
            });
          });
          
          if (oldLibrary.library.length > 0) {
            result.migrated.push(`${oldLibrary.library.length} library items`);
          }
        }
        
        // Migrate watch history
        if (oldLibrary.watchHistory && Array.isArray(oldLibrary.watchHistory)) {
          oldLibrary.watchHistory.forEach((item: any) => {
            newLocalData.addToWatchHistory({
              contentId: item.tmdbId.toString(),
              type: item.media_type || 'movie',
              title: item.title,
              poster: item.poster_path,
              backdrop: item.backdrop_path,
              currentTime: item.currentTime,
              duration: item.duration,
              progress: item.progress,
              season: item.season,
              episode: item.episode,
              source: item.magnet || item.torrentUrl,
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
      const oldContentData = safeParseJSON('novastream-content-storage');
      if (oldContentData?.state?.continueWatching) {
        const oldContent = oldContentData.state;
        
        if (oldContent.continueWatching.length > 0) {
          // Continue watching is derived from watch history in the new system
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
      'novastream-library',
      'novastream-player-storage',
      'ui-storage',
      'novastream-theme',
      'novastream-settings',
      'novastream-auth-storage',
      'novastream-content-storage',
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
  const oldKeys = [
    'novastream-library',
    'novastream-player-storage',
    'ui-storage',
    'novastream-theme',
    'novastream-settings',
    'novastream-auth-storage',
    'novastream-content-storage',
  ];
  
  const newKeys = [
    'novastream-player',
    'novastream-ui',
    'novastream-preferences',
    'novastream-local-data',
    'novastream-auth',
  ];
  
  const hasOldData = oldKeys.some(key => localStorage.getItem(key) !== null);
  const hasNewData = newKeys.some(key => localStorage.getItem(key) !== null);
  
  return hasOldData && !hasNewData;
};

/**
 * Automatic migration runner
 */
export const runAutoMigration = (): Promise<MigrationResult> => {
  return new Promise(async (resolve) => {
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