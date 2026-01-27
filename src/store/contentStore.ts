import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface Content {
    id: string;
    title: string;
    slug: string;
    type: 'movie' | 'series' | 'anime';
    posterUrl: string;
    backdropUrl: string;
    description: string;
    genres: string[];
    rating?: number;
    year: number;
}

interface ContentState {
    trending: Content[];
    recent: Content[];
    featured: Content[];
    genreRails: Record<string, Content[]>;
    loading: boolean;
    error: string | null;
    library: string[];

    fetchTrending: () => Promise<void>;
    fetchRecent: () => Promise<void>;
    fetchFeatured: () => Promise<void>;
    fetchLibrary: () => Promise<void>;
    fetchByGenre: (genre: string) => Promise<void>;

    addToLibrary: (contentId: string) => Promise<void>;
    removeFromLibrary: (contentId: string) => Promise<void>;
    isInLibrary: (contentId: string) => boolean;
}

export const useContentStore = create<ContentState>()(
    persist(
        (set, get) => ({
            trending: [],
            recent: [],
            featured: [],
            library: [],
            genreRails: {},
            loading: false,
            error: null,

            fetchTrending: async () => {
                set({ loading: true });
                try {
                    const response = await api.get('/content/trending');
                    set({ trending: response.data, loading: false });
                } catch (err: any) {
                    set({ error: err.message, loading: false });
                }
            },

            fetchRecent: async () => {
                set({ loading: true });
                try {
                    const response = await api.get('/content/recent');
                    set({ recent: response.data, loading: false });
                } catch (err: any) {
                    set({ error: err.message, loading: false });
                }
            },

            fetchFeatured: async () => {
                try {
                    const response = await api.get('/content/featured');
                    set({ featured: Array.isArray(response.data) ? response.data : [response.data] });
                } catch (err: any) {
                    console.error('Failed to fetch featured content:', err);
                }
            },

            fetchByGenre: async (genre: string) => {
                try {
                    const response = await api.get(`/content/genre/${genre}`);
                    set((state) => ({
                        genreRails: { ...state.genreRails, [genre]: response.data }
                    }));
                } catch (err: any) {
                    console.error(`Failed to fetch genre ${genre}:`, err);
                }
            },

            fetchLibrary: async () => {
                try {
                    const response = await api.get('/user/library');
                    set({ library: response.data.map((item: any) => item._id || item.id) });
                } catch (err: any) {
                    console.error('Failed to fetch library:', err);
                }
            },

            addToLibrary: async (contentId) => {
                try {
                    await api.post('/user/library/add', { contentId });
                    set((state: ContentState) => ({ library: [...state.library, contentId] }));
                } catch (err: any) {
                    console.error('Failed to add to library:', err);
                }
            },

            removeFromLibrary: async (contentId) => {
                try {
                    await api.post('/user/library/remove', { contentId });
                    set((state: ContentState) => ({
                        library: state.library.filter((id) => id !== contentId)
                    }));
                } catch (err: any) {
                    console.error('Failed to remove from library:', err);
                }
            },

            isInLibrary: (contentId) => {
                return get().library.includes(contentId);
            }
        }),
        {
            name: 'novastream-content-storage',
            partialize: (state) => ({ library: state.library })
        }
    )
);
