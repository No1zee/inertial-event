import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export interface Content {
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
  heritage?: {
    culturalContext?: string;
    regionalOrigins?: string[];
    accuracyVerified?: boolean;
    curatorNote?: string;
    didYouKnow?: string;
  };
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

export const useContentStore = createWithEqualityFn<ContentState>()(
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
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Unknown error', loading: false });
        }
      },

      fetchRecent: async () => {
        set({ loading: true });
        try {
          const response = await api.get('/content/recent');
          set({ recent: response.data, loading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Unknown error', loading: false });
        }
      },

      fetchFeatured: async () => {
        try {
          const response = await api.get('/content/featured');
          set({ featured: Array.isArray(response.data) ? response.data : [response.data] });
        } catch (err) {
          console.error('Failed to fetch featured content:', err);
        }
      },

      fetchByGenre: async (genre: string) => {
        try {
          const response = await api.get(`/content/genre/${genre}`);
          set(state => ({
            genreRails: { ...state.genreRails, [genre]: response.data },
          }));
        } catch (err) {
          console.error(`Failed to fetch genre ${genre}:`, err);
        }
      },

      fetchLibrary: async () => {
        try {
          const response = await api.get('/user/library');
          set({ library: response.data.map((item: { id: string; _id?: string }) => item._id || item.id) });
        } catch (err) {
          console.error('Failed to fetch library:', err);
        }
      },

      addToLibrary: async contentId => {
        try {
          await api.post('/user/library/add', { contentId });
          set((state: ContentState) => ({ library: [...state.library, contentId] }));
        } catch (err) {
          console.error('Failed to add to library:', err);
        }
      },

      removeFromLibrary: async contentId => {
        try {
          await api.post('/user/library/remove', { contentId });
          set((state: ContentState) => ({
            library: state.library.filter(id => id !== contentId),
          }));
        } catch (err) {
          console.error('Failed to remove from library:', err);
        }
      },

      isInLibrary: contentId => {
        return get().library.includes(contentId);
      },
    }),
    {
      name: 'MaiWatch-content-storage',
      partialize: state => ({ library: state.library }),
    }
  )
);
