/**
 * Consolidated Local Data Store
 * Handles local user data like watch history, library, collections
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createIDBStorage } from '@/lib/utils/storage';

// Types
export interface WatchHistoryItem {
  id: string; // `${contentId}-${type}-${season}-${episode}`
  contentId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  title: string;
  poster?: string;
  backdrop?: string;
  poster_path?: string;
  backdrop_path?: string;

  // Playback tracking
  currentTime: number; // seconds
  duration: number; // total duration in seconds
  progress: number; // percentage (0-100)

  // TV-specific
  season?: number;
  episode?: number;
  episodeTitle?: string;
  nextSeason?: number;
  nextEpisode?: number;

  // Metadata
  lastWatched: number; // timestamp
  completed: boolean; // true if progress > 90%
  watchCount: number; // number of times watched

  // Additional data
  source?: string;
  quality?: string;
  providerId?: string;
  genres?: string[];
  vibeLabel?: string;
}

export interface LibraryItem {
  id: string;
  contentId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  title: string;
  poster?: string;
  backdrop?: string;
  addedAt: number; // timestamp

  // Additional metadata
  rating?: number;
  year?: number;
  genres?: string[];
  runtime?: number;
  vibeLabel?: string;

  // User data
  userRating?: number;
  notes?: string;
  tags?: string[];
  favorite: boolean;
}

export interface ContentState {
  contentId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  title: string;
  poster?: string;
  backdrop?: string;

  // Last watched specific item
  lastWatchedId: string; // Points to the WatchHistoryItem.id
  lastWatchedSeason?: number;
  lastWatchedEpisode?: number;
  lastWatchedTime: number; // seconds
  lastWatchedDuration: number; // seconds

  // Progress
  isCompleted: boolean;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  poster?: string;
  isDefault: boolean;
  isPublic: boolean;
  items: string[]; // contentId array
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DownloadItem {
  id: string; // unique download identifier
  contentId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  title: string;
  poster?: string;

  // Download tracking
  progress: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
  size: number; // total size in bytes
  downloaded: number; // downloaded bytes
  speed?: number; // current download speed in bytes/second

  // File info
  path?: string;
  filename?: string;
  quality?: string;
  format?: string;

  // Metadata
  createdAt: number;
  completedAt?: number;
  error?: string;

  // TV-specific
  season?: number;
  episode?: number;
}

export interface ContinueWatchingItem {
  id: string;
  contentId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  title: string;
  poster?: string;
  backdrop?: string;
  poster_path?: string;
  backdrop_path?: string;
  progress: number;
  lastWatched: number;
  season?: number;
  episode?: number;
  providerId?: string;
}

export interface UserPreferences {
  autoplayNext: boolean;
  autoplayPreviews: boolean;
  dataSaver: boolean;
  defaultSubtitleLanguage: string;
  defaultAudioLanguage: string;
  showSubtitles: boolean;
  skipIntros: boolean;
  skipRecaps: boolean;
  highFidelitySearch: boolean;
  dialogueBoost: boolean;
  oledOptimization: boolean;
  adaptiveColorSpace: boolean;
  interfaceSounds: boolean;
  theme: string;
  // Experimental
  av1MasterStream: boolean;
  ultraFluidPlayback: boolean;
  aiUpscaling: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  pin?: string;
  isKids: boolean;
  isLocked: boolean;
  isGuest?: boolean;
  createdAt: number;
  preferences?: {
    genres: string[];
    genreWeights?: Record<string, number>;
    vibes: string[];
    cinematicWeights?: Record<string, number>;
    heritage?: string[]; // ISO country codes
    theme?: string;
  };
}

interface LocalDataStore {
  // Profiles
  profiles: UserProfile[];
  activeProfileId: string | null;

  // Global Settings (Profile Independent)
  globalPreferences: UserPreferences;

  // Profile Actions
  createProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => string;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  unlockProfile: (id: string, pin: string) => boolean;

  // Preference Actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // Watch History
  watchHistory: WatchHistoryItem[];

  // Content State (Unified tracking for TV/Movies)
  contentState: Record<string, ContentState>;

  // Library
  library: LibraryItem[];

  // Collections
  collections: Collection[];

  // Downloads
  downloads: DownloadItem[];

  // Continue Watching (derived from watch history)
  continueWatching: ContinueWatchingItem[];

  // Watch History Actions
  addToWatchHistory: (
    item: Omit<WatchHistoryItem, 'id' | 'lastWatched' | 'completed' | 'watchCount' | 'progress'>
  ) => void;
  updateWatchProgress: (id: string, currentTime: number, duration?: number) => void;
  removeFromWatchHistory: (id: string) => void;
  clearWatchHistory: () => void;
  markAsCompleted: (id: string) => void;
  incrementWatchCount: (id: string) => void;
  adjustRecommendationWeights: (contentId: string, delta: number) => void;

  // Library Actions
  addToLibrary: (item: Omit<LibraryItem, 'id' | 'addedAt'>) => void;
  removeFromLibrary: (contentId: string) => void;
  updateLibraryItem: (contentId: string, updates: Partial<LibraryItem>) => void;
  setFavorite: (contentId: string, favorite: boolean) => void;
  setUserRating: (contentId: string, rating: number) => void;
  setNotes: (contentId: string, notes: string) => void;
  setTags: (contentId: string, tags: string[]) => void;
  isInLibrary: (contentId: string) => boolean;
  getLibraryItem: (contentId: string) => LibraryItem | undefined;

  // Collection Actions
  createCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => string;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, contentId: string) => void;
  removeFromCollection: (collectionId: string, contentId: string) => void;
  togglePin: (id: string) => void;

  // Download Actions
  addDownload: (item: Omit<DownloadItem, 'id' | 'createdAt' | 'progress' | 'downloaded' | 'status'>) => void;
  updateDownloadProgress: (id: string, progress: number, downloaded?: number, speed?: number) => void;
  setDownloadStatus: (id: string, status: DownloadItem['status'], error?: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  clearCompletedDownloads: () => void;

  // Utility Actions
  exportData: () => string;
  importData: (dataJson: string) => void;
  clearAllData: () => void;
  migrateLegacyData: () => void;

  // Derived selectors
  getContinueWatching: () => ContinueWatchingItem[];
  getLastWatched: () => WatchHistoryItem | undefined;
  getResumeData: (contentId: string) => WatchHistoryItem | null;
  getFavorites: () => LibraryItem[];
  getRecentAdditions: (limit?: number) => LibraryItem[];

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useLocalDataStore = createWithEqualityFn<LocalDataStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        profiles: [
          {
            id: 'primary',
            name: 'Director',
            avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Director&backgroundColor=b6e3f4,c0aede,d1d4f9',
            isKids: false,
            isLocked: false,
            createdAt: Date.now(),
            preferences: {
              genres: [],
              genreWeights: {},
              vibes: [],
              cinematicWeights: {},
              heritage: [],
            },
          },
        ],
        activeProfileId: 'primary',
        globalPreferences: {
          autoplayNext: true,
          autoplayPreviews: true,
          dataSaver: false,
          defaultSubtitleLanguage: 'en',
          defaultAudioLanguage: 'original',
          showSubtitles: true,
          skipIntros: true,
          skipRecaps: true,
          highFidelitySearch: true,
          dialogueBoost: false,
          oledOptimization: true,
          adaptiveColorSpace: true,
          interfaceSounds: true,
          theme: 'Nova',
          av1MasterStream: false,
          ultraFluidPlayback: false,
          aiUpscaling: false,
        },
        watchHistory: [],
        contentState: {},
        library: [],
        collections: [
          {
            id: 'favorites',
            name: 'Favorites',
            description: 'Your favorite movies and shows',
            isDefault: true,
            isPublic: false,
            items: [],
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'watch-later',
            name: 'Watch Later',
            description: 'Content you want to watch later',
            isDefault: true,
            isPublic: false,
            items: [],
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        downloads: [],
        continueWatching: [],
        _hasHydrated: false,

        setHasHydrated: state => set({ _hasHydrated: state }),
        // Profile Actions
        createProfile: profile => {
          const id = Math.random().toString(36).substring(2, 11);
          set(state => ({
            profiles: [...state.profiles, { ...profile, id, createdAt: Date.now() }],
          }));
          return id;
        },

        updateProfile: (id, updates) =>
          set(state => ({
            profiles: state.profiles.map(p => (p.id === id ? { ...p, ...updates } : p)),
          })),

        deleteProfile: id =>
          set(state => ({
            profiles: state.profiles.filter(p => p.id !== id),
            activeProfileId: state.activeProfileId === id ? state.profiles[0]?.id || null : state.activeProfileId,
          })),

        setActiveProfile: id => set({ activeProfileId: id }),

        unlockProfile: (id, pin) => {
          const profile = get().profiles.find(p => p.id === id);
          return profile?.pin === pin;
        },

        updatePreferences: updates =>
          set(state => ({
            globalPreferences: { ...state.globalPreferences, ...updates },
          })),

        // Watch History Actions
        addToWatchHistory: (item) => {
          // Global Sanitization Guard: Block the literal string 'NaN' or empty IDs, but allow alphanumeric ones
          if (!item.contentId || String(item.contentId).includes('NaN')) {
            return;
          }

          const id = `${item.contentId}-${item.type}-${item.season || 'movie'}-${item.episode || '1'}`;
          const lastWatched = Date.now();
          
          // Safety check: Prevent corruption from invalid numbers
          const currentTime = isNaN(Number(item.currentTime)) ? 0 : Math.max(0, Number(item.currentTime));
          const duration = isNaN(Number(item.duration)) || Number(item.duration) <= 0 ? 100 : Number(item.duration);
          const progress = (currentTime / duration) * 100;
          
          // Tightened Completion Logic: 95% threshold OR within 60 seconds of end
          const isNearEnd = duration > 0 && (duration - currentTime) < 60;
          const completed = progress > 95 || isNearEnd;

          set((state) => {
            const existingIndex = state.watchHistory.findIndex((h) => h.id === id);
            let updatedHistory = [...state.watchHistory];

            const newItem: WatchHistoryItem = {
              ...item,
              id,
              currentTime,
              duration,
              progress,
              completed,
              lastWatched,
              watchCount: 0, // Will be incremented if completed
              // Sanitize season/episode to ensure they are numbers
              season: item.season ? Number(item.season) : undefined,
              episode: item.episode ? Number(item.episode) : undefined,
              nextSeason: item.nextSeason ? Number(item.nextSeason) : undefined,
              nextEpisode: item.nextEpisode ? Number(item.nextEpisode) : undefined,
            };

            if (existingIndex >= 0) {
              const existingItem = updatedHistory[existingIndex];
              const isNewlyCompleted = completed && !existingItem.completed;
              
              newItem.watchCount = isNewlyCompleted 
                ? (existingItem.watchCount || 0) + 1 
                : (existingItem.watchCount || 0);
              
              if (isNewlyCompleted) {
                // Background weight boost for completion
                setTimeout(() => get().adjustRecommendationWeights(item.contentId, 1), 0);
              }

              updatedHistory.splice(existingIndex, 1);
              updatedHistory = [newItem, ...updatedHistory];
            } else {
              newItem.watchCount = completed ? 1 : 0;
              if (completed) {
                setTimeout(() => get().adjustRecommendationWeights(item.contentId, 1), 0);
              }
              updatedHistory = [newItem, ...updatedHistory].slice(0, 500);
            }

            // Update Content State mapping (for "Continue Watching" suggestions)
            const updatedContentState = {
              ...state.contentState,
              [item.contentId]: {
                contentId: item.contentId,
                type: item.type,
                title: item.title,
                poster: item.poster,
                backdrop: item.backdrop,
                lastWatchedId: id,
                lastWatchedSeason: item.season,
                lastWatchedEpisode: item.episode,
                lastWatchedTime: completed ? 0 : currentTime,
                lastWatchedDuration: duration,
                nextSeason: item.nextSeason,
                nextEpisode: item.nextEpisode,
                isCompleted: (completed && item.type === 'movie') || (state.contentState[item.contentId]?.isCompleted ?? false),
                updatedAt: lastWatched,
              },
            };

            return {
              watchHistory: updatedHistory,
              contentState: updatedContentState,
            };
          });
        },

        updateWatchProgress: (id, currentTime, duration) => {
          set(state => {
            const index = state.watchHistory.findIndex(h => h.id === id);
            if (index === -1) return state;

            const item = state.watchHistory[index];
            const itemDuration = duration || item.duration;
            const progress = itemDuration > 0 ? (currentTime / itemDuration) * 100 : 0;
            
            // Tightened Completion Logic: 95% or 60s remaining
            const isNearEnd = itemDuration > 0 && (itemDuration - currentTime) < 60;
            const completed = progress > 95 || isNearEnd;
            
            const isNewlyCompleted = completed && !item.completed;
            const updatedItem = {
              ...item,
              currentTime,
              duration: itemDuration,
              progress,
              lastWatched: Date.now(),
              completed,
              watchCount: isNewlyCompleted ? item.watchCount + 1 : item.watchCount,
            };

            if (isNewlyCompleted) {
              setTimeout(() => get().adjustRecommendationWeights(updatedItem.contentId, 1), 0);
            }

            // Move to top of history
            const updatedHistory = [updatedItem, ...state.watchHistory.filter(h => h.id !== id)];

            // Update content state as well
            const updatedContentState = {
              ...state.contentState,
              [updatedItem.contentId]: {
                ...state.contentState[updatedItem.contentId],
                lastWatchedId: id,
                lastWatchedTime: currentTime,
                lastWatchedDuration: updatedItem.duration,
                updatedAt: Date.now(),
              },
            };

            return {
              watchHistory: updatedHistory,
              contentState: updatedContentState,
            };
          });
        },

        removeFromWatchHistory: id =>
          set(state => ({
            watchHistory: state.watchHistory.filter(item => item.id !== id),
          })),

        clearWatchHistory: () => set({ watchHistory: [], contentState: {} }),

        markAsCompleted: id =>
          set(state => {
            const index = state.watchHistory.findIndex(h => h.id === id);
            if (index === -1) return state;

            const item = state.watchHistory[index];
            const updatedItem = {
              ...item,
              progress: 100,
              completed: true,
              watchCount: item.watchCount + 1,
              lastWatched: Date.now(),
            };

            const updatedHistory = [updatedItem, ...state.watchHistory.filter(h => h.id !== id)];

            const updatedContentState = {
              ...state.contentState,
              [updatedItem.contentId]: {
                ...state.contentState[updatedItem.contentId],
                isCompleted: true,
                updatedAt: Date.now(),
              },
            };

            return { watchHistory: updatedHistory, contentState: updatedContentState };
          }),

        incrementWatchCount: id =>
          set(state => ({
            watchHistory: state.watchHistory.map(item =>
              item.id === id ? { ...item, watchCount: item.watchCount + 1 } : item
            ),
          })),

        adjustRecommendationWeights: (contentId, delta) => {
          const state = get();
          const activeProfileId = state.activeProfileId;
          if (!activeProfileId) return;

          // Find content in library or history to get metadata
          const historyItem = state.watchHistory.find(h => h.contentId === contentId);
          const libraryItem = state.library.find(l => l.contentId === contentId);
          
          const genres = historyItem?.genres || libraryItem?.genres || [];
          const vibe = historyItem?.vibeLabel || libraryItem?.vibeLabel;

          if (genres.length === 0 && !vibe) return;

          set(state => ({
            profiles: state.profiles.map(p => {
              if (p.id !== activeProfileId) return p;
              
              const prefs = p.preferences || { genres: [], vibes: [], genreWeights: {}, cinematicWeights: {}, heritage: [] };
              const genreWeights = { ...(prefs.genreWeights || {}) };
              const cinematicWeights = { ...(prefs.cinematicWeights || {}) };

              genres.forEach(g => {
                genreWeights[g] = (genreWeights[g] || 0) + delta;
              });

              if (vibe) {
                cinematicWeights[vibe] = (cinematicWeights[vibe] || 0) + delta;
              }

              return {
                ...p,
                preferences: {
                  ...prefs,
                  genreWeights,
                  cinematicWeights
                }
              };
            })
          }));
        },

        // Library Actions
        addToLibrary: item => {
          const id = Date.now().toString();
          const addedAt = Date.now();

          set(state => {
            if (state.library.some(libItem => libItem.contentId === item.contentId)) {
              return state; // Already in library
            }

            const newItem: LibraryItem = { ...item, id, addedAt };
            return { library: [newItem, ...state.library] };
          });
        },

        removeFromLibrary: contentId =>
          set(state => ({
            library: state.library.filter(item => item.contentId !== contentId),
            collections: state.collections.map(collection => ({
              ...collection,
              items: collection.items.filter(item => item !== contentId),
            })),
          })),

        updateLibraryItem: (contentId, updates) =>
          set(state => ({
            library: state.library.map(item => (item.contentId === contentId ? { ...item, ...updates } : item)),
          })),

        setFavorite: (contentId, favorite) => {
          get().updateLibraryItem(contentId, { favorite });

          // Update favorites collection
          set(state => ({
            collections: state.collections.map(collection => {
              if (collection.id === 'favorites') {
                return {
                  ...collection,
                  items: favorite
                    ? [...new Set([...collection.items, contentId])]
                    : collection.items.filter(item => item !== contentId),
                };
              }
              return collection;
            }),
          }));
        },

        setUserRating: (contentId, rating) => get().updateLibraryItem(contentId, { userRating: rating }),

        setNotes: (contentId, notes) => get().updateLibraryItem(contentId, { notes }),

        setTags: (contentId, tags) => get().updateLibraryItem(contentId, { tags }),

        isInLibrary: contentId => {
          const library = get().library;
          return Array.isArray(library) && library.some(item => item.contentId === contentId);
        },

        getLibraryItem: contentId => get().library.find(item => item.contentId === contentId),

        // Collection Actions
        createCollection: collection => {
          const id = Date.now().toString();
          const createdAt = Date.now();

          set(state => ({
            collections: [
              ...state.collections,
              { ...collection, id, createdAt, updatedAt: createdAt, items: [], pinned: false },
            ],
          }));
          return id;
        },

        updateCollection: (id, updates) =>
          set(state => ({
            collections: state.collections.map(collection =>
              collection.id === id ? { ...collection, ...updates, updatedAt: Date.now() } : collection
            ),
          })),

        deleteCollection: id =>
          set(state => ({
            collections: state.collections.filter(collection => collection.id !== id && !collection.isDefault),
          })),

        addToCollection: (collectionId, contentId) =>
          set(state => ({
            collections: state.collections.map(collection =>
              collection.id === collectionId
                ? { ...collection, items: [...new Set([...collection.items, contentId])], updatedAt: Date.now() }
                : collection
            ),
          })),

        removeFromCollection: (collectionId, contentId) =>
          set(state => ({
            collections: state.collections.map(collection =>
              collection.id === collectionId
                ? { ...collection, items: collection.items.filter(item => item !== contentId), updatedAt: Date.now() }
                : collection
            ),
          })),

        togglePin: id =>
          set(state => ({
            collections: state.collections.map(collection =>
              collection.id === id ? { ...collection, pinned: !collection.pinned, updatedAt: Date.now() } : collection
            ),
          })),

        // Download Actions
        addDownload: item => {
          const id = Date.now().toString();
          const createdAt = Date.now();

          set(state => ({
            downloads: [{ ...item, id, createdAt, progress: 0, downloaded: 0, status: 'pending' }, ...state.downloads],
          }));
        },

        updateDownloadProgress: (id, progress, downloaded, speed) =>
          set(state => ({
            downloads: state.downloads.map(download =>
              download.id === id
                ? {
                    ...download,
                    progress,
                    downloaded: downloaded || (download.size * progress) / 100,
                    speed,
                    status: progress === 100 ? 'completed' : 'downloading',
                    ...(progress === 100 && { completedAt: Date.now() }),
                  }
                : download
            ),
          })),

        setDownloadStatus: (id, status, error) =>
          set(state => ({
            downloads: state.downloads.map(download =>
              download.id === id ? { ...download, status, error } : download
            ),
          })),

        pauseDownload: id => get().setDownloadStatus(id, 'paused'),
        resumeDownload: id => get().setDownloadStatus(id, 'downloading'),
        cancelDownload: id => get().setDownloadStatus(id, 'cancelled'),

        removeDownload: id =>
          set(state => ({
            downloads: state.downloads.filter(download => download.id !== id),
          })),

        clearCompletedDownloads: () =>
          set(state => ({
            downloads: state.downloads.filter(download => download.status !== 'completed'),
          })),

        // Utility Actions
        exportData: () => {
          const state = get();
          return JSON.stringify(
            {
              watchHistory: state.watchHistory,
              contentState: state.contentState,
              library: state.library,
              collections: state.collections.filter(c => !c.isDefault),
              downloads: state.downloads.filter(d => d.status === 'completed'),
              exportedAt: Date.now(),
            },
            null,
            2
          );
        },

        importData: dataJson => {
          try {
            const data = JSON.parse(dataJson);

            set(state => ({
              watchHistory: data.watchHistory || [],
              contentState: data.contentState || {},
              library: data.library || [],
              collections: [...state.collections.filter(c => c.isDefault), ...(data.collections || [])],
              downloads: data.downloads || [],
            }));
          } catch (error) {
            console.error('Failed to import data:', error);
          }
        },

        migrateLegacyData: () => {
          try {
            const historyStr = localStorage.getItem('NovaStream-history-storage');
            const trackingStr = localStorage.getItem('series-tracking-storage');

            if (historyStr) {
              const historyData = JSON.parse(historyStr);
              if (historyData?.state?.history) {
                // Import legacy history items
                historyData.state.history.forEach(
                  (item: {
                    id: string | number;
                    type?: string;
                    title?: string;
                    poster?: string;
                    backdrop?: string;
                    progress?: number;
                    duration?: number;
                    season?: number;
                    episode?: number;
                  }) => {
                    get().addToWatchHistory({
                      contentId: String(item.id),
                      type: (item.type || 'movie') as 'movie' | 'tv' | 'anime',
                      title: item.title || 'Untitled',
                      poster: item.poster || '',
                      backdrop: item.backdrop || '',
                      currentTime: item.progress || 0,
                      duration: item.duration || 0,
                      season: item.season,
                      episode: item.episode,
                    });
                  }
                );
                console.log('✅ Migrated legacy history');
              }
            }

            if (trackingStr) {
              const trackingData = JSON.parse(trackingStr);
              if (trackingData?.state?.trackedSeries) {
                // Use tracking info to refine contentState
                set(state => {
                  const newContentState = { ...state.contentState };
                  (
                    Object.values(trackingData.state.trackedSeries) as {
                      id: string | number;
                      lastWatchedSeason?: number;
                      lastWatchedEpisode?: number;
                    }[]
                  ).forEach(series => {
                    const id = String(series.id);
                    if (newContentState[id]) {
                      newContentState[id] = {
                        ...newContentState[id],
                        lastWatchedSeason: series.lastWatchedSeason,
                        lastWatchedEpisode: series.lastWatchedEpisode,
                      };
                    }
                  });
                  return { contentState: newContentState };
                });
                console.log('✅ Migrated legacy series tracking');
              }
            }

            const watchlistStr = localStorage.getItem('NovaStream-watchlist-storage');
            if (watchlistStr) {
              const watchlistData = JSON.parse(watchlistStr);
              if (watchlistData?.state?.watchlist) {
                watchlistData.state.watchlist.forEach(
                  (item: {
                    id: string | number;
                    type?: string;
                    media_type?: string;
                    title?: string;
                    name?: string;
                    poster_path?: string;
                    poster?: string;
                    backdrop_path?: string;
                    backdrop?: string;
                    addedAt?: number;
                  }) => {
                    get().addToLibrary({
                      contentId: String(item.id),
                      type: (item.media_type || item.type || 'movie') as 'movie' | 'tv' | 'anime',
                      title: item.title || item.name || '',
                      poster: item.poster_path || item.poster || '',
                      backdrop: item.backdrop_path || item.backdrop || '',
                      favorite: false,
                    });
                    // Also add to watch-later collection
                    get().addToCollection('watch-later', String(item.id));
                  }
                );
                console.log('✅ Migrated legacy watchlist');
              }
            }
          } catch (e) {
            console.error('Migration failed:', e);
          }
        },

        clearAllData: () => ({
          watchHistory: [],
          contentState: {},
          library: [],
          collections: get().collections.filter(c => c.isDefault),
          downloads: [],
        }),

        // Derived selectors
        getContinueWatching: () => {
          const watchHistory = get().watchHistory;
          // Return the latest distinct content items that are not completed
          const contentMap = new Map<string, WatchHistoryItem>();

          watchHistory.forEach(item => {
            if (!contentMap.has(item.contentId) || contentMap.get(item.contentId)!.lastWatched < item.lastWatched) {
              contentMap.set(item.contentId, item);
            }
          });

          return Array.from(contentMap.values())
            .filter(item => item.progress > 2)
            .sort((a, b) => b.lastWatched - a.lastWatched)
            .slice(0, 20)
            .map(item => {
              // If the item is completed and it's a TV show, show the "Next Episode" in the list
              const isCompleted = item.completed || item.progress > 95;
              
              if (isCompleted && item.type !== 'movie') {
                return {
                  id: item.id,
                  contentId: item.contentId,
                  type: item.type,
                  title: item.title,
                  poster: item.poster,
                  progress: 0, // Reset progress for the next one
                  lastWatched: item.lastWatched,
                  season: item.nextSeason || item.season,
                  episode: item.nextEpisode || (item.episode || 1) + 1, // Use explicit next or fallback to increment
                };
              }
              
              return {
                id: item.id,
                contentId: item.contentId,
                type: item.type,
                title: item.title,
                poster: item.poster,
                progress: item.progress,
                lastWatched: item.lastWatched,
                season: item.season,
                episode: item.episode,
              };
            });
        },

        getLastWatched: () => {
          return get().watchHistory[0];
        },

        getResumeData: contentId => {
          const state = get().contentState[contentId];
          if (!state) return null;

          const historyItem = get().watchHistory.find(h => h.id === state.lastWatchedId);
          if (!historyItem) return null;

          const isCompleted = historyItem.progress > 90;

          // If completed and it's a TV show, suggest the NEXT episode
          if (isCompleted && historyItem.type !== 'movie') {
            return {
              ...historyItem,
              season: historyItem.nextSeason || historyItem.season,
              episode: historyItem.nextEpisode || (historyItem.episode || 1) + 1,
              currentTime: 0,
              progress: 0,
              completed: true,
            };
          }

          return {
            ...historyItem,
            completed: isCompleted,
          };
        },

        getFavorites: () => get().library.filter(item => item.favorite),

        getRecentAdditions: (limit = 10) =>
          get()
            .library.sort((a, b) => b.addedAt - a.addedAt)
            .slice(0, limit),
      }),
      {
        name: 'NovaStream-local-data',
        storage: createJSONStorage(() => createIDBStorage('NovaStream-local-data') as any),
        // No partialize - store all local data
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        }
      }
    )
  )
);

// Migration helper to move data from localStorage to IndexedDB if it exists
if (typeof window !== 'undefined') {
  const legacyData = localStorage.getItem('NovaStream-local-data');
  if (legacyData) {
    const storage = createIDBStorage('NovaStream-local-data');
    storage.setItem('NovaStream-local-data', legacyData).then(() => {
      // Keep in localStorage for one session as safety, then we could remove
      console.log('📦 Migrated localDataStore to IndexedDB');
    });
  }
}

// Selectors for optimized subscriptions
export const useWatchHistory = () => useLocalDataStore(state => state.watchHistory, shallow);
export const useLibrary = () => useLocalDataStore(state => state.library, shallow);
export const useCollections = () => useLocalDataStore(state => state.collections, shallow);
export const useDownloads = () => useLocalDataStore(state => state.downloads, shallow);
export const useContinueWatching = () => useLocalDataStore(state => typeof state.getContinueWatching === 'function' ? state.getContinueWatching() : [], shallow);
export const useLastWatched = () => useLocalDataStore(state => typeof state.getLastWatched === 'function' ? state.getLastWatched() : null, shallow);

export const useProfiles = () => useLocalDataStore(state => state.profiles, shallow);
export const useActiveProfile = () =>
  useLocalDataStore(state => Array.isArray(state.profiles) ? state.profiles.find(p => p.id === state.activeProfileId) : undefined, shallow);
export const useUserPreferences = () => useLocalDataStore(state => state.globalPreferences, shallow);
export const useHasHydrated = () => useLocalDataStore(state => state._hasHydrated);

// Action selectors for cleaner imports
export const useProfileActions = () =>
  useLocalDataStore(
    state => ({
      createProfile: state.createProfile,
      updateProfile: state.updateProfile,
      deleteProfile: state.deleteProfile,
      setActiveProfile: state.setActiveProfile,
      unlockProfile: state.unlockProfile,
    }),
    shallow
  );

export const usePreferenceActions = () =>
  useLocalDataStore(
    state => ({
      updatePreferences: state.updatePreferences,
    }),
    shallow
  );

export const useWatchHistoryActions = () =>
  useLocalDataStore(
    state => ({
      addToWatchHistory: state.addToWatchHistory,
      updateWatchProgress: state.updateWatchProgress,
      removeFromWatchHistory: state.removeFromWatchHistory,
      clearWatchHistory: state.clearWatchHistory,
      markAsCompleted: state.markAsCompleted,
    }),
    shallow
  );

export const useLibraryActions = () =>
  useLocalDataStore(
    state => ({
      addToLibrary: state.addToLibrary,
      removeFromLibrary: state.removeFromLibrary,
      updateLibraryItem: state.updateLibraryItem,
      setFavorite: state.setFavorite,
      setUserRating: state.setUserRating,
      setNotes: state.setNotes,
      setTags: state.setTags,
      isInLibrary: state.isInLibrary,
      getLibraryItem: state.getLibraryItem,
    }),
    shallow
  );

export const useCollectionActions = () =>
  useLocalDataStore(
    state => ({
      createCollection: state.createCollection,
      updateCollection: state.updateCollection,
      deleteCollection: state.deleteCollection,
      addToCollection: state.addToCollection,
      removeFromCollection: state.removeFromCollection,
      togglePin: state.togglePin,
    }),
    shallow
  );

export const useDownloadActions = () =>
  useLocalDataStore(state => ({
    addDownload: state.addDownload,
    updateDownloadProgress: state.updateDownloadProgress,
    pauseDownload: state.pauseDownload,
    resumeDownload: state.resumeDownload,
    cancelDownload: state.cancelDownload,
    removeDownload: state.removeDownload,
    clearCompletedDownloads: state.clearCompletedDownloads,
  }));

// Development utilities
if (process.env.NODE_ENV === 'development') {
  useLocalDataStore.subscribe(
    state => state.watchHistory.length,
    length => {
      console.log(`📺 Watch history now has ${length} items`);
    }
  );
}
