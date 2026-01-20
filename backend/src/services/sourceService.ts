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

import vidlinkService from './vidlinkService';
import consumetService from './consumetService';
import torrentService from './torrentService';
import { IProviderResponse } from './providers/ProviderSchemas';

class SourceService {
    private cacheExpiry = 3600; // 1 hour

    async getAllSources(
        contentId: string,
        seasonNumber: number,
        episodeNumber: number,
        title: string,
        type: 'movie' | 'tv'
    ): Promise<IProviderResponse> {
        try {
            // Parallel execution with error boundaries inside each service
            const results = await Promise.allSettled([
                vidlinkService.getSources(contentId, seasonNumber, episodeNumber, type), // Pass type
                // consumetService.getStreamingLinks(contentId), // Disable strictly to test vidlink, or keep? let's keep.
                // torrentService.getSources(contentId, episodeNumber, seasonNumber, type) // DISABLED via User Request ("Scrap torrenting")
            ]);

            const aggregated: IProviderResponse = {
                sources: [],
                subtitles: []
            };

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    console.log(`[SourceService] Provider ${index} returned items:`, result.value.sources ? result.value.sources.length : 0);
                    if (result.value.sources) {
                        result.value.sources.forEach((s: any) => console.log(`   - [${s.type}] ${s.url}`));
                    }
                    aggregated.sources.push(...result.value.sources);
                    aggregated.subtitles.push(...result.value.subtitles);
                } else {
                    console.warn(`[SourceService] Provider ${index} rejected or empty:`, result.status);
                }
            });

            // Deduplication logic
            const uniqueSources = Array.from(
                new Map(aggregated.sources.map((s) => [s.url, s])).values()
            );

            console.log(`[SourceService] Final unique sources count: ${uniqueSources.length}`);

            // FAIL OPEN: If no sources found, use Demo
            if (uniqueSources.length === 0) {
                console.warn("No sources found from any provider. Falling back to Demo Stream.");
                return {
                    sources: [
                        {
                            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                            quality: "auto",
                            type: "hls",
                            provider: "Demo Fallback"
                        }
                    ],
                    subtitles: []
                };
            }

            return {
                sources: uniqueSources,
                subtitles: aggregated.subtitles
            };

        } catch (error) {
            console.error('Critical Error in Source Aggregation:', error);
            // Fail open with empty result rather than crashing
            console.warn("Critical source error, falling back to demo source.");
            return {
                sources: [
                    {
                        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                        quality: "auto",
                        type: "hls",
                        provider: "Demo Fallback"
                    }
                ],
                subtitles: []
            };
        }
    }

    async verifySourceHealth(url: string): Promise<boolean> {
        return true; // Simple mock for now
    }
}

export default new SourceService();
