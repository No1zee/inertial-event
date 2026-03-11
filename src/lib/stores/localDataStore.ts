/**
 * Consolidated Local Data Store
 * Handles local user data like watch history, library, collections
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { Content } from '@/lib/types/content';

// Types
export interface WatchHistoryItem {
  id: string; // `${contentId}-${type}-${season}-${episode}`
  contentId: string;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  poster?: string;
  backdrop?: string;
  
  // Playback tracking
  currentTime: number; // seconds
  duration: number; // total duration in seconds
  progress: number; // percentage (0-100)
  
  // TV-specific
  season?: number;
  episode?: number;
  episodeTitle?: string;
  
  // Metadata
  lastWatched: number; // timestamp
  completed: boolean; // true if progress > 90%
  watchCount: number; // number of times watched
  
  // Additional data
  source?: string;
  quality?: string;
}

export interface LibraryItem {
  id: string;
  contentId: string;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  poster?: string;
  backdrop?: string;
  addedAt: number; // timestamp
  
  // Additional metadata
  rating?: number;
  year?: number;
  genres?: string[];
  runtime?: number;
  
  // User data
  userRating?: number;
  notes?: string;
  tags?: string[];
  favorite: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  poster?: string;
  isDefault: boolean;
  isPublic: boolean;
  items: string[]; // contentId array
  createdAt: number;
  updatedAt: number;
}

export interface DownloadItem {
  id: string; // unique download identifier
  contentId: string;
  type: 'movie' | 'tv' | 'anime';
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
  type: 'movie' | 'tv' | 'anime';
  title: string;
  poster?: string;
  progress: number;
  lastWatched: number;
  season?: number;
  episode?: number;
}

interface LocalDataStore {
  // Watch History
  watchHistory: WatchHistoryItem[];
  
  // Library
  library: LibraryItem[];
  
  // Collections
  collections: Collection[];
  
  // Downloads
  downloads: DownloadItem[];
  
  // Continue Watching (derived from watch history)
  continueWatching: ContinueWatchingItem[];
  
  // Watch History Actions
  addToWatchHistory: (item: Omit<WatchHistoryItem, 'id' | 'lastWatched' | 'completed' | 'watchCount'>) => void;
  updateWatchProgress: (id: string, currentTime: number, duration?: number) => void;
  removeFromWatchHistory: (id: string) => void;
  clearWatchHistory: () => void;
  markAsCompleted: (id: string) => void;
  incrementWatchCount: (id: string) => void;
  
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
  createCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, contentId: string) => void;
  removeFromCollection: (collectionId: string, contentId: string) => void;
  
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
  
  // Derived selectors
  getContinueWatching: () => ContinueWatchingItem[];
  getFavorites: () => LibraryItem[];
  getRecentAdditions: (limit?: number) => LibraryItem[];
}

export const useLocalDataStore = create<LocalDataStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        watchHistory: [],
        library: [],
        collections: [
          {
            id: 'favorites',
            name: 'Favorites',
            description: 'Your favorite movies and shows',
            isDefault: true,
            isPublic: false,
            items: [],
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        downloads: [],
        continueWatching: [],

        // Watch History Actions
        addToWatchHistory: (item) => {
          const id = `${item.contentId}-${item.type}-${item.season || 'movie'}-${item.episode || '1'}`;
          const lastWatched = Date.now();
          const progress = (item.currentTime / item.duration) * 100;
          const completed = progress > 90;
          
          set((state) => {
            const existingIndex = state.watchHistory.findIndex(h => h.id === id);
            
            if (existingIndex >= 0) {
              // Update existing item
              const updated = [...state.watchHistory];
              updated[existingIndex] = {
                ...updated[existingIndex],
                ...item,
                id,
                lastWatched,
                progress,
                completed,
                watchCount: completed ? updated[existingIndex].watchCount + 1 : updated[existingIndex].watchCount,
              };
              return { watchHistory: updated };
            } else {
              // Add new item
              const newItem: WatchHistoryItem = {
                ...item,
                id,
                lastWatched,
                progress,
                completed,
                watchCount: completed ? 1 : 0,
              };
              return { watchHistory: [newItem, ...state.watchHistory].slice(0, 1000) }; // Limit to 1000 items
            }
          });
        },

        updateWatchProgress: (id, currentTime, duration) => {
          set((state) => ({
            watchHistory: state.watchHistory.map(item => {
              if (item.id === id) {
                const itemDuration = duration || item.duration;
                const progress = (currentTime / itemDuration) * 100;
                const completed = progress > 90;
                
                return {
                  ...item,
                  currentTime,
                  duration: itemDuration,
                  progress,
                  lastWatched: Date.now(),
                  completed,
                  watchCount: completed && !item.completed ? item.watchCount + 1 : item.watchCount,
                };
              }
              return item;
            }),
          }));
        },

        removeFromWatchHistory: (id) => 
          set((state) => ({
            watchHistory: state.watchHistory.filter(item => item.id !== id),
          })),

        clearWatchHistory: () => 
          set({ watchHistory: [] }),

        markAsCompleted: (id) => 
          set((state) => ({
            watchHistory: state.watchHistory.map(item =>
              item.id === id
                ? { ...item, progress: 100, completed: true, watchCount: item.watchCount + 1 }
                : item
            ),
          })),

        incrementWatchCount: (id) => 
          set((state) => ({
            watchHistory: state.watchHistory.map(item =>
              item.id === id ? { ...item, watchCount: item.watchCount + 1 } : item
            ),
          })),

        // Library Actions
        addToLibrary: (item) => {
          const id = Date.now().toString();
          const addedAt = Date.now();
          
          set((state) => {
            if (state.library.some(libItem => libItem.contentId === item.contentId)) {
              return state; // Already in library
            }
            
            const newItem: LibraryItem = { ...item, id, addedAt };
            return { library: [newItem, ...state.library] };
          });
        },

        removeFromLibrary: (contentId) => 
          set((state) => ({
            library: state.library.filter(item => item.contentId !== contentId),
            collections: state.collections.map(collection => ({
              ...collection,
              items: collection.items.filter(item => item !== contentId),
            })),
          })),

        updateLibraryItem: (contentId, updates) => 
          set((state) => ({
            library: state.library.map(item =>
              item.contentId === contentId ? { ...item, ...updates } : item
            ),
          })),

        setFavorite: (contentId, favorite) => {
          get().updateLibraryItem(contentId, { favorite });
          
          // Update favorites collection
          set((state) => ({
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

        setUserRating: (contentId, rating) => 
          get().updateLibraryItem(contentId, { userRating: rating }),

        setNotes: (contentId, notes) => 
          get().updateLibraryItem(contentId, { notes }),

        setTags: (contentId, tags) => 
          get().updateLibraryItem(contentId, { tags }),

        isInLibrary: (contentId) => 
          get().library.some(item => item.contentId === contentId),

        getLibraryItem: (contentId) => 
          get().library.find(item => item.contentId === contentId),

        // Collection Actions
        createCollection: (collection) => {
          const id = Date.now().toString();
          const createdAt = Date.now();
          
          set((state) => ({
            collections: [...state.collections, { ...collection, id, createdAt, updatedAt: createdAt, items: [] }],
          }));
        },

        updateCollection: (id, updates) => 
          set((state) => ({
            collections: state.collections.map(collection =>
              collection.id === id ? { ...collection, ...updates, updatedAt: Date.now() } : collection
            ),
          })),

        deleteCollection: (id) => 
          set((state) => ({
            collections: state.collections.filter(collection => collection.id !== id && !collection.isDefault),
          })),

        addToCollection: (collectionId, contentId) => 
          set((state) => ({
            collections: state.collections.map(collection =>
              collection.id === collectionId
                ? { ...collection, items: [...new Set([...collection.items, contentId])], updatedAt: Date.now() }
                : collection
            ),
          })),

        removeFromCollection: (collectionId, contentId) => 
          set((state) => ({
            collections: state.collections.map(collection =>
              collection.id === collectionId
                ? { ...collection, items: collection.items.filter(item => item !== contentId), updatedAt: Date.now() }
                : collection
            ),
          })),

        // Download Actions
        addDownload: (item) => {
          const id = Date.now().toString();
          const createdAt = Date.now();
          
          set((state) => ({
            downloads: [{ ...item, id, createdAt, progress: 0, downloaded: 0, status: 'pending' }, ...state.downloads],
          }));
        },

        updateDownloadProgress: (id, progress, downloaded, speed) => 
          set((state) => ({
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
          set((state) => ({
            downloads: state.downloads.map(download =>
              download.id === id ? { ...download, status, error } : download
            ),
          })),

        pauseDownload: (id) => get().setDownloadStatus(id, 'paused'),
        resumeDownload: (id) => get().setDownloadStatus(id, 'downloading'),
        cancelDownload: (id) => get().setDownloadStatus(id, 'cancelled'),

        removeDownload: (id) => 
          set((state) => ({
            downloads: state.downloads.filter(download => download.id !== id),
          })),

        clearCompletedDownloads: () => 
          set((state) => ({
            downloads: state.downloads.filter(download => download.status !== 'completed'),
          })),

        // Utility Actions
        exportData: () => {
          const state = get();
          return JSON.stringify({
            watchHistory: state.watchHistory,
            library: state.library,
            collections: state.collections.filter(c => !c.isDefault), // Don't export default collections
            downloads: state.downloads.filter(d => d.status === 'completed'), // Only export completed downloads
            exportedAt: Date.now(),
          }, null, 2);
        },

        importData: (dataJson) => {
          try {
            const data = JSON.parse(dataJson);
            
            set((state) => ({
              watchHistory: data.watchHistory || [],
              library: data.library || [],
              collections: [...state.collections.filter(c => c.isDefault), ...(data.collections || [])],
              downloads: data.downloads || [],
            }));
          } catch (error) {
            console.error('Failed to import data:', error);
          }
        },

        clearAllData: () => ({
          watchHistory: [],
          library: [],
          collections: get().collections.filter(c => c.isDefault), // Keep default collections
          downloads: [],
        }),

        // Derived selectors
        getContinueWatching: () => {
          const watchHistory = get().watchHistory;
          return watchHistory
            .filter(item => !item.completed && item.progress > 0)
            .sort((a, b) => b.lastWatched - a.lastWatched)
            .slice(0, 20)
            .map(item => ({
              id: item.id,
              contentId: item.contentId,
              type: item.type,
              title: item.title,
              poster: item.poster,
              progress: item.progress,
              lastWatched: item.lastWatched,
              season: item.season,
              episode: item.episode,
            }));
        },

        getFavorites: () => get().library.filter(item => item.favorite),

        getRecentAdditions: (limit = 10) => 
          get().library
            .sort((a, b) => b.addedAt - a.addedAt)
            .slice(0, limit),
      }),
      {
        name: 'novastream-local-data',
        storage: createJSONStorage(() => localStorage),
        // No partialize - store all local data
      }
    )
  )
);

// Selectors for optimized subscriptions
export const useWatchHistory = () => useLocalDataStore((state) => state.watchHistory, shallow);
export const useLibrary = () => useLocalDataStore((state) => state.library, shallow);
export const useCollections = () => useLocalDataStore((state) => state.collections, shallow);
export const useDownloads = () => useLocalDataStore((state) => state.downloads, shallow);
export const useContinueWatching = () => useLocalDataStore((state) => state.getContinueWatching(), shallow);

// Action selectors for cleaner imports
export const useWatchHistoryActions = () => 
  useLocalDataStore((state) => ({
    addToWatchHistory: state.addToWatchHistory,
    updateWatchProgress: state.updateWatchProgress,
    removeFromWatchHistory: state.removeFromWatchHistory,
    clearWatchHistory: state.clearWatchHistory,
    markAsCompleted: state.markAsCompleted,
  }));

export const useLibraryActions = () => 
  useLocalDataStore((state) => ({
    addToLibrary: state.addToLibrary,
    removeFromLibrary: state.removeFromLibrary,
    updateLibraryItem: state.updateLibraryItem,
    setFavorite: state.setFavorite,
    setUserRating: state.setUserRating,
    setNotes: state.setNotes,
    setTags: state.setTags,
    isInLibrary: state.isInLibrary,
    getLibraryItem: state.getLibraryItem,
  }));

export const useCollectionActions = () => 
  useLocalDataStore((state) => ({
    createCollection: state.createCollection,
    updateCollection: state.updateCollection,
    deleteCollection: state.deleteCollection,
    addToCollection: state.addToCollection,
    removeFromCollection: state.removeFromCollection,
  }));

export const useDownloadActions = () => 
  useLocalDataStore((state) => ({
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
    (state) => state.watchHistory.length,
    (length) => {
      console.log(`📺 Watch history now has ${length} items`);
    }
  );
}