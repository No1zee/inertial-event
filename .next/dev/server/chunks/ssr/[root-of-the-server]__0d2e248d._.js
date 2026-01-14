module.exports = [
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[project]/src/lib/api/content.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contentApi",
    ()=>contentApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-ssr] (ecmascript)");
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:5000/api") || "http://localhost:5000/api";
const contentApi = {
    getTrending: async ()=>{
        try {
            // Randomize page 1-3 to ensure freshness on reload
            const randomPage = Math.floor(Math.random() * 3) + 1;
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/trending/all/day?language=en-US&page=${randomPage}`);
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
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/tv/popular?language=en-US&page=${randomPage}`);
            const data = res.data.results || [];
            return data.map(transformToContent).sort(()=>Math.random() - 0.5);
        } catch (error) {
            console.error("Failed to fetch popular TV:", error);
            return [];
        }
    },
    getByGenre: async (genreId, type = 'movie', page)=>{
        try {
            const randomPage = page || Math.floor(Math.random() * 5) + 1;
            const endpoint = type === 'movie' ? '/tmdb-api/discover/movie' : '/tmdb-api/discover/tv';
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?with_genres=${genreId}&language=en-US&page=${randomPage}&sort_by=popularity.desc`);
            const data = res.data.results || [];
            return data.map(transformToContent); // Preserving order for relevance unless specifically shuffled elsewhere
        } catch (error) {
            console.error(`Failed to fetch genre ${genreId}:`, error);
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
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(`${endpoint}?${queryParams.toString()}`);
            return (res.data.results || []).map(transformToContent);
        } catch (error) {
            console.error("Failed to discover content:", error);
            return [];
        }
    },
    getTrailer: async (id, type = 'movie')=>{
        try {
            const cleanId = id.replace('tmdb_', '');
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(`/tmdb-api/${type}/${cleanId}/videos?language=en-US`);
            const videos = res.data.results || [];
            const trailer = videos.find((v)=>v.type === "Trailer" && v.site === "YouTube") || videos[0];
            return trailer ? trailer.key : null;
        } catch (error) {
            return null;
        }
    },
    getDetails: async (id, type = 'movie')=>{
        try {
            // Strip 'tmdb_' prefix if present
            const cleanId = id.replace('tmdb_', '');
            const endpoint = `/tmdb-api/${type}/${cleanId}?language=en-US`;
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(endpoint);
            return transformToContent({
                ...res.data,
                type
            });
        } catch (error) {
            console.error(`Failed to fetch ${type} details for ${id}:`, error);
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
        id: item._id || item.id || `tmdb_${item.tmdbId}`,
        title: item.title || item.name || "Unknown Title",
        description: item.description || item.overview || "",
        poster: getProxyUrl(item.poster_path, item.posterUrl, 'w500', "/images/placeholder.png"),
        backdrop: getProxyUrl(item.backdrop_path, item.backdropUrl, 'original', "/images/hero_placeholder.jpg"),
        rating: item.rating || item.vote_average || 0,
        releaseDate: item.year || item.release_date || item.first_air_date || "2024",
        type: item.type || item.media_type || "movie",
        genres: item.genres || [],
        status: 'ongoing',
        isAdult: false
    };
};
}),
"[project]/src/services/sourceProvider.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
    async getAllSources(content) {
        const cacheKey = `${content.type}:${content.id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const sources = new Map();
        // Single call to backend which handles aggregator logic (Vidlink + Torrent + etc)
        const allSources = await this.getSources(content.id, content.type, content.title);
        if (allSources.length > 0) {
            // Group by type for the UI
            const vidlink = allSources.filter((s)=>s.type === 'hls' || s.type === 'embed');
            const torrent = allSources.filter((s)=>s.type === 'torrent' || s.type === 'mp4');
            if (vidlink.length > 0) sources.set('vidlink', vidlink);
            if (torrent.length > 0) sources.set('torrent', torrent);
        }
        this.cache.set(cacheKey, sources);
        return sources;
    }
    clearCache() {
        this.cache.clear();
    }
}
const sourceProvider = new SourceProvider();
const __TURBOPACK__default__export__ = sourceProvider;
}),
"[project]/src/lib/store/playerStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePlayerStore",
    ()=>usePlayerStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const usePlayerStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
}),
"[project]/src/components/player/VideoPlayer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VideoPlayer",
    ()=>VideoPlayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@vidstack/react/dev/vidstack.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$chunks$2f$vidstack$2d$BIA_pmri$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@vidstack/react/dev/chunks/vidstack-BIA_pmri.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$player$2f$vidstack$2d$default$2d$icons$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@vidstack/react/dev/player/vidstack-default-icons.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store/playerStore.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
function VideoPlayer({ src, poster, title, subtitles, onEnded }) {
    const player = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { setPlaying, setDuration, setCurrentTime, setVolume, setMuted, setFullscreen } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2f$playerStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePlayerStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Sync state with store
        const instance = player.current;
        if (!instance) return;
        return instance.subscribe((state)=>{
            setPlaying(state.playing);
            setDuration(state.duration);
            setCurrentTime(state.currentTime);
            setVolume(state.volume);
            setMuted(state.muted);
            setFullscreen(state.fullscreen);
            if (state.ended) onEnded?.();
        });
    }, [
        src,
        onEnded,
        setPlaying,
        setDuration,
        setCurrentTime,
        setVolume,
        setMuted,
        setFullscreen
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MediaPlayer"], {
            ref: player,
            title: title,
            src: src,
            className: "w-full h-full",
            aspectRatio: "16/9",
            load: "eager",
            poster: poster,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MediaProvider"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Poster"], {
                            className: "vds-poster"
                        }, void 0, false, {
                            fileName: "[project]/src/components/player/VideoPlayer.tsx",
                            lineNumber: 59,
                            columnNumber: 21
                        }, this),
                        subtitles?.map((track, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$vidstack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Track"], {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$chunks$2f$vidstack$2d$BIA_pmri$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultVideoLayout"], {
                    icons: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$vidstack$2f$react$2f$dev$2f$player$2f$vidstack$2d$default$2d$icons$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultLayoutIcons"]
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
}),
"[project]/src/components/player/WebviewPlayer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-ssr] (ecmascript) <export default as Loader2>");
"use client";
;
;
;
const WebviewPlayer = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ src, title, initialVolume = 1, subtitleStyle, onEnded, onStateUpdate }, ref)=>{
    const webviewRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const isReadyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const callbacksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({
        onStateUpdate,
        onEnded,
        subtitleStyle
    });
    const safeExecute = (script, userGesture = false)=>{
        if (!isReadyRef.current || !webviewRef.current) return;
        try {
            // @ts-ignore
            webviewRef.current.executeJavaScript(script, userGesture).catch((e)=>{
                // Ignore specific lifecycle errors
                if (e.message && e.message.includes('GUEST_VIEW_MANAGER_CALL')) return;
                console.warn("[AG] Webview Exec Error:", e.message);
            });
        } catch (e) {}
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, ()=>({
            seek: (time)=>safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${time})`),
            setVolume: (vol)=>safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${vol})`),
            togglePlay: ()=>safeExecute(`window.AG_CMD_TOGGLE && window.AG_CMD_TOGGLE()`),
            setTrack: (idx)=>safeExecute(`window.AG_CMD_TRACK && window.AG_CMD_TRACK(${idx})`),
            setAudioTrack: (idx)=>safeExecute(`window.AG_CMD_AUDIO_TRACK && window.AG_CMD_AUDIO_TRACK(${idx})`),
            setQuality: (idx)=>safeExecute(`window.AG_CMD_QUALITY && window.AG_CMD_QUALITY(${idx})`),
            setSubtitleStyle: (style)=>safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(style)})`),
            setPlaybackSpeed: (speed)=>safeExecute(`window.AG_CMD_SPEED && window.AG_CMD_SPEED(${speed})`),
            togglePiP: ()=>safeExecute(`window.AG_CMD_PIP && window.AG_CMD_PIP()`, true)
        }));
    // Keep refs updated with latest props
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        callbacksRef.current = {
            onStateUpdate,
            onEnded,
            subtitleStyle
        };
    }, [
        onStateUpdate,
        onEnded,
        subtitleStyle
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isReadyRef.current && subtitleStyle) {
            safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        }
    }, [
        subtitleStyle
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const webview = webviewRef.current;
        if (!webview) return;
        const onDidFinishLoad = ()=>{
            if (isReadyRef.current) return;
            setIsLoading(false);
            const script = `
                (function() {
                    const AG_VERSION = 5; // Bump this to force update
                    console.log("💉 AG Script Injected & Started (v" + AG_VERSION + ")");
                    const START_VOLUME = ${initialVolume};
                    
                    if (window.AG_VERSION === AG_VERSION) {
                         console.log("⚠️ AG Script v" + AG_VERSION + " already installed, skipping");
                         return;
                    }
                    window.AG_INSTALLED = true;
                    window.AG_VERSION = AG_VERSION;
                    
                    if (window.AG_INTERVAL_ID) clearInterval(window.AG_INTERVAL_ID);

                    // --- HELPERS ---
                    const getFiber = (n) => {
                        if (!n) return null;
                        const k = Object.keys(n).find(k => k.startsWith('__reactFiber$'));
                        return k ? n[k] : null;
                    };

                    const scanFiber = (f) => {
                        if(!f) return null;
                        let c = f;
                        let d = 0;
                        while(c && d < 25) {
                            const p = c.memoizedProps || c.pendingProps;
                            if (p && (p.sources || p.tracks || p.qualityLevels || p.audioTracks || p.playlist || (p.config && (p.config.sources || p.config.tracks)))) return p.config || p;
                            c = c.return; d++;
                        }
                        return null;
                    };

                    const findVideo = (root, depth = 0) => {
                        if (!root) return null;
                        let v = root.querySelector('video');
                        if (v) { console.log("🎥 Video Found at depth " + depth); return v; }
                        
                        // TreeWalker (Shadow DOM)
                        const w = root.createTreeWalker ? root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false) : null;
                        if (w) {
                            let n; while(n = w.nextNode()) if(n.shadowRoot) { v = findVideo(n.shadowRoot, depth + 1); if(v) return v; }
                        }
                        
                        // IFrames
                        const fs = root.querySelectorAll('iframe');
                        if (fs.length > 0 && depth < 2) console.log('🔍 Scanning ' + fs.length + ' iframes at depth ' + depth);
                        for(let f of fs) { 
                            try { 
                                let d = f.contentDocument || f.contentWindow?.document; 
                                if(d) { v = findVideo(d, depth + 1); if(v) return v; }
                            } catch(e){ console.log("⛔ Frame Access Blocked at depth " + depth); } 
                        }
                        return null;
                    };

                    const sanitizeAudio = (label, lang, idx, src) => {
                        const generic = ['SoundHandler', 'GPAC ISO Audio Handler', 'mp4a', 'iso2'];
                        
                        // If we have a good label, use it
                        if (label && !generic.some(g => label.includes(g))) return label;
                        
                        // Try to extract language from src URL patterns
                        let detectedLang = lang;
                        if (!detectedLang && src) {
                            const s = src.toLowerCase();
                            if (s.includes('/en/') || s.includes('_eng') || s.includes('-english')) detectedLang = 'en';
                            else if (s.includes('/es/') || s.includes('_esp') || s.includes('-spanish')) detectedLang = 'es';
                            else if (s.includes('/fr/') || s.includes('_fre') || s.includes('-french')) detectedLang = 'fr';
                            else if (s.includes('/de/') || s.includes('_ger') || s.includes('-german')) detectedLang = 'de';
                            else if (s.includes('/it/') || s.includes('_ita') || s.includes('-italian')) detectedLang = 'it';
                            else if (s.includes('/pt/') || s.includes('_por') || s.includes('-portuguese')) detectedLang = 'pt';
                            else if (s.includes('/ja/') || s.includes('_jpn') || s.includes('-japanese')) detectedLang = 'ja';
                            else if (s.includes('/ko/') || s.includes('_kor') || s.includes('-korean')) detectedLang = 'ko';
                            else if (s.includes('/zh/') || s.includes('_chi') || s.includes('-chinese')) detectedLang = 'zh';
                            else if (s.includes('/ru/') || s.includes('_rus') || s.includes('-russian')) detectedLang = 'ru';
                        }
                        
                        // Convert language code to display name
                        let displayName = detectedLang || 'Unknown';
                        if (detectedLang && detectedLang.length >= 2) {
                            try {
                                const intlName = new Intl.DisplayNames(['en'], { type: 'language' }).of(detectedLang);
                                if (intlName && intlName !== 'root' && intlName !== 'und') displayName = intlName;
                            } catch(e) {}
                        }
                        
                        return displayName.charAt(0).toUpperCase() + displayName.slice(1) + ' ' + (idx + 1);
                    };

                    // --- ENGINE ---
                    window.AG_VIDEO = null;
                    const updateState = () => {
                        if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
                            window.AG_VIDEO = findVideo(document);
                            if (window.AG_VIDEO) {
                                const v = window.AG_VIDEO;
                                if (!v.hasAGListeners) {
                                    v.hasAGListeners = true;
                                    console.log('🎥 Video Attached (v5): src=' + (v.currentSrc || v.src) + ', readyState=' + v.readyState + ', networkState=' + v.networkState);
                                    
                                    ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'error', 'ended'].forEach(evt => {
                                        v.addEventListener(evt, (e) => {
                                            let detail = "";
                                            if (evt === 'error' && v.error) detail = " Code: " + v.error.code + " Msg: " + v.error.message;
                                            console.log('🎬 Video Event (v5): ' + evt + detail);
                                        });
                                    });

                                    // Attempt muted autoplay first
                                    v.muted = true;
                                    v.volume = 0;
                                    v.autoplay = true;
                                    v.setAttribute('autoplay', 'true');
                                    
                                    const attemptPlay = () => {
                                        v.play().then(() => {
                                            console.log("▶️ Playback started (muted)");
                                        }).catch(e => {
                                            console.log("⚠️ Playback failed: " + e.message);
                                            // Aggressive retry on interactions
                                            const trigger = () => {
                                                v.play().then(() => {
                                                    console.log("▶️ Playback recovered on interaction");
                                                    window.removeEventListener('click', trigger);
                                                }).catch(() => {});
                                            };
                                            window.addEventListener('click', trigger, { once: true });
                                        });
                                    };
                                    
                                    if (v.readyState > 2) attemptPlay();
                                    else v.addEventListener('canplay', attemptPlay, { once: true });
                                }
                            }
                        }
                        // Retry finding video periodically if current one is invalid
                        if (window.AG_VIDEO && !window.AG_VIDEO.isConnected) window.AG_VIDEO = null;
                        
                        // Monitor Player State (JW / HLS)
                        const v = window.AG_VIDEO;
                        if (v) {
                            if (window.jwplayer) {
                                try {
                                    const state = window.jwplayer().getState();
                                    if (window.AG_LAST_JW_STATE !== state) {
                                        console.log("📺 JWPlayer State:", state);
                                        window.AG_LAST_JW_STATE = state;
                                    }
                                } catch(e) {}
                            }
                            if (v.paused && !v.ended && v.readyState > 2 && !v.dataset.manualPause) {
                                 v.play().catch(() => {});
                            }
                        }
                        if (!v) return;

                        const s = {
                            currentTime: v.currentTime,
                            duration: v.duration,
                            volume: v.muted ? 0 : v.volume,
                            isPaused: v.paused,
                            tracks: [], audioTracks: [], qualities: []
                        };

                        // Native
                        if(v.textTracks) for(let i=0; i<v.textTracks.length; i++) {
                            const t = v.textTracks[i];
                            s.tracks.push({ label: t.label || t.language || 'Track ' + (i+1), language: t.language, active: t.mode === 'showing' });
                        }
                        if(v.audioTracks) for(let i=0; i<v.audioTracks.length; i++) {
                            const t = v.audioTracks[i];
                            s.audioTracks.push({ label: sanitizeAudio(t.label, t.language, i, v.currentSrc || v.src), language: t.language, active: t.enabled });
                        }

                        // Player Wrappers (JW / HLS / Fiber)
                        const jw = window.jwplayer ? window.jwplayer() : null;
                        const hls = window.hls || window.Hls || v.__hls__;

                        if (jw) {
                            try {
                                if (s.tracks.length === 0 && jw.getCaptionsList) (jw.getCaptionsList() || []).forEach((c, i) => s.tracks.push({ label: c.label || c.name || 'Track ' + (i+1), active: i === jw.getCurrentCaptions() }));
                                if (s.audioTracks.length === 0 && jw.getAudioTracks) (jw.getAudioTracks() || []).forEach((a, i) => s.audioTracks.push({ label: sanitizeAudio(a.label, a.language, i, v.currentSrc || v.src), active: i === jw.getCurrentAudioTrack() }));
                                if (jw.getQualityLevels) (jw.getQualityLevels() || []).forEach((q, i) => s.qualities.push({ label: q.label, height: q.height, active: i === jw.getCurrentQuality() }));
                            } catch(e) { console.log('⚠️ JW Error:', e.message); }
                        }
                        if (hls && s.audioTracks.length === 0) hls.audioTracks.forEach((t, i) => s.audioTracks.push({ label: sanitizeAudio(t.name || t.label, t.lang, i, v.currentSrc || v.src), active: i === hls.audioTrack }));
                        
                        // Fiber Probe
                        if (s.audioTracks.length === 0 || s.qualities.length === 0) {
                            const p = scanFiber(getFiber(v) || getFiber(v.parentElement));
                            if (p) {
                                if (s.audioTracks.length === 0 && p.audioTracks) p.audioTracks.forEach((t, i) => s.audioTracks.push({ label: sanitizeAudio(t.label || t.name, t.language, i, v.currentSrc || v.src), active: t.active || t.enabled }));
                                if (s.qualities.length === 0 && p.qualityLevels) p.qualityLevels.forEach((q, i) => s.qualities.push({ label: q.label || q.name, height: q.height, active: q.active || i === p.currentQuality }));
                            }
                        }

                        console.log('ANTIGRAVITY_UPDATE:' + JSON.stringify(s));
                    };

                    window.AG_INTERVAL_ID = setInterval(updateState, 1000);

                    // --- COMMANDS ---
                    window.AG_CMD_SEEK = (t) => { 
                        console.log('🎯 AG_CMD_SEEK called with time:', t, 'AG_VIDEO exists:', !!window.AG_VIDEO);
                        if(window.AG_VIDEO) {
                            console.log('Current time before seek:', window.AG_VIDEO.currentTime);
                            window.AG_VIDEO.currentTime = t;
                            console.log('Current time after seek:', window.AG_VIDEO.currentTime);
                        } else {
                            console.error('❌ AG_VIDEO not found, cannot seek');
                        }
                    };
                    window.AG_CMD_VOL = (v) => { if(window.AG_VIDEO) { window.AG_VIDEO.volume = v; window.AG_VIDEO.muted = v === 0; } };
                    window.AG_CMD_TOGGLE = () => { if(window.AG_VIDEO) { if(window.AG_VIDEO.paused) window.AG_VIDEO.play(); else window.AG_VIDEO.pause(); } };
                    window.AG_CMD_SPEED = (s) => { if(window.AG_VIDEO) window.AG_VIDEO.playbackRate = s; };
                    window.AG_CMD_PIP = () => { if(window.AG_VIDEO) { if (document.pictureInPictureElement) document.exitPictureInPicture(); else window.AG_VIDEO.requestPictureInPicture(); } };
                    window.AG_CMD_TRACK = (idx) => {
                        const v = window.AG_VIDEO; if(!v) return;
                        if(v.textTracks) for(let i=0; i<v.textTracks.length; i++) v.textTracks[i].mode = (i === idx) ? 'showing' : 'hidden';
                        if(window.jwplayer) try { window.jwplayer().setCurrentCaptions(idx); } catch(e){}
                    };
                    window.AG_CMD_AUDIO_TRACK = (idx) => {
                        const v = window.AG_VIDEO; if(!v) return;
                        if(v.audioTracks) for(let i=0; i<v.audioTracks.length; i++) v.audioTracks[i].enabled = (i === idx);
                        if(window.jwplayer) try { window.jwplayer().setCurrentAudioTrack(idx); } catch(e){}
                        const h = window.hls || window.Hls; if(h) h.audioTrack = idx;
                    };
                    window.AG_CMD_QUALITY = (idx) => {
                        if(window.jwplayer) try { window.jwplayer().setCurrentQuality(idx); } catch(e){}
                        const h = window.hls || window.Hls; if(h) h.currentLevel = idx;
                    };

                    window.AG_CMD_SUB_STYLE = (s) => {
                        const id = 'ag-sub-style';
                        const css = \`
                            video::cue, video::-webkit-media-text-track-display { 
                                font-size: \${s.fontSize || 18}px !important; 
                                background-color: rgba(0,0,0,\${s.bgOpacity ?? 0.5}) !important; 
                                color: \${s.color || '#fff'} !important; 
                            }
                            [class*="subtitle"], [class*="caption"] { font-size: \${s.fontSize || 18}px !important; color: \${s.color || '#fff'} !important; }
                        \`;
                        const inject = (root) => {
                            if(!root) return;
                            try {
                                let el = root.getElementById(id);
                                if(!el) { el = document.createElement('style'); el.id = id; (root.head || root.body || root).appendChild(el); }
                                el.textContent = css;
                            } catch(e){}
                            root.querySelectorAll?.('iframe').forEach(f => { try { inject(f.contentDocument || f.contentWindow?.document); } catch(e){} });
                            if(root.createTreeWalker) {
                                const w = root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false);
                                let n; while(n = w.nextNode()) if(n.shadowRoot) inject(n.shadowRoot);
                            }
                        };
                        inject(document);
                    };

                    // 1. Softened popup blocking
                    // Restore basic window.open blocking to prevent popup creation attempts
                    window.open = function() { return null; };
                    // window.alert = function() {}; // Keep alert blocked as it's rarely used legitimately in embeds
                    // window.confirm = function() { return false; };
                    window.onbeforeunload = null; 
                    
                    // 2. Comprehensive CSS blocking
                    const blockCss = \`
                        /* Native Controls */
                        video::-webkit-media-controls-panel,
                        video::-webkit-media-controls-play-button,
                        video::-webkit-media-controls-start-playback-button { 
                            display: none !important; 
                        }
                        
                        /* Ads & Popups & Overlays */
                        .ad, .ads, .advertisement, [class*="ad-"], [id*="ad-"],
                        .popup, [class*="popup"], [id*="popup"],
                        .modal, [class*="modal"], [id*="modal"],
                        .overlay, [class*="overlay"], [id*="overlay"],
                        [class*="watermark"], [id*="watermark"],
                        [class*="promo"], [id*="promo"],
                        [class*="banner"], [id*="banner"],
                        iframe[src*="google"], iframe[src*="ads"], iframe[src*="doubleclick"], iframe[src*="pop"],
                        #logo, .logo, [class*="logo"], [id*="logo"],
                        a[href*="chaturbate"], a[href*="faphouse"], a[href*="bet"], a[href*="casino"],
                        [class*="chat"], [id*="chat"],
                        [class*="register"], [id*="register"],
                        [class*="sign-up"], [id*="signup"],
                        [class*="browser"], [id*="browser"],
                        [class*="download"], [id*="download"],
                        #preloader, .preloader, [class*="loading-overlay"] {
                            display: none !important;
                            opacity: 0 !important;
                            visibility: hidden !important;
                            pointer-events: none !important;
                            width: 0 !important;
                            height: 0 !important;
                            position: absolute !important;
                            left: -9999px !important;
                            top: -9999px !important;
                            transform: scale(0) !important;
                        }
                        
                        /* Fix potential Z-index issues for video */
                        video {
                            z-index: 2147483647 !important;
                        }

                        /* Page Styling */
                        body, html { 
                            background: #000 !important; 
                            overflow: hidden !important; 
                        }
                        video { 
                            object-fit: contain !important; 
                            background: #000 !important; 
                        }
                    \`;
                    
                    const styleEl = document.createElement('style');
                    styleEl.id = 'ag-block-all';
                    styleEl.textContent = blockCss;
                    document.head.appendChild(styleEl);
                    
                    // 3. Continuously remove popup elements (DOM Observer)
                    const killPopups = () => {
                        const selectors = [
                            '[class*="popup"]', '[id*="popup"]',
                            '[class*="modal"]', '[id*="modal"]',
                            '[class*="overlay"]', '[id*="overlay"]',
                            '[class*="ad"]', '[id*="ad"]',
                            'iframe[src*="ads"]', 'iframe[src*="chat"]', 'iframe[src*="pop"]',
                            '[class*="banner"]', '[id*="banner"]',
                            '[class*="notice"]', '[id*="notice"]',
                            'a[target="_blank"]',
                            '[style*="z-index: 2147483647"]', // Often used by ads, but be careful with video
                            '[style*="position: fixed; top: 0; left: 0; width: 100%; height: 100%"]' // Full screen overlays
                        ];
                        selectors.forEach(sel => {
                            try {
                                document.querySelectorAll(sel).forEach(el => {
                                    if (el && el.parentNode && el !== document.body && el !== document.documentElement && el.tagName !== 'VIDEO') {
                                        // Specific check to not kill the video container if it uses these styles
                                        if (el.contains(window.AG_VIDEO)) return;
                                        
                                        // Safe removal
                                        try {
                                             if (el.parentNode) el.parentNode.removeChild(el);
                                             else el.remove();
                                        } catch(e) {}
                                    }
                                });
                             } catch(e) {}
                        });
                    };
                    
                    // Run frequently
                    setInterval(killPopups, 250);
                    killPopups();
                    
                    // 4. Click Blocking removed (Requested to scrap global popup)
                    /*
                    document.addEventListener('click', (e) => {
                        if (e.target.tagName !== 'VIDEO' && e.target.closest('video') === null) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                    }, true);
                    */
                    
                    // 5. MutationObserver to kill popups as they're added
                    const observer = new MutationObserver(() => killPopups());
                    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
                })();
            `;
            webview.executeJavaScript(script);
            isReadyRef.current = true;
            if (subtitleStyle) safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        };
        const onConsole = (e)=>{
            const msg = e.message;
            // Ignore benign ad-block errors
            if (msg.includes('Refused to execute script') && msg.includes('MIME type')) return;
            if (msg.startsWith('ANTIGRAVITY_UPDATE:')) {
                try {
                    const data = JSON.parse(msg.substring(19));
                    callbacksRef.current.onStateUpdate?.(data);
                } catch (e) {}
            } else if (msg === 'ANTIGRAVITY_ENDED') {
                callbacksRef.current.onEnded?.();
            } else {
                // Ignore security and ad-related noise
                if (msg.includes('Electron Security Warning')) return;
                if (msg.includes('Content-Security-Policy')) return;
                if (msg.includes('preloaded using link preload but not used')) return;
                if (msg.includes('yandex.ru')) return;
                if (msg.includes('google-analytics')) return;
                if (msg.includes('Failed to load resource')) return; // Generic noise
                if (msg.includes('The resource was requested using a link that was not recognized')) return;
                if (msg.includes('Autoplay is only allowed')) return;
                // Determine log level
                if (e.level === 2) console.warn('[Webview]', msg);
                else if (e.level === 3) console.error('[Webview]', msg);
                else console.log('[Webview]', msg);
            }
        };
        const onDomReady = ()=>{
            console.log('✅ Webview: dom-ready');
            onDidFinishLoad();
        };
        const onDidFinishLoadEvent = ()=>{
            console.log('✅ Webview: did-finish-load');
            onDidFinishLoad();
        };
        const onDidFailLoad = (e)=>console.log('❌ Webview: did-fail-load', e.errorCode, e.errorDescription);
        const onCrashed = (e)=>console.log('💥 Webview: crashed', e);
        webview.addEventListener('did-finish-load', onDidFinishLoadEvent);
        webview.addEventListener('dom-ready', onDomReady);
        webview.addEventListener('did-fail-load', onDidFailLoad);
        webview.addEventListener('crashed', onCrashed);
        webview.addEventListener('console-message', onConsole);
        // Prevent all popups from the webview to avoid main process window creation (which triggers the "Destroyer")
        // @ts-ignore
        webview.addEventListener('new-window', (e)=>{
            console.log('[Webview] Blocked popup:', e.url);
            e.preventDefault();
        });
        return ()=>{
            isReadyRef.current = false;
            webview.removeEventListener('did-finish-load', onDidFinishLoadEvent);
            webview.removeEventListener('dom-ready', onDomReady);
            webview.removeEventListener('did-fail-load', onDidFailLoad);
            webview.removeEventListener('crashed', onCrashed);
            webview.removeEventListener('console-message', onConsole);
        };
    }, [
        src,
        initialVolume
    ]); // Only re-run if src or volume changes (volume is usually static initially)
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full h-full bg-black flex items-center justify-center overflow-hidden",
        children: [
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "w-10 h-10 text-white animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                    lineNumber: 528,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 527,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("webview", {
                ref: webviewRef,
                src: src,
                className: "w-full h-full border-0",
                style: {
                    width: '100vw',
                    height: '100vh',
                    background: '#000'
                },
                // @ts-ignore
                // @ts-ignore
                allowpopups: "false",
                // @ts-ignore
                disablewebsecurity: "true",
                webpreferences: "contextIsolation=no, nodeIntegration=no, webSecurity=no, autoplayPolicy=no-user-gesture-required",
                useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            }, void 0, false, {
                fileName: "[project]/src/components/player/WebviewPlayer.tsx",
                lineNumber: 531,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/player/WebviewPlayer.tsx",
        lineNumber: 525,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
});
WebviewPlayer.displayName = "WebviewPlayer";
const __TURBOPACK__default__export__ = WebviewPlayer;
}),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatDate",
    ()=>formatDate,
    "formatDuration",
    ()=>formatDuration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
}),
"[project]/src/components/UI/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/dom/motion.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, variant = "primary", size = "md", state = "default", children, disabled, ...props }, ref)=>{
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative rounded-full inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden", variants[variant], sizes[size], className),
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
            state === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
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
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
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
            state === 'success' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$dom$2f$motion$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    scale: 0
                },
                animate: {
                    scale: 1
                },
                className: "ml-2 text-green-500",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
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
Button.displayName = "Button";
}),
"[project]/src/app/watch/[id]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WatchPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/alert-circle.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$content$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api/content.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$sourceProvider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/sourceProvider.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$VideoPlayer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/player/VideoPlayer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$WebviewPlayer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/player/WebviewPlayer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UI$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/UI/button.tsx [app-ssr] (ecmascript)");
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
function WatchPage({ params }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const type = searchParams.get("type") || 'movie';
    // Unwrap params (Next.js 15+)
    const { id } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["use"](params);
    const [content, setContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [sourceUrl, setSourceUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isEmbed, setIsEmbed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let mounted = true;
        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Content Details
                const details = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2f$content$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["contentApi"].getDetails(id, type);
                if (!mounted) return;
                if (!details) {
                    setError("Content not found");
                    setLoading(false);
                    return;
                }
                setContent(details);
                // 2. Fetch Sources
                // MAPPING: backend expects specific types
                const sourceType = type === 'movie' ? 'movie' : type === 'tv' ? 'series' : 'anime';
                const sourcesMap = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$sourceProvider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getAllSources({
                    id: details.id,
                    title: details.title,
                    type: sourceType
                });
                if (!mounted) return;
                // 3. Select Best Source
                let bestSourceObj = null; // Typing 'any' to avoid strict checks for now
                console.log("[WatchPage] Sources Map keys:", Array.from(sourcesMap.keys()));
                // Priority: Vidlink (HLS/Embed) -> Torrent -> Consumet
                const vidlink = sourcesMap.get('vidlink');
                const torrent = sourcesMap.get('torrent');
                console.log("[WatchPage] Vidlink sources:", vidlink);
                console.log("[WatchPage] Torrent sources:", torrent);
                if (vidlink && vidlink.length > 0) {
                    bestSourceObj = vidlink[0];
                } else if (torrent && torrent.length > 0) {
                    bestSourceObj = torrent[0]; // Streaming torrent URL
                } else {
                    console.warn("[WatchPage] No sources found in map.");
                    setError("No playable sources found");
                }
                if (bestSourceObj) {
                    setSourceUrl(bestSourceObj.url);
                    setIsEmbed(bestSourceObj.type === 'embed');
                }
            } catch (err) {
                console.error("Watch page error:", err);
                if (mounted) setError(err.message || "Failed to load content");
            } finally{
                if (mounted) setLoading(false);
            }
        }
        if (id) {
            loadData();
        }
        return ()=>{
            mounted = false;
        };
    }, [
        id,
        type
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-screen w-full items-center justify-center bg-black",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "h-10 w-10 animate-spin text-red-600"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 104,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-zinc-400 font-medium animate-pulse",
                        children: "Locating stream..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 105,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 103,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/watch/[id]/page.tsx",
            lineNumber: 102,
            columnNumber: 13
        }, this);
    }
    if (error || !content) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-screen w-full items-center justify-center bg-black",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center space-y-4 max-w-md px-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "h-12 w-12 text-red-500 mx-auto"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 115,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-white",
                        children: "Playback Error"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 116,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-zinc-400",
                        children: error || "Unknown error occurred"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 117,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UI$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                        onClick: ()=>router.back(),
                        variant: "secondary",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                className: "mr-2 h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 119,
                                columnNumber: 25
                            }, this),
                            "Go Back"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 118,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 114,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/watch/[id]/page.tsx",
            lineNumber: 113,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-screen w-full bg-black overflow-hidden flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute top-0 left-0 w-full z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none transition-opacity duration-300 ${isEmbed ? 'hover:opacity-100 opacity-0' : 'opacity-100'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$UI$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        className: "pointer-events-auto hover:bg-white/10 text-white",
                        onClick: ()=>router.back(),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                className: "mr-2 h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 136,
                                columnNumber: 21
                            }, this),
                            "Back"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 131,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-right",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-lg font-bold text-white drop-shadow-md",
                                children: content.title
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 141,
                                columnNumber: 21
                            }, this),
                            type === 'tv' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-zinc-300",
                                children: "Season 1 • Episode 1"
                            }, void 0, false, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 142,
                                columnNumber: 39
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 140,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 130,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center bg-black",
                children: [
                    sourceUrl ? isEmbed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$WebviewPlayer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        src: sourceUrl,
                        title: content.title,
                        onStateUpdate: (state)=>{
                            console.log("[WatchPage] Webview State Update:", state);
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 150,
                        columnNumber: 25
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full h-full max-w-[1920px]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$player$2f$VideoPlayer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoPlayer"], {
                            src: sourceUrl,
                            poster: content.backdrop || content.poster,
                            title: content.title,
                            onEnded: ()=>{
                                console.log("Video ended");
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/app/watch/[id]/page.tsx",
                            lineNumber: 159,
                            columnNumber: 29
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 158,
                        columnNumber: 25
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-zinc-500",
                        children: "Source URL missing"
                    }, void 0, false, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 168,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute bottom-4 left-4 z-50 p-2 bg-black/80 text-xs text-green-400 font-mono rounded pointer-events-none select-text",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Status: ",
                                    loading ? 'Loading' : 'Ready'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 173,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Type: ",
                                    type
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 174,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Embed Mode: ",
                                    isEmbed ? 'YES' : 'NO'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 175,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Source: ",
                                    sourceUrl || 'None'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/watch/[id]/page.tsx",
                                lineNumber: 176,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/watch/[id]/page.tsx",
                        lineNumber: 172,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/watch/[id]/page.tsx",
                lineNumber: 147,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/watch/[id]/page.tsx",
        lineNumber: 128,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0d2e248d._.js.map