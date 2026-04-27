import { META, MOVIES, ANIME, StreamingServers } from '@consumet/extensions';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { ProviderResponseSchema, IProviderResponse } from './providers/ProviderSchemas.js';

class ConsumetService {
    private config = ProviderConfig.consumet;
    private tmdb = new META.TMDB();
    private anilist = new META.Anilist();
    private flixhq = new MOVIES.FlixHQ();
    private hianime = new ANIME.Hianime();


    /**
     * Get streaming links for a piece of content.
     * Uses multiple providers in parallel for maximum reliability:
     * - META.TMDB: Primary for movies/TV via TMDB ID lookup
     * - MOVIES.FlixHQ: Secondary for movies/TV via title search
     * - ANIME.Hianime: Primary for anime via title search
     */
    async getStreamingLinks(
        contentId: string, 
        episodeNumber?: number, 
        seasonNumber?: number,
        type: 'movie' | 'tv' | 'anime' | 'series' = 'movie',
        title?: string
    ): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        try {
            const normalizedType = type === 'series' ? 'tv' : type;
            console.log(`[ConsumetService] Resolving ${normalizedType}: ${contentId}, S${seasonNumber}E${episodeNumber}, Title: "${title || 'N/A'}"`);
            
            let sources: any[] = [];
            let subtitles: any[] = [];

            // Run multiple extraction strategies in parallel
            const strategies = await Promise.allSettled([
                this.extractViaTMDB(contentId, normalizedType, seasonNumber, episodeNumber),
                normalizedType === 'anime' && title
                    ? this.extractViaHianime(title, episodeNumber)
                    : null,

                title
                    ? this.extractViaFlixHQ(title, normalizedType, seasonNumber, episodeNumber)
                    : null,
            ]);

            // Merge results from all strategies
            for (const result of strategies) {
                if (result.status === 'fulfilled' && result.value) {
                    const { sources: s, subtitles: sub } = result.value;
                    if (s.length > 0) {
                        sources.push(...s);
                        console.log(`[ConsumetService] Strategy yielded ${s.length} sources`);
                    }
                    if (sub.length > 0) subtitles.push(...sub);
                }
            }

            if (!sources || sources.length === 0) {
                console.warn('[ConsumetService] No sources found from any strategy for:', contentId);
                return null;
            }

            // Deduplicate by URL
            const uniqueSources = Array.from(
                new Map(sources.map(s => [s.url, s])).values()
            );

            const parsed = ProviderResponseSchema.safeParse({
                sources: uniqueSources.map((s: any) => ({
                    url: s.url,
                    quality: s.quality || 'auto',
                    type: s.isM3U8 ? 'hls' : 'mp4',
                    provider: s.provider || 'consumet',
                    isDub: s.isDub || false,
                    isSub: s.isSub || false
                })),
                subtitles: (subtitles || []).map((sub: any) => ({
                    lang: sub.lang || sub.label || 'Unknown',
                    url: sub.url
                }))
            });

            if (!parsed.success) {
                console.warn('[ConsumetService] Schema validation failed:', (parsed as any).error);
                return null;
            }

            return parsed.data;

        } catch (error: any) {
            console.error('[ConsumetService] Error:', error.message);
            return null;
        }
    }

    /**
     * Strategy 1: META.TMDB direct ID resolution
     */
    private async extractViaTMDB(
        contentId: string,
        type: string,
        seasonNumber?: number,
        episodeNumber?: number
    ): Promise<{ sources: any[]; subtitles: any[] }> {
        try {
            if (type === 'tv' || type === 'anime') {
                const info = await this.tmdb.fetchMediaInfo(contentId, 'tv');
                const season = info.seasons?.find((s: any) => s.season === seasonNumber);
                const episode = season?.episodes?.find((e: any) => e.episode === episodeNumber);
                
                if (episode?.id) {
                    const result = await this.tmdb.fetchEpisodeSources(episode.id, contentId);
                    return {
                        sources: (result.sources || []).map((s: any) => ({ ...s, provider: 'Consumet (TMDB)' })),
                        subtitles: result.subtitles || []
                    };
                }
            } else {
                const result = await this.tmdb.fetchEpisodeSources(contentId, contentId);
                return {
                    sources: (result.sources || []).map((s: any) => ({ ...s, provider: 'Consumet (TMDB)' })),
                    subtitles: result.subtitles || []
                };
            }
        } catch (e: any) {
            console.warn(`[ConsumetService] TMDB strategy failed: ${e.message}`);
        }
        return { sources: [], subtitles: [] };
    }

    /**
     * Strategy 2: MOVIES.FlixHQ title-based search
     * FlixHQ is one of the most reliable providers for raw HLS streams
     */
    private async extractViaFlixHQ(
        title: string,
        type: string,
        seasonNumber?: number,
        episodeNumber?: number
    ): Promise<{ sources: any[]; subtitles: any[] }> {
        try {
            console.log(`[ConsumetService] FlixHQ: Searching for "${title}"`);
            const searchResults = await this.flixhq.search(title);
            
            if (!searchResults.results || searchResults.results.length === 0) {
                console.warn('[ConsumetService] FlixHQ: No search results');
                return { sources: [], subtitles: [] };
            }

            // Find best match - prefer exact title matches
            const bestMatch = searchResults.results.find(
                (r: any) => r.title?.toLowerCase() === title.toLowerCase()
            ) || searchResults.results[0];

            console.log(`[ConsumetService] FlixHQ: Best match: "${bestMatch.title}" (${bestMatch.id})`);

            const info = await this.flixhq.fetchMediaInfo(bestMatch.id);

            if (type === 'tv' || type === 'anime') {
                // Find the episode
                const episodes = info.episodes || [];
                const targetEpisode = episodes.find(
                    (ep: any) => ep.season === seasonNumber && ep.number === episodeNumber
                ) || episodes.find(
                    (ep: any) => ep.number === episodeNumber
                );

                if (targetEpisode?.id) {
                    const result = await this.flixhq.fetchEpisodeSources(targetEpisode.id, bestMatch.id);
                    return {
                        sources: (result.sources || []).map((s: any) => ({ ...s, provider: 'FlixHQ (HLS)' })),
                        subtitles: result.subtitles || []
                    };
                }
            } else {
                // Movie - use first episode (movies have a single "episode")
                const episodes = info.episodes || [];
                if (episodes.length > 0) {
                    const result = await this.flixhq.fetchEpisodeSources(episodes[0].id, bestMatch.id);
                    return {
                        sources: (result.sources || []).map((s: any) => ({ ...s, provider: 'FlixHQ (HLS)' })),
                        subtitles: result.subtitles || []
                    };
                }
            }
        } catch (e: any) {
            console.warn(`[ConsumetService] FlixHQ strategy failed: ${e.message}`);
        }
        return { sources: [], subtitles: [] };
    }

    /**
     * Strategy 3: ANIME.Hianime title-based search
     * Hianime is the most reliable for anime HLS streams
     */
    private async extractViaHianime(
        title: string,
        episodeNumber?: number
    ): Promise<{ sources: any[]; subtitles: any[] }> {
        try {
            const cleanTitle = title.replace(/Season \d+/i, '').replace(/\(.*?\)/g, '').trim();
            console.log(`[ConsumetService] Hianime: Searching for "${cleanTitle}"`);
            
            const searchResults = await this.hianime.search(cleanTitle);
            
            if (!searchResults.results || searchResults.results.length === 0) {
                console.warn('[ConsumetService] Hianime: No search results');
                return { sources: [], subtitles: [] };
            }

            const bestMatch = searchResults.results[0];
            console.log(`[ConsumetService] Hianime: Best match: "${bestMatch.title}" (${bestMatch.id})`);

            const info = await this.hianime.fetchAnimeInfo(bestMatch.id);
            const episodes = info.episodes || [];
            
            // Find the target episode
            const targetEp = episodes.find((ep: any) => ep.number === episodeNumber) || episodes[0];

            if (targetEp?.id) {
                // Fetch both sub and dub sources in parallel if possible
                const [subResult, dubResult] = await Promise.allSettled([
                    this.hianime.fetchEpisodeSources(targetEp.id, (StreamingServers as any).VidStreaming || 'vidstreaming', 'sub' as any),
                    this.hianime.fetchEpisodeSources(targetEp.id, (StreamingServers as any).VidStreaming || 'vidstreaming', 'dub' as any)
                ]);

                const sources: any[] = [];
                const subtitles: any[] = [];

                if (subResult.status === 'fulfilled' && subResult.value) {
                    sources.push(...(subResult.value.sources || []).map((s: any) => ({ 
                        ...s, 
                        provider: 'Hianime (Sub)',
                        isSub: true,
                        isDub: false
                    })));
                    subtitles.push(...(subResult.value.subtitles || []));
                }

                if (dubResult.status === 'fulfilled' && dubResult.value) {
                    sources.push(...(dubResult.value.sources || []).map((s: any) => ({ 
                        ...s, 
                        provider: 'Hianime (Dub)',
                        isDub: true,
                        isSub: false
                    })));
                }

                return { sources, subtitles };
            }
        } catch (e: any) {
            console.warn(`[ConsumetService] Hianime strategy failed: ${e.message}`);
        }
        return { sources: [], subtitles: [] };
    }
    

    async search(query: string, type: 'movie' | 'tv' | 'anime' = 'movie') {
        if (!this.config.enabled) return [];
        try {
            const response = await this.tmdb.search(query);
            return response.results || [];
        } catch (error: any) {
            console.error('[ConsumetService] Search error:', error.message);
            return [];
        }
    }
}

const consumetService = new ConsumetService();
export { consumetService };
