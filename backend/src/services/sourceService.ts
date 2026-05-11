import axios from 'axios';
// import redisClient from './redisService'; // Assuming this exists or will be created
// import HLSParser from '../utils/hlsParser'; // Assuming this exists or will be created

// Mock Redis for now if not available
const redisClient = {
    get: async (key: string) => null,
    setex: async (key: string, expiry: number, value: string) => { }
};

// Simplified HLSParser bridge or reimplementation
const HLSParser = {
    parse: (data: string) => ({}) // Placeholder for now
};

interface StreamSource {
    url: string;
    quality: string;
    type: 'hls' | 'mp4' | 'torrent' | 'embed';
    provider: string;
}

interface StreamResult {
    sources: StreamSource[];
    subtitles: Array<{ lang: string; url: string }>;
}

import { vidlinkService } from './vidlinkService.js';
import { consumetService } from './consumetService.js';
import { torrentService } from './torrentService.js';
import { VidsrcResolver } from './providers/VidsrcResolver.js';
import { EmbedSuResolver } from './providers/EmbedSuResolver.js';
import { IProviderResponse, IStreamSource } from './providers/ProviderSchemas.js';

class SourceService {
    private cacheExpiry = 3600; // 1 hour

    async getAllSources(
        contentId: string,
        seasonNumber: number,
        episodeNumber: number,
        title: string,
        type: 'movie' | 'tv' | 'anime' | 'series',
        audioPreference?: string,
        disabledProviders: string[] = []
    ): Promise<IProviderResponse> {
        try {
            const mappedType: 'movie' | 'tv' = (type === 'tv' || type === 'anime' || type === 'series') ? 'tv' : 'movie';
            
            // Parallel execution with error boundaries inside each service
            console.error(`[SourceService] Starting aggregation for ${title} (${contentId}) - S${seasonNumber}E${episodeNumber}`);
            
            const providers = [
                { name: 'Vidlink', fn: () => vidlinkService.getSources(contentId, seasonNumber, episodeNumber, type, audioPreference) },
                { name: 'Consumet', fn: () => consumetService.getStreamingLinks(contentId, episodeNumber, seasonNumber, type, title) },
                { name: 'Torrent', fn: () => torrentService.getSources(contentId, episodeNumber, seasonNumber, type) },
                { name: 'Vidsrc Mirrors', fn: () => VidsrcResolver.resolve(contentId, mappedType, seasonNumber, episodeNumber).then(r => ({
                    sources: r.sources.map((s: any) => ({
                        url: s.url,
                        quality: s.quality || 'auto',
                        type: (s.isM3U8 ? 'hls' : 'mp4') as 'hls' | 'mp4',
                        provider: 'Vidsrc (Direct)'
                    })),
                    subtitles: r.subtitles.map((s: any) => ({ lang: s.lang, url: s.url }))
                })) },
                { name: 'EmbedSu', fn: () => EmbedSuResolver.resolve(contentId, mappedType, seasonNumber, episodeNumber).then((r: any) => ({
                    sources: (r.sources || []).map((s: any) => ({
                        url: s.url,
                        quality: s.quality || 'auto',
                        type: (s.isM3U8 ? 'hls' : s.type || 'mp4') as 'hls' | 'mp4' | 'embed',
                        provider: s.provider || 'EmbedSu (Direct)'
                    })),
                    subtitles: (r.subtitles || []).map((s: any) => ({ lang: s.lang, url: s.url }))
                })) }
            ].filter(p => !disabledProviders.includes(p.name));

            const results = await Promise.allSettled(providers.map(p => p.fn()));

            const aggregated: IProviderResponse = {
                sources: [],
                subtitles: []
            };

            results.forEach((result, index) => {
                const name = providers[index].name;
                if (result.status === 'fulfilled' && result.value) {
                    const value = result.value as IProviderResponse;
                    const sourceCount = value.sources?.length || 0;
                    const subCount = value.subtitles?.length || 0;
                    
                    console.log(`[SourceService] [${name}] SUCCESS: Found ${sourceCount} sources, ${subCount} subtitles`);

                    if (value.sources && value.sources.length > 0) {
                        aggregated.sources.push(...value.sources);
                    }
                    if (value.subtitles && value.subtitles.length > 0) {
                        aggregated.subtitles.push(...value.subtitles);
                    }
                } else if (result.status === 'rejected') {
                    console.error(`[SourceService] [${name}] REJECTED:`, result.reason);
                    if (result.reason?.stack) {
                        console.error(`[SourceService] [${name}] Stack:`, result.reason.stack);
                    }
                } else {
                    console.warn(`[SourceService] [${name}] EMPTY or NULL response`);
                }
            });

            // Safety Fallback: If no sources found at all, try one last time to generate a direct Vidlink embed
            // This handles cases where vidlinkService might have failed due to TMDB ID resolution issues
            if (aggregated.sources.length === 0) {
                console.log(`[SourceService] Critical: No sources found. Generating emergency fallback for ${contentId}`);
                const cleanId = contentId.replace(/^(tmdb_|tv_|movie_|series_)/, '');
                const isMovie = mappedType === 'movie';
                const fallbackUrl = isMovie 
                    ? `https://vidlink.pro/movie/${cleanId}`
                    : `https://vidlink.pro/tv/${cleanId}/${seasonNumber}/${episodeNumber}`;
                
                aggregated.sources.push({
                    url: fallbackUrl,
                    quality: "1080p",
                    type: "embed",
                    provider: "Vidlink (Fallback)"
                });
            }

            // Deduplication logic
            const uniqueSources = Array.from(
                new Map(aggregated.sources.map((s) => [s.url, s])).values()
            );

            // Sorting logic: HLS/MP4 first, then Torrents, then Embeds
            uniqueSources.sort((a, b) => {
                // Priority 1: Audio Preference (for Anime)
                if (type === 'anime' && audioPreference === 'dub') {
                    if (a.isDub && !b.isDub) return -1;
                    if (!a.isDub && b.isDub) return 1;
                }

                // Priority 2: Type (HLS/MP4 > Torrent > Embed)
                const typePriority = (s: IStreamSource) => {
                    const t = s.type;
                    const p = s.provider || '';
                    
                    if (t === 'hls' || t === 'mp4') return 1;
                    if (t === 'torrent' || (t as string) === 'magnet') return 2;
                    
                    // Embeds are lower priority
                    if (t === 'embed') {
                        // Specifically deprioritize Vidlink embeds as requested by user
                        if (p.includes('Vidlink')) return 10; 
                        return 5;
                    }
                    return 20;
                };
                
                const pA = typePriority(a);
                const pB = typePriority(b);
                
                if (pA !== pB) return pA - pB;

                // Priority 3: Quality
                const qPriority = (q: string) => {
                    if (q.includes('4K') || q.includes('2160')) return 1;
                    if (q.includes('1080')) return 2;
                    if (q.includes('720')) return 3;
                    if (q.includes('480')) return 4;
                    if (q.includes('auto')) return 5;
                    return 6;
                };

                const qualityDiff = qPriority(a.quality || '') - qPriority(b.quality || '');
                if (qualityDiff !== 0) return qualityDiff;

                // Priority 4: Specific provider preference within same type/quality
                if (a.provider.includes('Vidsrc') && !b.provider.includes('Vidsrc')) return -1;
                if (!a.provider.includes('Vidsrc') && b.provider.includes('Vidsrc')) return 1;

                return 0;
            });


            
            // Background Warm-up (Fire and Forget)
            this.warmupTopSources(uniqueSources).catch(err => 
                console.warn("[SourceService] Warmup error (non-critical):", err.message)
            );

            // If no sources found, return empty result to trigger frontend iframe fallback
            if (uniqueSources.length === 0) {

            }

            return {
                sources: uniqueSources,
                subtitles: aggregated.subtitles
            };

        } catch (error: any) {
            // Fail open with empty result rather than crashing
            console.error("[SourceService] CRITICAL ERROR in getAllSources:", error.message);
            if (error.stack) {
                console.error("[SourceService] Stack Trace:", error.stack);
            }
            return {
                sources: [],
                subtitles: []
            };
        }
    }

    async verifySourceHealth(url: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(url, { 
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
            
            clearTimeout(timeout);
            return response.ok;
        } catch {
            return false;
        }
    }

    async warmupTopSources(sources: IStreamSource[]) {
        // Fire and forget top 3 direct sources to prime CDN/Backend
        const directSources = sources.filter(s => s.type === 'hls' || s.type === 'mp4').slice(0, 3);
        if (directSources.length === 0) return;


        
        // We use Promise.allSettled to ensure we don't block, but also don't crash the server loop
        Promise.allSettled(
            directSources.map(s => this.verifySourceHealth(s.url))
        ).then(results => {
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
            if (successCount > 0) {

            }
        }).catch(() => {});
    }
}

const sourceService = new SourceService();
export { sourceService };
