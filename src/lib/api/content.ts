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
            // Exclude anime (210024) from generic TV popular list
            const res = await axios.get(`/tmdb-api/tv/popular?language=en-US&page=${randomPage}&without_keywords=210024`);
            const data = res.data.results || [];
            return data.map((item: any) => transformToContent({ ...item, type: 'tv' })).sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error("Failed to fetch popular TV:", error);
            return [];
        }
    },

    getByGenre: async (genreId: number, type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || Math.floor(Math.random() * 5) + 1;
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : ''; // Filter anime from generic TV genres
            const res = await axios.get(`${endpoint}?with_genres=${genreId}&language=en-US&page=${randomPage}&sort_by=popularity.desc${extraFilter}`);
            const data = res.data.results || [];
            return data.map((item: any) => transformToContent({ ...item, type })); // Preserving order for relevance unless specifically shuffled elsewhere
        } catch (error) {
            console.error(`Failed to fetch genre ${genreId}:`, error);
            return [];
        }
    },

    // --- Dynamic Categories (The Candy Store) ---

    getAnime: async (page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || Math.floor(Math.random() * 3) + 1;
            // Discover TV with 'anime' keyword (210024) and Animation genre (16)
            const res = await axios.get(`/tmdb-api/discover/tv?with_keywords=210024&with_genres=16&language=en-US&sort_by=popularity.desc&page=${randomPage}`);
            const data = res.data.results || [];
            return data.map((item: any) => transformToContent({ ...item, type: 'anime' }));
        } catch (error) {
            console.error("Failed to fetch anime:", error);
            return [];
        }
    },

    getBangers: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await axios.get(`${endpoint}?sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getClassics: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const dateFilter = type === 'movie' ? 'primary_release_date.lte=2010-01-01' : 'first_air_date.lte=2010-01-01';
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await axios.get(`${endpoint}?sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getUnderrated: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await axios.get(`${endpoint}?sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getFresh: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const currentYear = new Date().getFullYear();
            const dateFilter = type === 'movie' ? `primary_release_year=${currentYear}` : `first_air_date_year=${currentYear}`;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await axios.get(`${endpoint}?sort_by=popularity.desc&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getRecommendations: async (id: string): Promise<Content[]> => {
        try {
            const cleanId = id.replace('tmdb_', '');
            // We can't easily know the type from just ID here without lookup, but usually recommendations come from same type.
            // Try movie first, if fail/empty try tv. Or better, pass type if possible.
            // For now, let's assume we can get type or just try both.
            // Actually, best is to ask the caller to provide valid context or just return empty if id invalid.
            // Let's rely on the fact that we can often guess or duplicate.
            // A safer bet: The history item SHOULD have the type. But if we only have ID...
            // Optimization: The caller (Page) has the history item, so it knows the type.
            // Let's update signature to take type.
            return [];
        } catch (error) {
            return [];
        }
    },

    getSimilar: async (id: string, type: 'movie' | 'tv' | 'anime'): Promise<Content[]> => {
        try {
            // For Anime, we treat it as TV for TMDB queries usually
            const queryType = type === 'anime' ? 'tv' : type;
            const cleanId = id.replace('tmdb_', '');
            const res = await axios.get(`/tmdb-api/${queryType}/${cleanId}/recommendations?language=en-US&page=1`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    // --- Anime Specific Categories ---
    getAnimeByGenre: async (genreId: string, page?: number): Promise<Content[]> => { // genreId can be genre ID or keyword ID
        try {
            const randomPage = page || 1;
            // 16 is Animation genre.
            // Common Keywords:
            // Isekai: 210024
            // Mecha: 10701
            // Dark Fantasy: 209252
            // Slice of Life: 9840
            // Sports: 6075
            // Psychological: 9880 or genre 9648 (Mystery) + Animation

            const res = await axios.get(`/tmdb-api/discover/tv?with_genres=16&${genreId}&language=en-US&sort_by=popularity.desc&page=${randomPage}`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type: 'anime' }));
        } catch (error) {
            return [];
        }
    },

    getDayOneDrops: async (type: 'movie' | 'tv' = 'movie'): Promise<Content[]> => {
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';

            // Get date range for last 14 days (extended slightly from 7 for better results)
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - 14);

            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            const dateFilter = type === 'movie'
                ? `primary_release_date.gte=${formatDate(pastDate)}&primary_release_date.lte=${formatDate(today)}`
                : `first_air_date.gte=${formatDate(pastDate)}&first_air_date.lte=${formatDate(today)}`;

            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await axios.get(`${endpoint}?sort_by=popularity.desc&${dateFilter}&language=en-US&page=1${extraFilter}`);
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
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
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
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

    getDetails: async (id: string | number, type: 'movie' | 'tv' = 'movie'): Promise<Content | null> => {
        try {
            // Ensure ID is a string
            const idStr = String(id);
            // Strip 'tmdb_' prefix if present
            const cleanId = idStr.replace('tmdb_', '');

            const endpoint = `/tmdb-api/${type}/${cleanId}?language=en-US&append_to_response=credits,recommendations,videos`;
            const res = await axios.get(endpoint);
            return transformToContent({ ...res.data, type });
        } catch (error) {
            console.error(`Failed to fetch ${type} details for ${id}:`, error);
            return null;
        }
    },

    getSeasonDetails: async (id: string | number, seasonNumber: number): Promise<any> => {
        try {
            const idStr = String(id).replace('tmdb_', '');
            const res = await axios.get(`/tmdb-api/tv/${idStr}/season/${seasonNumber}?language=en-US`);
            return res.data;
        } catch (error) {
            console.error(`Failed to fetch season ${seasonNumber} for ${id}:`, error);
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
        id: String(item._id || item.id || `tmdb_${item.tmdbId}`),
        title: item.title || item.name || "Unknown Title",
        description: item.description || item.overview || "",
        poster: getProxyUrl(item.poster_path, item.posterUrl, 'w500', "/images/placeholder.png"),
        backdrop: getProxyUrl(item.backdrop_path, item.backdropUrl, 'original', "/images/hero_placeholder.jpg"),
        rating: item.rating || item.vote_average || 0,
        releaseDate: item.year || item.release_date || item.first_air_date || "2024",
        type: (item.type || item.media_type || "movie") as 'movie' | 'tv' | 'anime',
        genres: (item.genres || []).map((g: any) => typeof g === 'object' ? g.name : g),
        status: 'ongoing',
        isAdult: false,
        seasonsList: item.seasons?.map((s: any) => ({
            id: s.id,
            season_number: s.season_number,
            episode_count: s.episode_count,
            name: s.name
        })) || [],
        cast: item.credits?.cast?.slice(0, 10).map((c: any) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profilePath: c.profile_path ? `/tmdb-img/w185/${c.profile_path}` : null
        })) || [],
        recommendations: item.recommendations?.results?.slice(0, 5).map((r: any) => transformToContent({ ...r, type: r.media_type || item.type || 'movie' })) || [],
        trailer: item.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube")?.key || null
    };
};
