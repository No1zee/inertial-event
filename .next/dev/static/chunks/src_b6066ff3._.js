(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/api/content.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contentApi",
    ()=>contentApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:5000/api") || "http://localhost:5000/api";
const contentApi = {
    getTrending: async ()=>{
        try {
            // Randomize page 1-3 to ensure freshness on reload
            const randomPage = Math.floor(Math.random() * 3) + 1;
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/trending/all/day?language=en-US&page=${randomPage}`);
            const data = res.data.results || [];
            return data.map(transformToContent).sort(()=>Math.random() - 0.5); // Shuffle results
        } catch (error) {
            console.error("Failed to fetch trending:", error);
            return [];
        }
    },
    getPopularTV: async ()=>{
        try {
            const randomPage = Math.floor(Math.random() * 5) + 1;
            // Exclude anime (210024) from generic TV popular list
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/tv/popular?language=en-US&page=${randomPage}&without_keywords=210024`);
            const data = res.data.results || [];
            return data.map((item)=>transformToContent({
                    ...item,
                    type: 'tv'
                })).sort(()=>Math.random() - 0.5);
        } catch (error) {
            console.error("Failed to fetch popular TV:", error);
            return [];
        }
    },
    getByGenre: async (genreId, type = 'movie', page)=>{
        try {
            const randomPage = page || Math.floor(Math.random() * 5) + 1;
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : ''; // Filter anime from generic TV genres
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?with_genres=${genreId}&language=en-US&page=${randomPage}&sort_by=popularity.desc${extraFilter}`);
            const data = res.data.results || [];
            return data.map((item)=>transformToContent({
                    ...item,
                    type
                })); // Preserving order for relevance unless specifically shuffled elsewhere
        } catch (error) {
            console.error(`Failed to fetch genre ${genreId}:`, error);
            return [];
        }
    },
    // --- Dynamic Categories (The Candy Store) ---
    getAnime: async (page)=>{
        try {
            const randomPage = page || Math.floor(Math.random() * 3) + 1;
            // Discover TV with 'anime' keyword (210024) and Animation genre (16)
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/discover/tv?with_keywords=210024&with_genres=16&language=en-US&sort_by=popularity.desc&page=${randomPage}`);
            const data = res.data.results || [];
            return data.map((item)=>transformToContent({
                    ...item,
                    type: 'anime'
                }));
        } catch (error) {
            console.error("Failed to fetch anime:", error);
            return [];
        }
    },
    getBangers: async (type = 'movie', page)=>{
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            return [];
        }
    },
    getClassics: async (type = 'movie', page)=>{
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const dateFilter = type === 'movie' ? 'primary_release_date.lte=2010-01-01' : 'first_air_date.lte=2010-01-01';
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            return [];
        }
    },
    getUnderrated: async (type = 'movie', page)=>{
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            return [];
        }
    },
    getFresh: async (type = 'movie', page)=>{
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const randomPage = page || 1;
            const currentYear = new Date().getFullYear();
            const dateFilter = type === 'movie' ? `primary_release_year=${currentYear}` : `first_air_date_year=${currentYear}`;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?sort_by=popularity.desc&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            return [];
        }
    },
    getRecommendations: async (id)=>{
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
    getSimilar: async (id, type)=>{
        try {
            // For Anime, we treat it as TV for TMDB queries usually
            const queryType = type === 'anime' ? 'tv' : type;
            const cleanId = id.replace('tmdb_', '');
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/${queryType}/${cleanId}/recommendations?language=en-US&page=1`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            return [];
        }
    },
    // --- Anime Specific Categories ---
    getAnimeByGenre: async (genreId, page)=>{
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
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/discover/tv?with_genres=16&${genreId}&language=en-US&sort_by=popularity.desc&page=${randomPage}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type: 'anime'
                }));
        } catch (error) {
            return [];
        }
    },
    getDayOneDrops: async (type = 'movie')=>{
        try {
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            // Get date range for last 14 days (extended slightly from 7 for better results)
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - 14);
            const formatDate = (d)=>d.toISOString().split('T')[0];
            const dateFilter = type === 'movie' ? `primary_release_date.gte=${formatDate(pastDate)}&primary_release_date.lte=${formatDate(today)}` : `first_air_date.gte=${formatDate(pastDate)}&first_air_date.lte=${formatDate(today)}`;
            const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?sort_by=popularity.desc&${dateFilter}&language=en-US&page=1${extraFilter}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            return [];
        }
    },
    // Flexible discover for custom categories (A24, CBM, etc.)
    discover: async (params, type = 'movie')=>{
        try {
            const queryParams = new URLSearchParams({
                language: 'en-US',
                page: (params.page || Math.floor(Math.random() * 3) + 1).toString(),
                sort_by: params.sort_by || 'popularity.desc',
                ...params
            });
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?${queryParams.toString()}`);
            return (res.data.results || []).map((item)=>transformToContent({
                    ...item,
                    type
                }));
        } catch (error) {
            console.error("Failed to discover content:", error);
            return [];
        }
    },
    getTrailer: async (id, type = 'movie')=>{
        try {
            const cleanId = id.replace('tmdb_', '');
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/${type}/${cleanId}/videos?language=en-US`);
            const videos = res.data.results || [];
            const trailer = videos.find((v)=>v.type === "Trailer" && v.site === "YouTube") || videos[0];
            return trailer ? trailer.key : null;
        } catch (error) {
            return null;
        }
    },
    getDetails: async (id, type = 'movie')=>{
        try {
            // Ensure ID is a string
            const idStr = String(id);
            // Strip 'tmdb_' prefix if present
            const cleanId = idStr.replace('tmdb_', '');
            const endpoint = `/tmdb-api/${type}/${cleanId}?language=en-US&append_to_response=credits,recommendations,videos`;
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(endpoint);
            return transformToContent({
                ...res.data,
                type
            });
        } catch (error) {
            console.error(`Failed to fetch ${type} details for ${id}:`, error);
            return null;
        }
    },
    getSeasonDetails: async (id, seasonNumber)=>{
        try {
            const idStr = String(id).replace('tmdb_', '');
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/tv/${idStr}/season/${seasonNumber}?language=en-US`);
            return res.data;
        } catch (error) {
            console.error(`Failed to fetch season ${seasonNumber} for ${id}:`, error);
            return null;
        }
    }
};
const transformToContent = (item)=>{
    // Helper to extract path and ensure w500/original prefix for the proxy
    const getProxyUrl = (tmdbPath, fallbackUrl, size, fallbackAsset)=>{
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
        type: item.type || item.media_type || "movie",
        genres: (item.genres || []).map((g)=>typeof g === 'object' ? g.name : g),
        status: 'ongoing',
        isAdult: false,
        seasonsList: item.seasons?.map((s)=>({
                id: s.id,
                season_number: s.season_number,
                episode_count: s.episode_count,
                name: s.name
            })) || [],
        cast: item.credits?.cast?.slice(0, 10).map((c)=>({
                id: c.id,
                name: c.name,
                character: c.character,
                profilePath: c.profile_path ? `/tmdb-img/w185/${c.profile_path}` : null
            })) || [],
        recommendations: item.recommendations?.results?.slice(0, 5).map((r)=>transformToContent({
                ...r,
                type: r.media_type || item.type || 'movie'
            })) || [],
        trailer: item.videos?.results?.find((v)=>v.type === "Trailer" && v.site === "YouTube")?.key || null
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/sourceProvider.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
class SourceProvider {
    consumetAPI = 'https://api.consumet.org';
    cache = new Map();
    async getSources(contentId, type, title) {
        try {
            console.log(`[SourceProvider] Fetching: /api/sources?id=${contentId}&type=${type}&title=${title}`);
            const response = await fetch(`/api/sources?id=${contentId}&type=${type}&title=${encodeURIComponent(title)}`);
            if (!response.ok) {
                console.error("[SourceProvider] API error:", response.status, response.statusText);
                return [];
            }
            const data = await response.json();
            console.log("[SourceProvider] Raw API Data:", data);
            return data.sources || [];
        } catch (error) {
            console.error('Source fetch error:', error);
            return [];
        }
    }
    async getAllSources(content, season = 1, episode = 1) {
        const cacheKey = `${content.type}:${content.id}:${season}:${episode}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const sources = new Map();
        // Single call to backend which handles aggregator logic (Vidlink + Torrent + etc)
        const url = `/api/sources?id=${content.id}&type=${content.type}&title=${encodeURIComponent(content.title)}&season=${season}&episode=${episode}`;
        console.log(`[SourceProvider] Fetching: ${url}`);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error("[SourceProvider] API error:", response.status, response.statusText);
                return sources;
            }
            const data = await response.json();
            const allSources = data.sources || [];
            if (allSources.length > 0) {
                // Group by type for the UI
                const vidlink = allSources.filter((s)=>s.type === 'hls' || s.type === 'embed');
                const torrent = allSources.filter((s)=>s.type === 'torrent' || s.type === 'mp4');
                if (vidlink.length > 0) sources.set('vidlink', vidlink);
                if (torrent.length > 0) sources.set('torrent', torrent);
            }
            this.cache.set(cacheKey, sources);
            return sources;
        } catch (error) {
            console.error('Source fetch error:', error);
            return sources;
        }
    }
    clearCache() {
        this.cache.clear();
    }
}
const sourceProvider = new SourceProvider();
const __TURBOPACK__default__export__ = sourceProvider;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/store/playerStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePlayerStore",
    ()=>usePlayerStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const usePlayerStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        isPlaying: false,
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        quality: 'auto',
        isFullscreen: false,
        showControls: true,
        setPlaying: (isPlaying)=>set({
                isPlaying
            }),
        setVolume: (volume)=>set({
                volume
            }),
        setMuted: (muted)=>set({
                muted
            }),
        setCurrentTime: (currentTime)=>set({
                currentTime
            }),
        setDuration: (duration)=>set({
                duration
            }),
        setPlaybackRate: (playbackRate)=>set({
                playbackRate
            }),
        setQuality: (quality)=>set({
                quality
            }),
        setFullscreen: (isFullscreen)=>set({
                isFullscreen
            }),
        setShowControls: (showControls)=>set({
                showControls
            }),
        reset: ()=>set({
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                isFullscreen: false,
                showControls: true
            })
    }), {
    name: 'novastream-player-storage',
    partialize: (state)=>({
            volume: state.volume,
            muted: state.muted,
            quality: state.quality,
            playbackRate: state.playbackRate
        })
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/store/historyStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useHistoryStore",
    ()=>useHistoryStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const useHistoryStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        history: [],
        addToHistory: (content)=>set((state)=>{
                // Remove if already exists to move to top
                const filtered = state.history.filter((i)=>i.id !== content.id);
                // Keep only last 20
                return {
                    history: [
                        content,
                        ...filtered
                    ].slice(0, 20)
                };
            }),
        clearHistory: ()=>set({
                history: []
            }),
        getLastWatched: ()=>get().history[0]
    }), {
    name: 'novastream-history-storage'
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/player/VideoPlayer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VideoPlayer",
    ()=>VideoPlayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@vidstack/react/dev/vidstack.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$chunks$2f$vidstack$2d$BIA_pmri$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@vidstack/react/dev/chunks/vidstack-BIA_pmri.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$player$2f$vidstack$2d$default$2d$icons$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@vidstack/react/dev/player/vidstack-default-icons.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store/playerStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function VideoPlayer({ src, poster, title, subtitles, onEnded }) {
    _s();
    const player = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { setPlaying, setDuration, setCurrentTime, setVolume, setMuted, setFullscreen } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlayerStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VideoPlayer.useEffect": ()=>{
            // Sync state with store
            const instance = player.current;
            if (!instance) return;
            return instance.subscribe({
                "VideoPlayer.useEffect": (state)=>{
                    setPlaying(state.playing);
                    setDuration(state.duration);
                    setCurrentTime(state.currentTime);
                    setVolume(state.volume);
                    setMuted(state.muted);
                    setFullscreen(state.fullscreen);
                    if (state.ended) onEnded?.();
                }
            }["VideoPlayer.useEffect"]);
        }
    }["VideoPlayer.useEffect"], [
        src,
        onEnded,
        setPlaying,
        setDuration,
        setCurrentTime,
        setVolume,
        setMuted,
        setFullscreen
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MediaPlayer"], {
            ref: player,
            title: title,
            src: src,
            className: "w-full h-full",
            aspectRatio: "16/9",
            load: "eager",
            poster: poster,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MediaProvider"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Poster"], {
                            className: "vds-poster"
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/VideoPlayer.tsx",
                            lineNumber: 59,
                            columnNumber: 21
                        }, this),
                        subtitles?.map((track, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Track"], {
                                ...track,
                                kind: "subtitles"
                            }, i, false, {
                                fileName: "[project]/src/components/player/VideoPlayer.tsx",
                                lineNumber: 61,
                                columnNumber: 25
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/VideoPlayer.tsx",
                    lineNumber: 58,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$chunks$2f$vidstack$2d$BIA_pmri$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultVideoLayout"], {
                    icons: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$player$2f$vidstack$2d$default$2d$icons$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultLayoutIcons"]
                }, void 0, false, {
                    fileName: "[project]/src/components/player/VideoPlayer.tsx",
                    lineNumber: 70,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/player/VideoPlayer.tsx",
            lineNumber: 49,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/player/VideoPlayer.tsx",
        lineNumber: 48,
        columnNumber: 9
    }, this);
}
_s(VideoPlayer, "jNL/Xpr4LW53aIvzhdDoIiztiwI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlayerStore"]
    ];
});
_c = VideoPlayer;
var _c;
__turbopack_context__.k.register(_c, "VideoPlayer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/player/overlay/PlayerControls.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PlayerControls
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BookHeart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/book-heart.js [app-client] (ecmascript) <export default as BookHeart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-2.js [app-client] (ecmascript) <export default as Volume2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-x.js [app-client] (ecmascript) <export default as VolumeX>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pause.js [app-client] (ecmascript) <export default as Pause>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$picture$2d$in$2d$picture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PictureInPicture$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/picture-in-picture.js [app-client] (ecmascript) <export default as PictureInPicture>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [app-client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize.js [app-client] (ecmascript) <export default as Maximize>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// Local Helper
const formatTimeLocal = (seconds)=>{
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
function PlayerControls({ show, title, subTitle, backUrl, currentTime, duration, isPaused, volume, isMuted, isSaved, downloadUrl, isSeeking, seekValue, type, isTorrent, season, episode, seasons, onTogglePlay, onSeekChange, onSeekCommit, onVolumeChange, onToggleMute, onToggleLibrary, onDownload, onToggleSettings, onTogglePiP, onNext, onPrev, onSeasonChange, onEpisodeChange, onToggleFullscreen, ...props // Capture debug props
 }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const currentSeasonNum = parseInt(season);
    const currentEpisodeNum = parseInt(episode);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const safeTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
    const displayTime = isSeeking ? seekValue : safeTime;
    const handleBack = ()=>{
        if (backUrl) {
            router.push(backUrl);
        } else {
            router.push('/');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `absolute inset-0 z-[60] flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${show ? 'opacity-100' : 'opacity-0'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `pointer-events-auto bg-gradient-to-b from-black via-black/90 to-transparent p-6 pb-20 flex justify-between items-start transition-transform duration-300 ${show ? 'translate-y-0' : '-translate-y-full'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleBack,
                                "aria-label": "Go back",
                                className: "p-2 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                    size: 24,
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                    lineNumber: 94,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 93,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col text-shadow",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white font-bold text-lg",
                                        children: title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 97,
                                        columnNumber: 25
                                    }, this),
                                    subTitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white/60 text-xs font-medium",
                                        children: subTitle
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 98,
                                        columnNumber: 38
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 96,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 92,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            (type === 'torrent' || isTorrent) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-center w-10 h-10 bg-purple-600/30 backdrop-blur-sm rounded-full border border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
                                    size: 20,
                                    className: "text-purple-300 drop-shadow-[0_0_5px_rgba(147,51,234,0.8)]",
                                    fill: "currentColor"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                    lineNumber: 107,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 106,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onToggleLibrary,
                                "aria-label": isSaved ? "Remove from Library" : "Add to Library",
                                className: `p-2.5 rounded-full backdrop-blur-md transition-all ${isSaved ? 'bg-purple-600/80 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`,
                                children: isSaved ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BookHeart$3e$__["BookHeart"], {
                                    size: 20,
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                    lineNumber: 112,
                                    columnNumber: 36
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                                    size: 20,
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                    lineNumber: 112,
                                    columnNumber: 81
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 111,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                disabled: !downloadUrl,
                                onClick: onDownload,
                                "aria-label": "Download video",
                                className: `p-2.5 rounded-full backdrop-blur-md transition-all ${downloadUrl ? 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`,
                                title: downloadUrl ? "Download" : "Waiting for stream...",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                    size: 20,
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                    lineNumber: 122,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 115,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 103,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                lineNumber: 91,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-20 left-6 bg-black/80 p-2 rounded text-[10px] text-green-400 font-mono pointer-events-none z-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            "PROV: ",
                            props.providerType || 'N/A'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 129,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            "AUD: ",
                            props.audioTracks?.length || 0
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 130,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            "SUB: ",
                            props.tracks?.length || 0
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 131,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            "QUAL: ",
                            props.qualities?.length || 0
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 132,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                lineNumber: 128,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `pointer-events-auto bg-gradient-to-t from-black via-black/95 to-transparent pt-40 pb-8 px-6 transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 mb-4 group/progress",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-medium text-white/80 w-10 text-right",
                                children: formatTimeLocal(displayTime)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 140,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "range",
                                min: 0,
                                max: safeDuration || 100,
                                value: Math.min(displayTime, safeDuration || 100),
                                step: 0.1,
                                onChange: onSeekChange,
                                onMouseUp: onSeekCommit,
                                onTouchEnd: onSeekCommit,
                                "aria-label": "Seek slider",
                                className: "flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 141,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-medium text-white/60 w-10",
                                children: formatTimeLocal(safeDuration)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 153,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 139,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onTogglePlay,
                                        "aria-label": isPaused ? "Play" : "Pause",
                                        className: "p-2 hover:bg-white/10 rounded-full text-white transition-colors",
                                        children: isPaused ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                            size: 32,
                                            fill: "currentColor",
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                            lineNumber: 162,
                                            columnNumber: 41
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__["Pause"], {
                                            size: 32,
                                            fill: "currentColor",
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                            lineNumber: 162,
                                            columnNumber: 101
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 161,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 group/vol",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: onToggleMute,
                                                "aria-label": isMuted ? "Unmute" : "Mute",
                                                className: "text-white/80 hover:text-white",
                                                children: volume === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__["VolumeX"], {
                                                    size: 24,
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                    lineNumber: 168,
                                                    columnNumber: 49
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__["Volume2"], {
                                                    size: 24,
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                    lineNumber: 168,
                                                    columnNumber: 92
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                lineNumber: 167,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "range",
                                                    min: 0,
                                                    max: 2.5,
                                                    step: 0.1,
                                                    value: isMuted ? 0 : volume,
                                                    onChange: (e)=>{
                                                        const newVolume = parseFloat(e.target.value);
                                                        onVolumeChange(newVolume);
                                                        if (isMuted && newVolume > 0) {
                                                            onToggleMute();
                                                        }
                                                    },
                                                    className: "w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer ml-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                    lineNumber: 171,
                                                    columnNumber: 33
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                lineNumber: 170,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 166,
                                        columnNumber: 25
                                    }, this),
                                    type === 'tv' && seasons && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 ml-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: onPrev,
                                                "aria-label": "Previous episode",
                                                className: "p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors",
                                                disabled: currentSeasonNum === 1 && currentEpisodeNum === 1,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                                    size: 20,
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                    lineNumber: 193,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                lineNumber: 192,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-0 bg-white/10 rounded-md border border-white/5 overflow-hidden",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        className: "bg-transparent text-white font-bold text-xs outline-none cursor-pointer hover:bg-white/5 px-2 py-1.5 appearance-none text-center min-w-[3rem]",
                                                        value: currentSeasonNum,
                                                        "aria-label": "Select Season",
                                                        onChange: (e)=>onSeasonChange && onSeasonChange(Number(e.target.value)),
                                                        children: seasons.filter((s)=>s.season_number > 0).map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: s.season_number,
                                                                className: "bg-zinc-900 text-left",
                                                                children: [
                                                                    "S",
                                                                    s.season_number
                                                                ]
                                                            }, s.id, true, {
                                                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                                lineNumber: 204,
                                                                columnNumber: 45
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                        lineNumber: 197,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-[1px] h-4 bg-white/10"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                        lineNumber: 207,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        className: "bg-transparent text-white font-bold text-xs outline-none cursor-pointer hover:bg-white/5 px-2 py-1.5 appearance-none text-center min-w-[3rem]",
                                                        value: currentEpisodeNum,
                                                        "aria-label": "Select Episode",
                                                        onChange: (e)=>onEpisodeChange && onEpisodeChange(e.target.value),
                                                        children: (()=>{
                                                            const seasonData = seasons.find((s)=>s.season_number === currentSeasonNum);
                                                            const count = seasonData?.episode_count || 1;
                                                            return Array.from({
                                                                length: count
                                                            }, (_, i)=>i + 1).map((ep)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: ep,
                                                                    className: "bg-zinc-900 text-left",
                                                                    children: [
                                                                        "E",
                                                                        ep
                                                                    ]
                                                                }, ep, true, {
                                                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                                    lineNumber: 218,
                                                                    columnNumber: 49
                                                                }, this));
                                                        })()
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                        lineNumber: 208,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                lineNumber: 196,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: onNext,
                                                "aria-label": "Next episode",
                                                className: "p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                    size: 20,
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                    lineNumber: 225,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                                lineNumber: 224,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 191,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 159,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onToggleSettings,
                                        "aria-label": "Settings",
                                        className: "p-2 rounded-full transition-colors text-white/70 hover:text-white",
                                        title: "Settings (Audio & Subtitles)",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                            size: 20,
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                            lineNumber: 240,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 234,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onTogglePiP,
                                        "aria-label": "Toggle Picture in Picture",
                                        className: "p-2 rounded-full transition-colors text-white/70 hover:text-white",
                                        title: "Picture in Picture",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$picture$2d$in$2d$picture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PictureInPicture$3e$__["PictureInPicture"], {
                                            size: 20,
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                            lineNumber: 250,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 244,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onToggleFullscreen,
                                        "aria-label": "Toggle Fullscreen",
                                        className: "p-2 rounded-full transition-colors text-white/70 hover:text-white",
                                        title: "Fullscreen",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__["Maximize"], {
                                            size: 20,
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                            lineNumber: 260,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                        lineNumber: 254,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                                lineNumber: 232,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                        lineNumber: 157,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
                lineNumber: 136,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/player/overlay/PlayerControls.tsx",
        lineNumber: 88,
        columnNumber: 9
    }, this);
}
_s(PlayerControls, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = PlayerControls;
var _c;
__turbopack_context__.k.register(_c, "PlayerControls");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/player/overlay/SettingsOverlay.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SettingsOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function SettingsOverlay({ show, onClose, tracks = [], audioTracks = [], qualities = [], playbackSpeed = 1, onTrackChange, onAudioTrackChange, onQualityChange, onSpeedChange }) {
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('main');
    if (!show) {
        if (activeTab !== 'main') setTimeout(()=>setActiveTab('main'), 300);
        return null;
    }
    const speeds = [
        0.25,
        0.5,
        0.75,
        1,
        1.25,
        1.5,
        2
    ];
    const renderMain = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-2 min-w-[250px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-white text-lg font-bold mb-2 flex justify-between items-center",
                    children: [
                        "Settings",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-5 h-5 text-zinc-400 hover:text-white"
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                lineNumber: 39,
                                columnNumber: 43
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 39,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                    lineNumber: 37,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setActiveTab('quality'),
                    disabled: qualities.length === 0,
                    className: `flex items-center justify-between p-3 rounded text-sm transition-colors ${qualities.length === 0 ? 'text-white/30 cursor-not-allowed' : 'hover:bg-white/10 text-white'}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Quality"
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 43,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-zinc-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: qualities.length > 0 ? qualities.find((q)=>q.active)?.label || 'Auto' : 'Auto'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 45,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 46,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 44,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                    lineNumber: 42,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setActiveTab('audio'),
                    disabled: audioTracks.length === 0,
                    className: `flex items-center justify-between p-3 rounded text-sm transition-colors ${audioTracks.length === 0 ? 'text-white/30 cursor-not-allowed' : 'hover:bg-white/10 text-white'}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Audio"
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 51,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-zinc-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: audioTracks.length > 0 ? audioTracks.find((t)=>t.active)?.label || 'Default' : 'Default'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 53,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 54,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 52,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                    lineNumber: 50,
                    columnNumber: 13
                }, this),
                tracks.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setActiveTab('subtitle'),
                    className: "flex items-center justify-between p-3 rounded hover:bg-white/10 text-white text-sm transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Subtitles"
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 60,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-zinc-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: tracks.find((t)=>t.active)?.label || 'Off'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 62,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 63,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 61,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                    lineNumber: 59,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setActiveTab('speed'),
                    className: "flex items-center justify-between p-3 rounded hover:bg-white/10 text-white text-sm transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Speed"
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 69,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-zinc-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        playbackSpeed,
                                        "x"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 71,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                    lineNumber: 72,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 70,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                    lineNumber: 68,
                    columnNumber: 13
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
            lineNumber: 36,
            columnNumber: 9
        }, this);
    const renderList = (title, items, onSelect, getLabel, getActive)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-1 min-w-[250px] max-h-[60vh] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-white text-lg font-bold mb-2 flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setActiveTab('main'),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-5 h-5 rotate-45"
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                lineNumber: 81,
                                columnNumber: 62
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                            lineNumber: 81,
                            columnNumber: 17
                        }, this),
                        title
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                    lineNumber: 80,
                    columnNumber: 13
                }, this),
                items.map((item, idx)=>{
                    const isActive = getActive(item, idx);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            onSelect(idx);
                            setActiveTab('main');
                        },
                        className: `flex items-center justify-between p-3 rounded text-sm transition-colors ${isActive ? 'bg-white/20 text-white font-medium' : 'hover:bg-white/10 text-zinc-300'}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: getLabel(item)
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                lineNumber: 92,
                                columnNumber: 25
                            }, this),
                            isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                                lineNumber: 93,
                                columnNumber: 38
                            }, this)
                        ]
                    }, idx, true, {
                        fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
                        lineNumber: 87,
                        columnNumber: 21
                    }, this);
                })
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
            lineNumber: 79,
            columnNumber: 9
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center",
        onClick: (e)=>{
            if (e.target === e.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-zinc-900 border border-white/10 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200",
            children: [
                activeTab === 'main' && renderMain(),
                activeTab === 'quality' && renderList("Quality", qualities, onQualityChange, (q)=>q.label, (q)=>q.active),
                activeTab === 'audio' && renderList("Audio", audioTracks, onAudioTrackChange, (t)=>t.label, (t)=>t.active),
                activeTab === 'subtitle' && renderList("Subtitles", [
                    {
                        label: 'Off',
                        active: !tracks.some((t)=>t.active)
                    },
                    ...tracks
                ], (idx)=>onTrackChange(idx - 1), (t)=>t.label, (t)=>t.active),
                activeTab === 'speed' && renderList("Playback Speed", speeds, (idx)=>onSpeedChange(speeds[idx]), (s)=>s + 'x', (s)=>s === playbackSpeed)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
            lineNumber: 102,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/player/overlay/SettingsOverlay.tsx",
        lineNumber: 101,
        columnNumber: 9
    }, this);
}
_s(SettingsOverlay, "oZOfUKRQTF2YpckF1EMTWWlRMZY=");
_c = SettingsOverlay;
var _c;
__turbopack_context__.k.register(_c, "SettingsOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/player/WebviewPlayer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$overlay$2f$PlayerControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/player/overlay/PlayerControls.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$overlay$2f$SettingsOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/player/overlay/SettingsOverlay.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const WebviewPlayer = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s(({ src, title, initialVolume = 1, subtitleStyle, onEnded, onStateUpdate, type = 'movie', season = '1', episode = '1', seasons = [], onSeasonChange, onEpisodeChange }, ref)=>{
    _s();
    const webviewRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const isReadyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const callbacksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        onStateUpdate,
        onEnded,
        subtitleStyle
    });
    // --- Overlay State ---
    const [showControls, setShowControls] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true); // Always start visible
    const controlsTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    const [showSettings, setShowSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [playerState, setPlayerState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        currentTime: 0,
        duration: 0,
        volume: initialVolume,
        isMuted: false,
        isPaused: false,
        isSeeking: false,
        seekValue: 0,
        tracks: [],
        audioTracks: [],
        qualities: [],
        providerType: 'Native'
    });
    const safeExecute = (script, userGesture = false)=>{
        if (!isReadyRef.current || !webviewRef.current) return;
        try {
            // @ts-ignore
            webviewRef.current.executeJavaScript(script, userGesture).catch((e)=>{
                if (e.message && e.message.includes('GUEST_VIEW_MANAGER_CALL')) return;
                console.warn("[AG] Webview Exec Error:", e.message);
            });
        } catch (e) {}
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, {
        "WebviewPlayer.useImperativeHandle": ()=>({
                seek: ({
                    "WebviewPlayer.useImperativeHandle": (time)=>safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${time})`)
                })["WebviewPlayer.useImperativeHandle"],
                setVolume: ({
                    "WebviewPlayer.useImperativeHandle": (vol)=>safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${vol})`)
                })["WebviewPlayer.useImperativeHandle"],
                togglePlay: ({
                    "WebviewPlayer.useImperativeHandle": ()=>safeExecute(`window.AG_CMD_TOGGLE && window.AG_CMD_TOGGLE()`)
                })["WebviewPlayer.useImperativeHandle"],
                setTrack: ({
                    "WebviewPlayer.useImperativeHandle": (idx)=>safeExecute(`window.AG_CMD_TRACK && window.AG_CMD_TRACK(${idx})`)
                })["WebviewPlayer.useImperativeHandle"],
                setAudioTrack: ({
                    "WebviewPlayer.useImperativeHandle": (idx)=>safeExecute(`window.AG_CMD_AUDIO_TRACK && window.AG_CMD_AUDIO_TRACK(${idx})`)
                })["WebviewPlayer.useImperativeHandle"],
                setQuality: ({
                    "WebviewPlayer.useImperativeHandle": (idx)=>safeExecute(`window.AG_CMD_QUALITY && window.AG_CMD_QUALITY(${idx})`)
                })["WebviewPlayer.useImperativeHandle"],
                setSubtitleStyle: ({
                    "WebviewPlayer.useImperativeHandle": (style)=>safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(style)})`)
                })["WebviewPlayer.useImperativeHandle"],
                setPlaybackSpeed: ({
                    "WebviewPlayer.useImperativeHandle": (speed)=>safeExecute(`window.AG_CMD_SPEED && window.AG_CMD_SPEED(${speed})`)
                })["WebviewPlayer.useImperativeHandle"],
                togglePiP: ({
                    "WebviewPlayer.useImperativeHandle": ()=>safeExecute(`window.AG_CMD_PIP && window.AG_CMD_PIP()`, true)
                })["WebviewPlayer.useImperativeHandle"]
            })
    }["WebviewPlayer.useImperativeHandle"]);
    // --- Overlay Handlers ---
    const handleMouseMove = ()=>{
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (!playerState.isPaused) {
            controlsTimeoutRef.current = setTimeout(()=>setShowControls(false), 5000); // 5s linger
        }
    };
    const handleTogglePlay = ()=>{
        safeExecute(`window.AG_CMD_TOGGLE && window.AG_CMD_TOGGLE()`);
        // Optimistic update
        setPlayerState((prev)=>({
                ...prev,
                isPaused: !prev.isPaused
            }));
    };
    const handleSeekChange = (e)=>{
        const val = parseFloat(e.target.value);
        setPlayerState((prev)=>({
                ...prev,
                isSeeking: true,
                seekValue: val
            }));
    };
    const handleSeekCommit = ()=>{
        safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${playerState.seekValue})`);
        setTimeout(()=>setPlayerState((prev)=>({
                    ...prev,
                    isSeeking: false
                })), 500);
    };
    const handleVolumeChange = (vol)=>{
        safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${vol})`);
        setPlayerState((prev)=>({
                ...prev,
                volume: vol,
                isMuted: vol === 0
            }));
    };
    const handleToggleMute = ()=>{
        const newMuted = !playerState.isMuted;
        const newVol = newMuted ? 0 : playerState.volume || 1;
        safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${newVol})`);
        setPlayerState((prev)=>({
                ...prev,
                isMuted: newMuted,
                volume: newVol
            }));
    };
    const handleToggleFullscreen = ()=>{
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e)=>console.error("Fullscreen error:", e));
        } else {
            document.exitFullscreen().catch((e)=>console.error("Exit Fullscreen error:", e));
        }
    };
    // Keep refs updated
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebviewPlayer.useEffect": ()=>{
            callbacksRef.current = {
                onStateUpdate,
                onEnded,
                subtitleStyle
            };
            if (isReadyRef.current && subtitleStyle) {
                safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
            }
        }
    }["WebviewPlayer.useEffect"], [
        onStateUpdate,
        onEnded,
        subtitleStyle
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebviewPlayer.useEffect": ()=>{
            const webview = webviewRef.current;
            if (!webview) return;
            const onDidFinishLoad = {
                "WebviewPlayer.useEffect.onDidFinishLoad": ()=>{
                    if (isReadyRef.current) return;
                    setIsLoading(false);
                    // Linger controls on startup
                    setShowControls(true);
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                    controlsTimeoutRef.current = setTimeout({
                        "WebviewPlayer.useEffect.onDidFinishLoad": ()=>setShowControls(false)
                    }["WebviewPlayer.useEffect.onDidFinishLoad"], 5000);
                    const script = `
                (function() {
                    const AG_VERSION = 7; 
                    console.log("💉 AG Script Injected & Started (v" + AG_VERSION + ")");
                    const START_VOLUME = ${initialVolume};
                    
                    if (window.AG_VERSION === AG_VERSION) return;
                    window.AG_INSTALLED = true;
                    window.AG_VERSION = AG_VERSION;
                    
                    if (window.AG_INTERVAL_ID) clearInterval(window.AG_INTERVAL_ID);

                    // --- HELPERS ---
                    
                    // DEBUG PROBE
                    setTimeout(() => {
                        console.log("🕵️ STARTING PROBE...");
                        const globals = Object.keys(window).filter(k => 
                            k.includes('player') || k.includes('jw') || k.includes('hls') || k.includes('vid') || k.includes('media')
                        );
                        console.log("🕵️ GLOBALS:", globals);
                        
                        const v = document.querySelector('video');
                        if (v) {
                            console.log("🕵️ VIDEO PROPS:", Object.keys(v).filter(k => !k.startsWith('on') && !k.startsWith('webkit')));
                            console.log("🕵️ VIDEO SRC:", v.src);
                            console.log("🕵️ VIDEO TRACKS:", v.audioTracks ? v.audioTracks.length : 'N/A', v.textTracks ? v.textTracks.length : 'N/A');
                        } else {
                            console.log("🕵️ NO VIDEO ELEMENT FOUND IN MAIN FRAME");
                            // Check frames
                            const frames = document.querySelectorAll('iframe');
                            console.log("🕵️ IFRAMES FOUND:", frames.length);
                            frames.forEach((f, i) => console.log('🕵️ IFRAME ' + i + ':', f.src));
                        }
                    }, 5000);

                    const findVideo = (root, depth = 0) => {
                        if (!root) return null;
                        
                        // Check current root
                        let v = root.querySelector('video');
                        if (v) return { v, context: root.defaultView || window }; // Return video + window context

                        // Check Shadow DOM
                        if (root.createTreeWalker) {
                            const w = root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false);
                            if (w) { 
                                let n; 
                                while(n = w.nextNode()) {
                                    if(n.shadowRoot) { 
                                        const res = findVideo(n.shadowRoot, depth + 1); 
                                        if(res) return res; 
                                    } 
                                } 
                            }
                        }

                        // Check IFrames (Must have access)
                        const fs = root.querySelectorAll('iframe');
                        for(let f of fs) { 
                            try { 
                                let d = f.contentDocument || f.contentWindow?.document; 
                                if(d) { 
                                    const res = findVideo(d, depth + 1); 
                                    if(res) return res; 
                                } 
                            } catch(e){} 
                        }
                        return null;
                    };

                    // --- ENGINE ---
                    window.AG_VIDEO = null;
                    window.AG_CTX = null; // Store the context (window) of the player

                    const checkProviders = (v, ctx) => {
                        const win = ctx || window;
                        
                        // 1. Check for HLS.js attached to specific props
                        if (v._hls) return { type: 'hls', instance: v._hls };
                        
                        // 2. Check for global JWPlayer in context
                        if (win.jwplayer && win.jwplayer().getState) return { type: 'jw', instance: win.jwplayer() };
                        
                        // 3. Global HLS in context
                        if (win.hls && win.hls.audioTracks) return { type: 'hls', instance: win.hls };
                        
                        // 4. VideoJS
                        // @ts-ignore
                        if (v.player && v.player.tech_ && v.player.tech_.hls) return { type: 'hls', instance: v.player.tech_.hls };
                        
                        // 5. Clappr
                        if (win.player && win.player.core && win.player.core.getCurrentPlayback) {
                             const pb = win.player.core.getCurrentPlayback();
                             if (pb._hls) return { type: 'hls', instance: pb._hls };
                        }
                        
                        // 6. Plyr
                        if (win.Plyr && v.plyr) return { type: 'plyr', instance: v.plyr };
                        
                        // 7. ArtPlayer
                        if (win.Artplayer && win.Artplayer.instances.length > 0) return { type: 'art', instance: win.Artplayer.instances[0] };
                        
                        return null;
                    };

                    const updateState = () => {
                        // Find Video if missing
                        if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
                            const found = findVideo(document);
                            if (found) {
                                window.AG_VIDEO = found.v;
                                window.AG_CTX = found.context;
                                
                                const v = window.AG_VIDEO;
                                if (!v.hasAGListeners && v) {
                                    v.hasAGListeners = true;
                                    console.log('🎥 Video Attached');
                                    
                                    // AUTOPLAY & INITIAL VOLUME
                                    v.volume = START_VOLUME;
                                    v.muted = false;
                                    const p = v.play();
                                    if(p) p.catch(() => { v.muted = true; v.play(); });
                                }
                                
                                // Detect Provider once attached
                                const prov = checkProviders(v, window.AG_CTX);
                                if (prov) {
                                    console.log('🔌 Provider Found:', prov.type);
                                    if (prov.type === 'hls') window.AG_HLS = prov.instance;
                                    if (prov.type === 'jw') window.AG_JW = prov.instance;
                                }
                            }
                        }
                        
                        // Retry finding video periodically
                        if (window.AG_VIDEO && !window.AG_VIDEO.isConnected) {
                            window.AG_VIDEO = null;
                            window.AG_CTX = null;
                        }
                        
                        const v = window.AG_VIDEO;
                        if (!v) return;

                        const s = {
                            currentTime: v.currentTime,
                            duration: v.duration,
                            volume: v.muted ? 0 : v.volume,
                            isPaused: v.paused,
                            tracks: [], audioTracks: [], qualities: [],
                            providerType: window.AG_HLS ? 'HLS' : (window.AG_JW ? 'JW' : (v._hls ? 'HLS_Attached' : 'Native'))
                        };
                        
                        // --- TRACKS MAPPING ---
                        
                        // 1. Subtitles (Standard + JW)
                        if (window.AG_JW) {
                             // JWPlayer Captions
                             const caps = window.AG_JW.getCaptionsList ? window.AG_JW.getCaptionsList() : [];
                             const currCap = window.AG_JW.getCurrentCaptions ? window.AG_JW.getCurrentCaptions() : -1;
                             s.tracks = caps.map((t, idx) => ({
                                 label: t.label || t.language || 'Sub ' + idx,
                                 language: t.language, // JW uses 'id' sometimes
                                 active: idx === currCap
                             }));
                        } else if (v.textTracks) {
                            // Standard HTML5
                            for(let i=0; i<v.textTracks.length; i++) {
                                const t = v.textTracks[i];
                                // Filter out metadata tracks if possible, mainly keep subtitles/captions
                                if (t.kind === 'subtitles' || t.kind === 'captions' || !t.kind) {
                                     s.tracks.push({ 
                                        label: t.label || t.language || 'Track ' + (i+1), 
                                        language: t.language, 
                                        active: t.mode === 'showing' 
                                    });
                                }
                            }
                        }

                        // 2. Audio Tracks
                        if (window.AG_JW) {
                            const audios = window.AG_JW.getAudioTracks ? window.AG_JW.getAudioTracks() : (window.AG_JW.getAudioTracks || []); 
                            if (typeof window.AG_JW.getAudioTracks === 'function') {
                                const list = window.AG_JW.getAudioTracks();
                                const curr = window.AG_JW.getCurrentAudioTrack();
                                s.audioTracks = list.map((t, idx) => ({
                                    label: t.label || t.language || t.name || 'Audio ' + idx,
                                    language: t.language || 'unk',
                                    active: idx === curr
                                }));
                            }
                        } else if (window.AG_HLS && window.AG_HLS.audioTracks) {
                             s.audioTracks = window.AG_HLS.audioTracks.map((t, idx) => ({
                                 label: t.name || t.lang || t.language || 'Audio ' + idx,
                                 language: t.lang || t.language || 'unk',
                                 active: idx === window.AG_HLS.audioTrack
                             }));
                        } else if (v.audioTracks) {
                            for(let i=0; i<v.audioTracks.length; i++) {
                                const t = v.audioTracks[i];
                                s.audioTracks.push({
                                    label: t.label || t.language || 'Audio ' + (i+1),
                                    language: t.language,
                                    active: t.enabled
                                });
                            }
                        }

                        // 3. Quality Levels
                        if (window.AG_JW && window.AG_JW.getQualityLevels) {
                            const q = window.AG_JW.getQualityLevels();
                            const curr = window.AG_JW.getCurrentQuality();
                            s.qualities = q.map((t, idx) => ({
                                label: t.label || t.height + 'p',
                                height: t.height || 0,
                                active: idx === curr
                            }));
                        } else if (window.AG_HLS && window.AG_HLS.levels) {
                             s.qualities = window.AG_HLS.levels.map((t, idx) => ({
                                 label: (t.height || 'Auto') + 'p',
                                 height: t.height,
                                 active: idx === window.AG_HLS.currentLevel 
                             }));
                             s.qualities.unshift({ label: 'Auto', height: 0, active: window.AG_HLS.autoLevelEnabled });
                        }

                        console.log('ANTIGRAVITY_UPDATE:' + JSON.stringify(s));
                    };

                    window.AG_INTERVAL_ID = setInterval(updateState, 1000);

                    // --- COMMANDS ---
                    window.AG_CMD_SEEK = (t) => { if(window.AG_VIDEO) window.AG_VIDEO.currentTime = t; };
                    
                    window.AG_CMD_VOL = (v) => { 
                        if(window.AG_VIDEO) {
                            // Standard Volume
                            if (v <= 1) {
                                window.AG_VIDEO.volume = v;
                                if (window.AG_GAIN) window.AG_GAIN.gain.value = 1; // Reset boost
                            } 
                            // Boost Mode (Web Audio API)
                            else {
                                window.AG_VIDEO.volume = 1; // Max out native
                                
                                try {
                                    if (!window.AG_AUDIO_CTX) {
                                        const win = window.AG_CTX || window; // Use the video's window context
                                        const AudioContext = win.AudioContext || win.webkitAudioContext;
                                        window.AG_AUDIO_CTX = new AudioContext();
                                        window.AG_src = window.AG_AUDIO_CTX.createMediaElementSource(window.AG_VIDEO);
                                        window.AG_GAIN = window.AG_AUDIO_CTX.createGain();
                                        window.AG_src.connect(window.AG_GAIN);
                                        window.AG_GAIN.connect(window.AG_AUDIO_CTX.destination);
                                        console.log('🔊 Audio Boost Initialized in context:', win === window ? 'Top' : 'Iframe');
                                    }
                                    if (window.AG_GAIN && window.AG_AUDIO_CTX) {
                                        // Resume context if suspended (browser autoplay policy)
                                        if (window.AG_AUDIO_CTX.state === 'suspended') {
                                            window.AG_AUDIO_CTX.resume();
                                        }
                                        window.AG_GAIN.gain.value = v; // Apply boost (e.g., 2.5)
                                        console.log('🚀 Boost:', v);
                                    }
                                } catch(e) {
                                    console.error('Audio Boost Error:', e);
                                }
                            }
                            
                            window.AG_VIDEO.muted = v === 0; 
                        } 
                    };
                    
                    window.AG_CMD_TOGGLE = () => { if(window.AG_VIDEO) { if(window.AG_VIDEO.paused) window.AG_VIDEO.play(); else window.AG_VIDEO.pause(); } };
                    
                    // NEW: Track Commands
                    window.AG_CMD_TRACK = (idx) => {
                        console.log('📝 CMD_TRACK:', idx);
                        // Subtitles
                        if (window.AG_JW) {
                            window.AG_JW.setCurrentCaptions(idx);
                        } else {
                            // Native / HLS
                            // 1. Try HLS specific controller if attached
                            if (window.AG_VIDEO && window.AG_VIDEO._hls) {
                                console.log('📝 Setting HLS subtitleTrack:', idx);
                                window.AG_VIDEO._hls.subtitleTrack = idx;
                            }
                            
                            // 2. Fallback to Native TextTracks (Aggressive)
                            if (window.AG_VIDEO && window.AG_VIDEO.textTracks) {
                                for(let i=0; i<window.AG_VIDEO.textTracks.length; i++) {
                                    // Disable all first
                                    window.AG_VIDEO.textTracks[i].mode = 'disabled';
                                }
                                if (idx >= 0 && window.AG_VIDEO.textTracks[idx]) {
                                    console.log('📝 Enabling Native Track:', idx);
                                    window.AG_VIDEO.textTracks[idx].mode = 'showing';
                                } else {
                                    console.log('📝 All Native Tracks Disabled');
                                }
                            }
                        }
                    };

                    window.AG_CMD_AUDIO_TRACK = (idx) => {
                         // Audio
                         if (window.AG_JW) {
                             window.AG_JW.setCurrentAudioTrack(idx);
                         } else if (window.AG_HLS) {
                             window.AG_HLS.audioTrack = idx;
                         } else if (window.AG_VIDEO && window.AG_VIDEO.audioTracks) {
                             for(let i=0; i<window.AG_VIDEO.audioTracks.length; i++) {
                                 window.AG_VIDEO.audioTracks[i].enabled = (i === idx);
                             }
                         }
                    };

                    window.AG_CMD_QUALITY = (idx) => {
                         // Quality
                         if (window.AG_JW) {
                             window.AG_JW.setCurrentQuality(idx);
                         } else if (window.AG_HLS) {
                             // index -1 usually means Auto in UI list if shifted, but HLS uses -1 for auto
                             // If our UI list has Auto at 0, we need to map.
                             // Assuming UI passes literal index from the qualities array constructed above.
                             // If auto is present, it's usually the first item or handled specially.
                             // Let's assume idx maps to the levels array index directly, unless it's auto.
                             
                             // If we constructed: [Auto, 360p, 720p...]
                             // Then idx 0 = Auto.
                             if (idx === 0 && window.AG_HLS.autoLevelEnabled !== undefined) {
                                 window.AG_HLS.currentLevel = -1; // Auto
                             } else {
                                 // Offset by 1 if Auto is in list
                                 window.AG_HLS.currentLevel = idx - 1; 
                             }
                         }
                    };

                    window.AG_CMD_PIP = () => { if(window.AG_VIDEO) { if (document.pictureInPictureElement) document.exitPictureInPicture(); else window.AG_VIDEO.requestPictureInPicture(); } };
                    
                    // --- BLOCKING ---
                    window.open = function() { return null; };
                    window.onbeforeunload = null; 
                    
                    const blockCss = \`
                        .ad, .ads, .popup, [class*="ad-"], [id*="ad-"], iframe[src*="ads"] { display: none !important; }
                        video::-webkit-media-controls { display: none !important; }
                    \`;
                    const styleEl = document.createElement('style');
                    styleEl.textContent = blockCss;
                    document.head.appendChild(styleEl);

                    // Kill popups
                    setInterval(() => {
                        const selectors = ['[class*="popup"]', '[id*="popup"]', 'iframe[src*="ads"]'];
                        selectors.forEach(sel => {
                            try {
                                document.querySelectorAll(sel).forEach(el => {
                                    if (el && el.parentNode && el.tagName !== 'VIDEO') {
                                        try { el.remove(); } catch(e){}
                                    }
                                });
                            } catch(e){}
                        });
                    }, 500);
                })();
            `;
                    webview.executeJavaScript(script);
                    isReadyRef.current = true;
                    if (subtitleStyle) safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
                }
            }["WebviewPlayer.useEffect.onDidFinishLoad"];
            const onConsole = {
                "WebviewPlayer.useEffect.onConsole": (e)=>{
                    const msg = e.message;
                    // Forward all logs for debugging "Shazam" issue
                    console.log('[WebView]:', msg);
                    if (msg.startsWith('ANTIGRAVITY_UPDATE:')) {
                        try {
                            const data = JSON.parse(msg.substring(19));
                            if (!data) return;
                            setPlayerState({
                                "WebviewPlayer.useEffect.onConsole": (prev)=>({
                                        ...prev,
                                        currentTime: data.currentTime || 0,
                                        duration: data.duration || 0,
                                        isPaused: data.isPaused,
                                        volume: data.volume,
                                        isMuted: data.volume === 0,
                                        tracks: data.tracks || [],
                                        audioTracks: data.audioTracks || [],
                                        qualities: data.qualities || []
                                    })
                            }["WebviewPlayer.useEffect.onConsole"]);
                            callbacksRef.current.onStateUpdate?.(data);
                        } catch (e) {}
                    } else if (msg === 'ANTIGRAVITY_ENDED') {
                        callbacksRef.current.onEnded?.();
                    }
                }
            }["WebviewPlayer.useEffect.onConsole"];
            const onDomReady = {
                "WebviewPlayer.useEffect.onDomReady": ()=>onDidFinishLoad()
            }["WebviewPlayer.useEffect.onDomReady"];
            const onDidFinishLoadEvent = {
                "WebviewPlayer.useEffect.onDidFinishLoadEvent": ()=>onDidFinishLoad()
            }["WebviewPlayer.useEffect.onDidFinishLoadEvent"];
            webview.addEventListener('did-finish-load', onDidFinishLoadEvent);
            webview.addEventListener('dom-ready', onDomReady);
            webview.addEventListener('console-message', onConsole);
            // Prevent main process new-window (Fix for crash)
            // @ts-ignore
            webview.addEventListener('new-window', {
                "WebviewPlayer.useEffect": (e)=>{
                    console.log('[Webview] Blocked popup:', e.url);
                    e.preventDefault();
                }
            }["WebviewPlayer.useEffect"]);
            return ({
                "WebviewPlayer.useEffect": ()=>{
                    isReadyRef.current = false;
                    webview.removeEventListener('did-finish-load', onDidFinishLoadEvent);
                    webview.removeEventListener('dom-ready', onDomReady);
                    webview.removeEventListener('console-message', onConsole);
                }
            })["WebviewPlayer.useEffect"];
        }
    }["WebviewPlayer.useEffect"], [
        src,
        initialVolume
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full h-full bg-black flex items-center justify-center overflow-hidden group",
        onMouseMove: handleMouseMove,
        onMouseLeave: ()=>setShowControls(false),
        children: [
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "w-10 h-10 text-white animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                    lineNumber: 602,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 601,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("webview", {
                ref: webviewRef,
                src: src,
                className: "w-full h-full border-0 transition-opacity duration-500 ease-in-out",
                style: {
                    width: '100vw',
                    height: '100vh',
                    background: '#000',
                    opacity: isLoading ? 0 : 1
                },
                // @ts-ignore
                allowpopups: "false",
                // @ts-ignore
                disablewebsecurity: "true",
                webpreferences: "contextIsolation=no, nodeIntegration=no, webSecurity=no, autoplayPolicy=no-user-gesture-required",
                useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 606,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-10",
                onClick: handleTogglePlay,
                onDoubleClick: handleToggleFullscreen
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 625,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$overlay$2f$PlayerControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                show: showControls || playerState.isPaused || isLoading,
                // @ts-ignore
                providerType: playerState.providerType,
                tracks: playerState.tracks,
                audioTracks: playerState.audioTracks,
                qualities: playerState.qualities,
                title: title || "",
                currentTime: playerState.currentTime,
                duration: playerState.duration,
                isPaused: playerState.isPaused,
                volume: playerState.volume,
                isMuted: playerState.isMuted,
                isSaved: false,
                downloadUrl: null,
                isSeeking: playerState.isSeeking,
                seekValue: playerState.seekValue,
                type: type,
                season: season,
                episode: episode,
                seasons: seasons,
                onSeasonChange: onSeasonChange,
                onEpisodeChange: onEpisodeChange,
                onTogglePlay: handleTogglePlay,
                onSeekChange: handleSeekChange,
                onSeekCommit: handleSeekCommit,
                onVolumeChange: handleVolumeChange,
                onToggleMute: handleToggleMute,
                onToggleLibrary: ()=>{},
                onDownload: ()=>{},
                onToggleSettings: ()=>setShowSettings(!showSettings),
                onTogglePiP: ()=>safeExecute(`window.AG_CMD_PIP && window.AG_CMD_PIP()`, true),
                onToggleFullscreen: handleToggleFullscreen
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 631,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$overlay$2f$SettingsOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                show: showSettings,
                onClose: ()=>setShowSettings(false),
                tracks: playerState.tracks,
                audioTracks: playerState.audioTracks,
                qualities: playerState.qualities,
                playbackSpeed: 1,
                onTrackChange: (idx)=>safeExecute(`window.AG_CMD_TRACK && window.AG_CMD_TRACK(${idx})`),
                onAudioTrackChange: (idx)=>safeExecute(`window.AG_CMD_AUDIO_TRACK && window.AG_CMD_AUDIO_TRACK(${idx})`),
                onQualityChange: (idx)=>safeExecute(`window.AG_CMD_QUALITY && window.AG_CMD_QUALITY(${idx})`),
                onSpeedChange: (speed)=>safeExecute(`window.AG_CMD_SPEED && window.AG_CMD_SPEED(${speed})`)
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 666,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/player/WebviewPlayer.tsx",
        lineNumber: 595,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "pbsvcLhrQdOyRJ73m8a+EAa/0MY=")), "pbsvcLhrQdOyRJ73m8a+EAa/0MY=");
_c1 = WebviewPlayer;
WebviewPlayer.displayName = "WebviewPlayer";
const __TURBOPACK__default__export__ = WebviewPlayer;
var _c, _c1;
__turbopack_context__.k.register(_c, "WebviewPlayer$forwardRef");
__turbopack_context__.k.register(_c1, "WebviewPlayer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatDate",
    ()=>formatDate,
    "formatDuration",
    ()=>formatDuration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/UI/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/dom/motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, variant = "primary", size = "md", state = "default", children, disabled, ...props }, ref)=>{
    const variants = {
        primary: "bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-xl",
        secondary: "bg-zinc-800 text-white border border-white/10 hover:bg-zinc-700 hover:border-white/20",
        ghost: "bg-transparent text-zinc-300 hover:text-white hover:bg-white/5",
        danger: "bg-red-600 text-white hover:bg-red-500 shadow-red-900/20"
    };
    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-3 text-sm font-semibold",
        lg: "px-8 py-4 text-base font-bold"
    };
    const widthMap = {
        default: "auto",
        loading: "auto",
        success: "auto",
        error: "auto"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative rounded-full inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden", variants[variant], sizes[size], className),
        disabled: state === 'loading' || disabled,
        whileHover: state === 'default' && !disabled ? {
            scale: 1.02,
            y: -1
        } : {},
        whileTap: state === 'default' && !disabled ? {
            scale: 0.98
        } : {},
        layout: true,
        ...props,
        children: [
            state === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    width: 0
                },
                animate: {
                    opacity: 1,
                    width: "auto"
                },
                exit: {
                    opacity: 0,
                    width: 0
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "mr-2 h-4 w-4 animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/components/UI/button.tsx",
                    lineNumber: 66,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/UI/button.tsx",
                lineNumber: 61,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            children,
            state === 'success' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    scale: 0
                },
                animate: {
                    scale: 1
                },
                className: "ml-2 text-green-500",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                    size: 18
                }, void 0, false, {
                    fileName: "[project]/src/components/UI/button.tsx",
                    lineNumber: 78,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/UI/button.tsx",
                lineNumber: 73,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/UI/button.tsx",
        lineNumber: 46,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = "Button";
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/watch/[id]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WatchPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/alert-circle.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api/content.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$sourceProvider$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/sourceProvider.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store/playerStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$historyStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store/historyStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$VideoPlayer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/player/VideoPlayer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$WebviewPlayer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/player/WebviewPlayer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UI$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/UI/button.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
function WatchPage({ params }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const type = searchParams.get("type") || 'movie';
    // Unwrap params (Next.js 15+)
    const { id } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["use"](params);
    const [content, setContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [sourceUrl, setSourceUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isEmbed, setIsEmbed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentSeason, setCurrentSeason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(Number(searchParams.get("season")) || 1);
    const [currentEpisode, setCurrentEpisode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(Number(searchParams.get("episode")) || 1);
    const { setDuration, setCurrentTime, setPlaying } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlayerStore"])();
    const addToHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$historyStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useHistoryStore"])({
        "WatchPage.useHistoryStore[addToHistory]": (state)=>state.addToHistory
    }["WatchPage.useHistoryStore[addToHistory]"]);
    const isSaved = false; // Todo: Implement library store
    // Save to history when content loads
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WatchPage.useEffect": ()=>{
            if (content) {
                addToHistory(content);
            }
        }
    }["WatchPage.useEffect"], [
        content,
        addToHistory
    ]);
    // 1. Fetch Content Details
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WatchPage.useEffect": ()=>{
            let mounted = true;
            async function fetchDetails() {
                try {
                    const details = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["contentApi"].getDetails(id, type);
                    if (!mounted) return;
                    if (!details) {
                        setError("Content not found");
                        return;
                    }
                    setContent(details);
                } catch (err) {
                    if (mounted) setError("Failed to load content details");
                }
            }
            fetchDetails();
            return ({
                "WatchPage.useEffect": ()=>{
                    mounted = false;
                }
            })["WatchPage.useEffect"];
        }
    }["WatchPage.useEffect"], [
        id,
        type
    ]);
    // 2. Fetch Sources when content or episode changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WatchPage.useEffect": ()=>{
            if (!content) return;
            let mounted = true;
            async function fetchSources() {
                setLoading(true);
                setError(null);
                try {
                    const sourceType = type === 'movie' ? 'movie' : type === 'tv' ? 'series' : 'anime';
                    const sourcesMap = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$sourceProvider$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getAllSources({
                        id: content.id,
                        title: content.title,
                        type: sourceType
                    }, currentSeason, currentEpisode);
                    if (!mounted) return;
                    let bestSourceObj = null;
                    const vidlink = sourcesMap.get('vidlink');
                    const torrent = sourcesMap.get('torrent');
                    if (vidlink && vidlink.length > 0) {
                        bestSourceObj = vidlink[0];
                    } else if (torrent && torrent.length > 0) {
                        bestSourceObj = torrent[0];
                    } else {
                        setError("No playable sources found for this episode");
                    }
                    if (bestSourceObj) {
                        setSourceUrl(bestSourceObj.url);
                        setIsEmbed(bestSourceObj.type === 'embed');
                    } else {
                        setSourceUrl(null);
                    }
                } catch (err) {
                    if (mounted) setError(err.message || "Failed to load sources");
                } finally{
                    if (mounted) setLoading(false);
                }
            }
            fetchSources();
            return ({
                "WatchPage.useEffect": ()=>{
                    mounted = false;
                }
            })["WatchPage.useEffect"];
        }
    }["WatchPage.useEffect"], [
        content,
        currentSeason,
        currentEpisode,
        type
    ]);
    const handleSeasonChange = (s)=>{
        setCurrentSeason(s);
        setCurrentEpisode(1); // Reset to ep 1
    };
    const handleEpisodeChange = (e)=>{
        setCurrentEpisode(parseInt(e));
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-screen w-full items-center justify-center bg-black",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "h-10 w-10 animate-spin text-red-600"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 122,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-zinc-400 font-medium animate-pulse",
                        children: "Locating stream..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 123,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 121,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/watch/[id]/page.tsx",
            lineNumber: 120,
            columnNumber: 13
        }, this);
    }
    if (error || !content) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-screen w-full items-center justify-center bg-black",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center space-y-4 max-w-md px-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "h-12 w-12 text-red-500 mx-auto"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 133,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-white",
                        children: "Playback Error"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 134,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-zinc-400",
                        children: error || "Unknown error occurred"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 135,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UI$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        onClick: ()=>router.back(),
                        variant: "secondary",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                className: "mr-2 h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 137,
                                columnNumber: 25
                            }, this),
                            "Go Back"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 136,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 132,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/watch/[id]/page.tsx",
            lineNumber: 131,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-screen w-full bg-black overflow-hidden flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute top-0 left-0 w-full z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none transition-opacity duration-300 ${isEmbed ? 'hover:opacity-100 opacity-0' : 'opacity-100'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UI$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        className: "pointer-events-auto hover:bg-white/10 text-white",
                        onClick: ()=>router.back(),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                className: "mr-2 h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 154,
                                columnNumber: 21
                            }, this),
                            "Back"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 149,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-right",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-lg font-bold text-white drop-shadow-md",
                                children: content.title
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 159,
                                columnNumber: 21
                            }, this),
                            type === 'tv' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-zinc-300",
                                children: [
                                    "Season ",
                                    currentSeason,
                                    " • Episode ",
                                    currentEpisode
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 160,
                                columnNumber: 39
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 158,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 148,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center bg-black",
                children: sourceUrl ? isEmbed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$WebviewPlayer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    src: sourceUrl,
                    title: content.title,
                    isSaved: isSaved,
                    type: type,
                    season: currentSeason.toString(),
                    episode: currentEpisode.toString(),
                    seasons: content.seasonsList,
                    onSeasonChange: handleSeasonChange,
                    onEpisodeChange: handleEpisodeChange,
                    onStateUpdate: (state)=>{
                        console.log("[WatchPage] Webview State Update:", state);
                    }
                }, void 0, false, {
                    fileName: "[project]/src/app/watch/[id]/page.tsx",
                    lineNumber: 168,
                    columnNumber: 25
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full h-full max-w-[1920px]",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$VideoPlayer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VideoPlayer"], {
                        src: sourceUrl,
                        poster: content.backdrop || content.poster,
                        title: content.title,
                        onEnded: ()=>{
                            console.log("Video ended");
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 184,
                        columnNumber: 29
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/watch/[id]/page.tsx",
                    lineNumber: 183,
                    columnNumber: 25
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-zinc-500",
                    children: "Source URL missing"
                }, void 0, false, {
                    fileName: "[project]/src/app/watch/[id]/page.tsx",
                    lineNumber: 193,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 165,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/watch/[id]/page.tsx",
        lineNumber: 146,
        columnNumber: 9
    }, this);
}
_s(WatchPage, "9dA7ah17tgWe8y9NezMtVPp6O9E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlayerStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$historyStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useHistoryStore"]
    ];
});
_c = WatchPage;
var _c;
__turbopack_context__.k.register(_c, "WatchPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_b6066ff3._.js.map