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
        audioPreference?: string
    ): Promise<IProviderResponse> {
        try {
            const mappedType: 'movie' | 'tv' = (type === 'tv' || type === 'anime' || type === 'series') ? 'tv' : 'movie';
            
            // Parallel execution with error boundaries inside each service
            const results = await Promise.allSettled([
                vidlinkService.getSources(contentId, seasonNumber, episodeNumber, type, audioPreference),
                consumetService.getStreamingLinks(contentId, episodeNumber, seasonNumber, type, title),
                torrentService.getSources(contentId, episodeNumber, seasonNumber, type),
                VidsrcResolver.resolve(contentId, mappedType, seasonNumber, episodeNumber),
                EmbedSuResolver.resolve(contentId, mappedType, seasonNumber, episodeNumber)
            ]);

            const aggregated: IProviderResponse = {
                sources: [],
                subtitles: []
            };

            const providerNames = ['Vidlink', 'Consumet', 'Torrent', 'Vidsrc Mirrors', 'EmbedSu'];
            results.forEach((result, index) => {
                const name = providerNames[index];
                if (result.status === 'fulfilled' && result.value) {
                    const value = result.value as IProviderResponse;
                    console.log(`[SourceService] Provider ${name} yielded ${value.sources?.length || 0} sources`);
                    if (value.sources) {
                        value.sources.forEach((s: any) => {
                            if (s.type === 'hls' || s.type === 'mp4') {
                                console.log(`   - [DIRECT] ${s.provider} -> ${s.url.substring(0, 50)}...`);
                            }
                        });
                        aggregated.sources.push(...value.sources);
                    }
                    if (value.subtitles) {
                        aggregated.subtitles.push(...value.subtitles);
                    }
                } else if (result.status === 'rejected') {
                    console.error(`[SourceService] Provider ${name} REJECTED:`, result.reason);
                }
            });

            // Deduplication logic
            const uniqueSources = Array.from(
                new Map(aggregated.sources.map((s) => [s.url, s])).values()
            );

            // Sorting logic: HLS/MP4 first, then by quality
            uniqueSources.sort((a, b) => {
                // Priority 1: Audio Preference (for Anime)
                if (type === 'anime' && audioPreference === 'dub') {
                    if (a.isDub && !b.isDub) return -1;
                    if (!a.isDub && b.isDub) return 1;
                }

                // Priority 2: Type (HLS/MP4 > Embed/Torrent)
                const typePriority = (t: string) => {
                    if (t === 'hls' || t === 'mp4') return 1;
                    if (t === 'embed') return 2;
                    return 3; // torrent
                };
                
                const pA = typePriority(a.type);
                const pB = typePriority(b.type);
                
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

                return qPriority(a.quality || '') - qPriority(b.quality || '');
            });

            console.log(`[SourceService] Final unique sources count: ${uniqueSources.length}`);
            
            // Background Warm-up (Fire and Forget)
            this.warmupTopSources(uniqueSources).catch(err => 
                console.warn("[SourceService] Warmup error (non-critical):", err.message)
            );

            // If no sources found, return empty result to trigger frontend iframe fallback
            if (uniqueSources.length === 0) {
                console.warn("[SourceService] No sources found from any provider.");
            }

            return {
                sources: uniqueSources,
                subtitles: aggregated.subtitles
            };

        } catch (error) {
            console.error('Critical Error in Source Aggregation:', error);
            // Fail open with empty result rather than crashing
            console.warn("Critical source error, returning empty sources.");
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

        console.log(`[SourceService] Cinematic Warm-up: Priming ${directSources.length} direct streams...`);
        
        // We use Promise.allSettled to ensure we don't block, but also don't crash the server loop
        Promise.allSettled(
            directSources.map(s => this.verifySourceHealth(s.url))
        ).then(results => {
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
            if (successCount > 0) {
                console.log(`[SourceService] Warm-up Complete: ${successCount}/${directSources.length} streams primed.`);
            }
        }).catch(() => {});
    }
}

const sourceService = new SourceService();
export { sourceService };
