import axios from "axios";
import { Content } from "@/lib/types/content";
import { Capacitor } from "@capacitor/core";
import { generateMockContent, MOCK_MOVIES, MOCK_TV_SHOWS } from "./mockData";

const API_URL = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('your-vercel-domain')) 
    ? process.env.NEXT_PUBLIC_API_URL 
    : "";
// Hardcoded for static export - TMDB keys are meant to be public anyway
const TMDB_KEY = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_TMDB_API_KEY && process.env.NEXT_PUBLIC_TMDB_API_KEY !== 'your_tmdb_key_here')
    ? process.env.NEXT_PUBLIC_TMDB_API_KEY
    : "6594af88c7e3a157c33d352d5efc74ba";
const BASE_URL = "https://api.themoviedb.org/3";

// Helper to handle URL switching between Proxy (Dev) and Direct (Prod/Android)
const getTmdbUrl = (endpoint: string, params: string = "") => {
    // Always hit TMDB directly with API key
    const separator = endpoint.includes('?') ? '&' : '?';
    const finalParams = params ? `&${params}` : '';
    return `${BASE_URL}${endpoint}${separator}api_key=${TMDB_KEY}${finalParams}`;
};

export const contentApi = {
    getCollectionDetails: async (collectionId: string | number): Promise<{ id: number; name: string; overview: string; poster_path: string; backdrop_path: string; parts: Content[] }> => {
        // Return mock for now
        return { id: 0, name: 'Mock Collection', overview: '', poster_path: '', backdrop_path: '', parts: generateMockContent(5) };
    },

    getTrending: async (page: number = 1): Promise<Content[]> => {
        try {
            const res = await axios.get(getTmdbUrl('/trending/all/day', `language=en-US&page=${page}`));
            const data = res.data.results || [];
            return data.map((item: any) => transformToContent(item));
        } catch (error) {
            console.error("Failed to fetch trending:", error);
            return generateMockContent(10);
        }
    },

    getPopularTV: async (page: number = 1): Promise<Content[]> => {
        try {
            const res = await axios.get(getTmdbUrl('/tv/popular', `language=en-US&page=${page}`));
            const data = res.data.results || [];
            return data.map((item: any) => transformToContent({ ...item, type: 'tv' }));
        } catch (error) {
            console.error("Failed to fetch popular tv:", error);
            // Fallback to mock on error only
            return [...MOCK_TV_SHOWS, ...generateMockContent(5)];
        }
    },

    getByGenre: async (genreId: number, type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
            const randomPage = page || 1;
            const res = await axios.get(getTmdbUrl(endpoint, `with_genres=${genreId}&sort_by=popularity.desc&language=en-US&page=${randomPage}`));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            // Fallback
            return generateMockContent(10);
        }
    },

    // --- Dynamic Categories (The Candy Store) ---

    getUpcoming: async (page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || 1;
            const res = await axios.get(getTmdbUrl('/movie/upcoming', `language=en-US&region=US&page=${randomPage}`));
            const data = res.data.results || [];
            // Filter only future dates to be safe
            const futureEvents = data.filter((item: any) => {
                 const release = new Date(item.release_date);
                 return release > new Date();
            });
            return futureEvents.map((item: any) => transformToContent({ ...item, type: 'movie' }));
        } catch (error) {
            console.error("Failed to fetch upcoming:", error);
            return [];
        }
    },

    getAnime: async (page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || Math.floor(Math.random() * 3) + 1;
            const res = await axios.get(getTmdbUrl('/discover/tv', `with_keywords=210024&with_genres=16&language=en-US&sort_by=popularity.desc&page=${randomPage}`));
            const data = res.data.results || [];
            return data.map((item: any) => transformToContent({ ...item, type: 'anime' }));
        } catch (error) {
            console.error("Failed to fetch anime:", error);
            return [];
        }
    },

    getBangers: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
            const randomPage = page || 1;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const [res1, res2] = await Promise.all([
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage}${extraFilter}`)),
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage + 1}${extraFilter}`))
            ]);
            const data = [...(res1.data.results || []), ...(res2.data.results || [])];
            return data.map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getClassics: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
            const randomPage = page || 1;
            const dateFilter = type === 'movie' ? 'primary_release_date.lte=2010-01-01' : 'first_air_date.lte=2010-01-01';
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';

            const [res1, res2] = await Promise.all([
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`)),
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage + 1}${extraFilter}`))
            ]);

            const data = [...(res1.data.results || []), ...(res2.data.results || [])];
            return data.map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getUnderrated: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
            const randomPage = page || 1;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';

            const [res1, res2] = await Promise.all([
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=${randomPage}${extraFilter}`)),
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=${randomPage + 1}${extraFilter}`))
            ]);
            const data = [...(res1.data.results || []), ...(res2.data.results || [])];
            return data.map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    getFresh: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
        try {
            const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
            const randomPage = page || 1;
            const currentYear = new Date().getFullYear();
            const dateFilter = type === 'movie' ? `primary_release_year=${currentYear}` : `first_air_date_year=${currentYear}`;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';

            const [res1, res2] = await Promise.all([
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`)),
                axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${randomPage + 1}${extraFilter}`))
            ]);
            const data = [...(res1.data.results || []), ...(res2.data.results || [])];
            return data.map((item: any) => transformToContent({ ...item, type }));
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
            const res = await axios.get(getTmdbUrl(`/${queryType}/${cleanId}/recommendations`, 'language=en-US&page=1'));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    // --- Anime Specific Categories ---
    // --- Anime Specific Categories ---
    getAnimeByGenre: async (genreQuery: string, page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || 1;
            const res = await axios.get(getTmdbUrl('/discover/tv', `${genreQuery}&with_keywords=210024&language=en-US&sort_by=popularity.desc&page=${randomPage}`));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type: 'anime' }));
        } catch (error) {
            return [];
        }
    },

    getEnglishAnime: async (page?: number): Promise<Content[]> => {
        try {
            const randomPage = page || 1;
            // Bias towards English original language OR specific English-market keywords
            const res = await axios.get(getTmdbUrl('/discover/tv', `with_genres=16&with_keywords=210024&with_original_language=en&sort_by=popularity.desc&page=${randomPage}`));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type: 'anime' }));
        } catch (error) {
            console.error("Failed to fetch english anime:", error);
            return [];
        }
    },

    // --- specialized "Candy Store" categories ---

    getShortAndSweet: async (page?: number): Promise<Content[]> => {
        try {
            // Movies under 100 minutes with good ratings
            const res = await axios.get(getTmdbUrl('/discover/movie', `with_runtime.lte=100&vote_average.gte=7&sort_by=popularity.desc&page=${page || 1}`));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type: 'movie' }));
        } catch (error) {
            return [];
        }
    },

    getFeelGood: async (page?: number): Promise<Content[]> => {
        try {
            // Comedy (35), Family (10751), Music (10402)
            const res = await axios.get(getTmdbUrl('/discover/movie', `with_genres=35,10751,10402&sort_by=popularity.desc&page=${page || 1}`));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type: 'movie' }));
        } catch (error) {
            return [];
        }
    },

    getDayOneDrops: async (type: 'movie' | 'tv' = 'movie', page: number = 1): Promise<Content[]> => {
        try {
            const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';

            // Get date range for last 14 days (extended slightly from 7 for better results)
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - 14);

            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            const dateFilter = type === 'movie'
                ? `primary_release_date.gte=${formatDate(pastDate)}&primary_release_date.lte=${formatDate(today)}`
                : `first_air_date.gte=${formatDate(pastDate)}&first_air_date.lte=${formatDate(today)}`;

            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await axios.get(getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${page}${extraFilter}`));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            return [];
        }
    },

    // Flexible discover for custom categories (A24, CBM, etc.)
    discover: async (params: { [key: string]: any }, type: 'movie' | 'tv' = 'movie'): Promise<Content[]> => {
        try {
            const queryParams = new URLSearchParams({
                language: 'en-US',
                page: (params.page || Math.floor(Math.random() * 3) + 1).toString(),
                sort_by: params.sort_by || 'popularity.desc',
                ...params
            } as any);

            const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
            const res = await axios.get(getTmdbUrl(endpoint, queryParams.toString()));
            return (res.data.results || []).map((item: any) => transformToContent({ ...item, type }));
        } catch (error) {
            console.error("Failed to discover content:", error);
            return [];
        }
    },

    searchContent: async (query: string, page: number = 1): Promise<Content[]> => {
        try {
            if (!query) return [];
            const res = await axios.get(getTmdbUrl('/search/multi', `query=${encodeURIComponent(query)}&page=${page}&language=en-US&include_adult=false`));

            // Filter out 'person' results
            const results = (res.data.results || []).filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');

            return results.map(transformToContent);
        } catch (error) {
            console.error("Search failed:", error);
            return [];
        }
    },

    getTrailer: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<string | null> => {
        try {
            const cleanId = id.replace('tmdb_', '');
            const res = await axios.get(getTmdbUrl(`/${type}/${cleanId}/videos`, 'language=en-US'));
            const videos = res.data.results || [];
            const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") || videos[0];
            return trailer ? trailer.key : null;
        } catch (error) {
            return null;
        }
    },

    getDetails: async (id: string | number, type: 'movie' | 'tv' = 'movie'): Promise<Content | null> => {
        try {
            const idStr = String(id);
            // Handle mock IDs
            if (idStr.startsWith('mock-')) {
                const index = parseInt(idStr.split('-')[1]);
                return {
                    id: idStr,
                    title: `Content Title ${index + 1}`,
                    description: "This is a detailed mock description for testing purposes.",
                    poster: "/images/placeholder.png",
                    backdrop: "/images/hero_placeholder.jpg",
                    rating: 8.5,
                    releaseDate: "2024-01-01",
                    type: type,
                    genres: ["Mock", "Test"],
                    status: 'completed',
                    isAdult: false,
                    seasonsList: [],
                    cast: [],
                    recommendations: [],
                    trailer: null
                };
            }

            // Strip 'tmdb_' prefix if present
            const cleanId = idStr.replace('tmdb_', '');

            const endpoint = type === 'movie' ? `/movie/${cleanId}` : `/tv/${cleanId}`;
            const res = await axios.get(getTmdbUrl(endpoint, 'language=en-US&append_to_response=credits,recommendations,videos'));
            return transformToContent({ ...res.data, type });
        } catch (error) {
            console.error(`Failed to fetch ${type} details for ${id}:`, error);
            return null;
        }
    },

    getSeasonDetails: async (id: string | number, seasonNumber: number): Promise<any> => {
        try {
            const idStr = String(id).replace('tmdb_', '');
            const res = await axios.get(getTmdbUrl(`/tv/${idStr}/season/${seasonNumber}`, 'language=en-US'));
            return res.data;
        } catch (error) {
            console.error(`Failed to fetch season ${seasonNumber} for ${id}:`, error);
            return null;
        }
    },

    search: async (query: string): Promise<Content[]> => {
        try {
            const res = await axios.get(getTmdbUrl('/search/multi', `query=${encodeURIComponent(query)}&page=1&include_adult=false&language=en-US`));
            const data = res.data.results || [];
            // Filter only movie and tv
            const filtered = data.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
            return filtered.map(transformToContent);
        } catch (error) {
            console.error("Failed to search content:", error);
            return [];
        }
    }
};

const transformToContent = (item: any): Content => {
    // Use direct TMDB images with smaller sizes for performance
    const getProxyUrl = (tmdbPath: string | null, fallbackUrl: string | null, size: string, fallbackAsset: string) => {
        if (tmdbPath) {
            const cleanPath = tmdbPath.startsWith('/') ? tmdbPath.substring(1) : tmdbPath;
            // Use smaller image sizes: w342 for posters, w780 for backdrops
            const optimizedSize = size === 'original' ? 'w780' : (size === 'w500' ? 'w342' : size);
            return `https://image.tmdb.org/t/p/${optimizedSize}/${cleanPath}`;
        }
        if (fallbackUrl && fallbackUrl.includes('tmdb.org')) {
            return fallbackUrl;
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
        lastAirDate: item.last_air_date || null,
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
            profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185/${c.profile_path}` : null
        })) || [],
        trailer: item.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube")?.key || null,
        belongsToCollection: item.belongs_to_collection || null,
        ratings: {
            imdb: { 
                score: item.vote_average ? Number(item.vote_average.toFixed(1)) : 0, 
                votes: item.vote_count 
            },
            rottenTomatoes: { 
                score: item.vote_average ? Math.round(item.vote_average * 10) : 0, 
                state: (item.vote_average * 10) >= 75 ? 'certified' : (item.vote_average * 10) >= 60 ? 'fresh' : 'rotten' 
            }
        }
    };
};

