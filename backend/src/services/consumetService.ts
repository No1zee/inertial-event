import { META, MOVIES, ANIME, StreamingServers } from '@consumet/extensions';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { ProviderResponseSchema, IProviderResponse } from './providers/ProviderSchemas.js';

class ConsumetService {
    private config = ProviderConfig.consumet;
    private tmdb = new META.TMDB();
    private anilist = new META.Anilist();
    private hianime = new ANIME.Hianime();

    // Circuit breaker state - prevents cascading 522/521 hangs from dead providers
    private providerHealth: Record<string, { failures: number; lastFailure: number }> = {
        flixhq: { failures: 0, lastFailure: 0 },
        hianime: { failures: 0, lastFailure: 0 },
        tmdb: { failures: 0, lastFailure: 0 },
    };
    private readonly FAILURE_THRESHOLD = 3;
    private readonly COOLDOWN_PERIOD = 30 * 60 * 1000; // 30 minutes

    /**
     * Get streaming links for a piece of content.
     * Uses multiple providers in parallel for maximum reliability:
     * - META.TMDB: Primary for movies/TV via TMDB ID lookup
     * - MOVIES.FlixHQ: Secondary for movies/TV (circuit-broken when down)
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

            // Run extraction strategies in parallel.
            // Circuit breaker skips unhealthy providers to prevent 522 hangs.
            const strategies = await Promise.allSettled([
                this.extractViaTMDB(contentId, normalizedType, seasonNumber, episodeNumber),

                normalizedType === 'anime' && title && this.isProviderHealthy('hianime')
                    ? this.extractViaHianime(title, episodeNumber)
                    : null,

                // FlixHQ is permanently broken (Cloudflare 522 timeout), so we skip it to save time
                null,
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
     * NOTE: flixhq.to is experiencing systemic 522 outages.
     * The circuit breaker auto-skips this after 3 consecutive failures,
     * retrying after the 30-minute cooldown window.
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

            const bestMatch = searchResults.results.find(
                (r: any) => r.title?.toLowerCase() === title.toLowerCase()
            ) || searchResults.results[0];

            console.log(`[ConsumetService] FlixHQ: Best match: "${bestMatch.title}" (${bestMatch.id})`);

            const info = await this.flixhq.fetchMediaInfo(bestMatch.id);

            if (type === 'tv' || type === 'anime') {
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
            this.reportProviderFailure('flixhq');
        }
        return { sources: [], subtitles: [] };
    }

    /**
     * Strategy 3: ANIME.Hianime title-based search
     * Most reliable for anime HLS streams
     */
    private async extractViaHianime(
        title: string,
        episodeNumber?: number
    ): Promise<{ sources: any[]; subtitles: any[] }> {
        try {
            const titleStr = String(title || '');
            const cleanTitle = titleStr.replace(/Season \d+/i, '').replace(/\(.*?\)/g, '').trim();
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
            const targetEp = episodes.find((ep: any) => ep.number === episodeNumber) || episodes[0];

            if (targetEp?.id) {
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
            this.reportProviderFailure('hianime');
        }
        return { sources: [], subtitles: [] };
    }


    // ─── Circuit Breaker Helpers ─────────────────────────────────────────────

    private isProviderHealthy(providerId: string): boolean {
        const health = this.providerHealth[providerId];
        if (!health) return true;

        if (health.failures >= this.FAILURE_THRESHOLD) {
            const timeSinceLastFailure = Date.now() - health.lastFailure;
            if (timeSinceLastFailure < this.COOLDOWN_PERIOD) {
                const remaining = Math.round((this.COOLDOWN_PERIOD - timeSinceLastFailure) / 60000);
                console.log(`[ConsumetService] Circuit Breaker OPEN: Skipping ${providerId} (${remaining}m remaining)`);
                return false;
            } else {
                // Cooldown expired — allow a single retry attempt
                console.log(`[ConsumetService] Circuit Breaker RESET: Retrying ${providerId}...`);
                health.failures = 0;
            }
        }
        return true;
    }

    private reportProviderFailure(providerId: string) {
        if (!this.providerHealth[providerId]) {
            this.providerHealth[providerId] = { failures: 0, lastFailure: 0 };
        }
        this.providerHealth[providerId].failures++;
        this.providerHealth[providerId].lastFailure = Date.now();
        const { failures } = this.providerHealth[providerId];
        console.warn(`[ConsumetService] Provider failure: ${providerId} (${failures}/${this.FAILURE_THRESHOLD})`);
        if (failures >= this.FAILURE_THRESHOLD) {
            console.error(`[ConsumetService] Circuit breaker OPEN for ${providerId} — bypassing for ${this.COOLDOWN_PERIOD / 60000}m`);
        }
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
