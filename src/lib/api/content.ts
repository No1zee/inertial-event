import axios from "axios";
import { Content } from "@/lib/types/content";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const contentApi = {
    getTrending: async (): Promise<Content[]> => {
        try {
            // Randomize page 1-3 to ensure freshness on reload
            const randomPage = Math.floor(Math.random() * 3) + 1;
            const res = await axios.get(`/tmdb-api/trending/all/day?language=en-US&page=${randomPage}`);
            const data = res.data.results || [];
            return data.map(transformToContent).sort(() => Math.random() - 0.5); // Shuffle results
        } catch (error) {
            console.error("Failed to fetch trending:", error);
            return [];
        }
    },

    getPopularTV: async (): Promise<Content[]> => {
        try {
            const randomPage = Math.floor(Math.random() * 5) + 1;
            const res = await axios.get(`/tmdb-api/tv/popular?language=en-US&page=${randomPage}`);
            const data = res.data.results || [];
            return data.map(transformToContent).sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error("Failed to fetch popular TV:", error);
            return [];
        }
    },

    getByGenre: async (genreId: number, type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || Math.floor(Math.random() * 5) + 1;
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const res = await axios.get(`${endpoint}?with_genres=${genreId}&language=en-US&page=${randomPage}&sort_by=popularity.desc`);
            const data = res.data.results || [];
            return data.map(transformToContent); // Preserving order for relevance unless specifically shuffled elsewhere
        } catch (error) {
            console.error(`Failed to fetch genre ${genreId}:`, error);
            return [];
        }
    },

    // Flexible discover for custom categories (A24, CBM, etc.)
    discover: async (params: { with_companies?: string; with_keywords?: string; with_genres?: string; sort_by?: string; page?: number }, type: 'movie' | 'tv' = 'movie'): Promise<Content[]> => {
        try {
            const queryParams = new URLSearchParams({
                language: 'en-US',
                page: (params.page || Math.floor(Math.random() * 3) + 1).toString(),
                sort_by: params.sort_by || 'popularity.desc',
                ...params
            } as any);

            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const res = await axios.get(`${endpoint}?${queryParams.toString()}`);
            return (res.data.results || []).map(transformToContent);
        } catch (error) {
            console.error("Failed to discover content:", error);
            return [];
        }
    },

    getTrailer: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<string | null> => {
        try {
            const cleanId = id.replace('tmdb_', '');
            const res = await axios.get(`/tmdb-api/${type}/${cleanId}/videos?language=en-US`);
            const videos = res.data.results || [];
            const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") || videos[0];
            return trailer ? trailer.key : null;
        } catch (error) {
            return null;
        }
    },

    getDetails: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<Content | null> => {
        try {
            // Strip 'tmdb_' prefix if present
            const cleanId = id.replace('tmdb_', '');

            const endpoint = `/tmdb-api/${type}/${cleanId}?language=en-US`;
            const res = await axios.get(endpoint);
            return transformToContent({ ...res.data, type });
        } catch (error) {
            console.error(`Failed to fetch ${type} details for ${id}:`, error);
            return null;
        }
    }
};

const transformToContent = (item: any): Content => {
    // Helper to extract path and ensure w500/original prefix for the proxy
    const getProxyUrl = (tmdbPath: string | null, fallbackUrl: string | null, size: string, fallbackAsset: string) => {
        if (tmdbPath) {
            // Ensure path is clean (remove leading slash if it exists, proxy adds it)
            const cleanPath = tmdbPath.startsWith('/') ? tmdbPath.substring(1) : tmdbPath;
            return `/tmdb-img/${size}/${cleanPath}`;
        }
        if (fallbackUrl && fallbackUrl.includes('tmdb.org')) {
            const parts = fallbackUrl.split('/t/p/');
            if (parts[1]) return `/tmdb-img/${parts[1]}`;
        }
        return fallbackUrl || fallbackAsset;
    };

    return {
        id: item._id || item.id || `tmdb_${item.tmdbId}`,
        title: item.title || item.name || "Unknown Title",
        description: item.description || item.overview || "",
        poster: getProxyUrl(item.poster_path, item.posterUrl, 'w500', "/images/placeholder.png"),
        backdrop: getProxyUrl(item.backdrop_path, item.backdropUrl, 'original', "/images/hero_placeholder.jpg"),
        rating: item.rating || item.vote_average || 0,
        releaseDate: item.year || item.release_date || item.first_air_date || "2024",
        type: (item.type || item.media_type || "movie") as 'movie' | 'tv' | 'anime',
        genres: item.genres || [],
        status: 'ongoing',
        isAdult: false
    };
};
