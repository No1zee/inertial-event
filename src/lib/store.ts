import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movie } from './tmdb';

export interface DownloadItem {
    id: string; // filename
    title: string;
    progress: number;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    path?: string;
    poster_path?: string;
    backdrop_path?: string;
    media_type: 'movie' | 'tv';
    sizeStr?: string; // e.g. "1.2 GB"
    stats?: { downloaded: number; total: number; type: 'segments' | 'bytes' };
    tmdbId?: number;
}

export interface WatchHistoryItem {
    id: string; // `${tmdbId}-${type}-${season}-${episode}`
    tmdbId: number;
    title: string;
    media_type: 'movie' | 'tv';
    poster_path: string;
    backdrop_path?: string;

    // Playback tracking
    currentTime: number; // seconds
    duration: number; // total duration in seconds
    progress: number; // percentage (0-100)

    // TV-specific
    season?: number;
    episode?: number;

    // Metadata
    lastWatched: number; // timestamp
    completed: boolean; // true if progress > 90%

    // Torrent Data
    magnet?: string;
    torrentUrl?: string;
}

interface LibraryState {
    library: Movie[];
    history: Movie[];
    downloads: DownloadItem[];
    addToLibrary: (movie: Movie) => void;
    removeFromLibrary: (id: number) => void;
    isInLibrary: (id: number) => boolean;
    addToHistory: (movie: Movie) => void;

    // Download Actions
    addDownload: (item: DownloadItem) => void;
    updateProgress: (id: string, progress: number, stats?: DownloadItem['stats']) => void;
    setDownloadStatus: (id: string, status: DownloadItem['status']) => void;
    finishDownload: (id: string, path: string) => void;
    removeDownload: (id: string) => void;

    // Watch History Actions
    watchHistory: WatchHistoryItem[];
    addToWatchHistory: (item: Omit<WatchHistoryItem, 'lastWatched' | 'completed'>) => void;
    updateWatchProgress: (id: string, currentTime: number, duration: number) => void;
    removeFromWatchHistory: (id: string) => void;
    clearWatchHistory: () => void;

    // UI State (Global)
    isModalOpen: boolean;
    setModalOpen: (isOpen: boolean) => void;
    isDubMode: boolean;
    setDubMode: (isDub: boolean) => void;

    // Settings
    settings: {
        autoPlayInfo: boolean; // Auto-play the modal trailer? (Maybe later)
        autoPlayNext: boolean; // Auto-play next episode
        quality: '1080p' | '720p' | '480p';
        volume: number;
        preferTorrents: boolean; // Use torrent search first before VidLink
    };
    checkNewEpisodes: () => Promise<void>;
    toggleAutoPlayNext: () => void;
    setQuality: (q: '1080p' | '720p' | '480p') => void;
    setVolume: (vol: number) => void;
    setPreferTorrents: (enabled: boolean) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            library: [],
            history: [],
            downloads: [],
            watchHistory: [],

            // UI State
            isModalOpen: false,
            setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
            isDubMode: false,
            setDubMode: (isDub) => set({ isDubMode: isDub }),

            settings: {
                autoPlayInfo: true,
                autoPlayNext: true, // Enable by default
                quality: '1080p',
                volume: 1,
                preferTorrents: false, // Disabled by default (opt-in)

            },

            addToLibrary: (movie) => set((state) => {
                if (state.library.some((m) => m.id === movie.id)) return state;
                return { library: [...state.library, movie] };
            }),
            removeFromLibrary: (id) => set((state) => ({
                library: state.library.filter((m) => m.id !== id)
            })),
            isInLibrary: (id) => get().library.some((m) => m.id === id),
            addToHistory: (movie) => set((state) => {
                const filtered = state.history.filter((m) => m.id !== movie.id);
                return { history: [movie, ...filtered].slice(0, 20) };
            }),

            addDownload: (item) => set((state) => ({
                downloads: [item, ...state.downloads.filter(d => d.id !== item.id)]
            })),
            updateProgress: (id, progress, stats) =>
                set((state) => ({
                    downloads: state.downloads.map((d) =>
                        d.id === id ? { ...d, progress, stats, status: progress === 100 ? 'completed' : 'downloading' } : d
                    ),
                })),
            setDownloadStatus: (id, status) =>
                set((state) => ({
                    downloads: state.downloads.map((d) =>
                        d.id === id ? { ...d, status } : d
                    ),
                })),
            finishDownload: (id, path) =>
                set((state) => ({
                    downloads: state.downloads.map((d) =>
                        d.id === id ? { ...d, status: 'completed', progress: 100, path } : d
                    ),
                })),
            removeDownload: (id) => set((state) => ({
                downloads: state.downloads.filter((d) => d.id !== id)
            })),

            checkNewEpisodes: async () => {
                const state = get();
                const tvShows = state.library.filter(m => m.media_type === 'tv');
                if (tvShows.length === 0) return;

                console.log('🔄 Checking for new episodes for', tvShows.length, 'shows...');
                // TODO: Implement actual TMDB check logic here
                // For now, this placeholder prevents the runtime crash
            },

            // Watch History Implementations
            addToWatchHistory: (item) => set((state) => {
                const existingIndex = state.watchHistory.findIndex(h => h.id === item.id);
                const newItem: WatchHistoryItem = {
                    ...item,
                    lastWatched: Date.now(),
                    completed: item.progress > 90
                };

                if (existingIndex >= 0) {
                    // Update existing
                    const updated = [...state.watchHistory];
                    updated[existingIndex] = newItem;
                    return { watchHistory: updated };
                } else {
                    // Add new, limit to 50 items
                    return { watchHistory: [newItem, ...state.watchHistory].slice(0, 50) };
                }
            }),

            updateWatchProgress: (id, currentTime, duration) => set((state) => {
                const progress = (currentTime / duration) * 100;
                const completed = progress > 90;

                return {
                    watchHistory: state.watchHistory.map(item =>
                        item.id === id
                            ? { ...item, currentTime, duration, progress, lastWatched: Date.now(), completed }
                            : item
                    )
                };
            }),

            removeFromWatchHistory: (id) => set((state) => ({
                watchHistory: state.watchHistory.filter(h => h.id !== id)
            })),

            clearWatchHistory: () => set({ watchHistory: [] }),

            // Settings Implementations
            toggleAutoPlayNext: () => set((state) => ({
                settings: { ...state.settings, autoPlayNext: !state.settings.autoPlayNext }
            })),
            setQuality: (q) => set((state) => ({ settings: { ...state.settings, quality: q } })),
            setVolume: (vol) => set((state) => ({ settings: { ...state.settings, volume: vol } })),
            setPreferTorrents: (enabled) => set((state) => ({ settings: { ...state.settings, preferTorrents: enabled } })),
        }),
        {
            name: 'novastream-library',
        }
    )
);
