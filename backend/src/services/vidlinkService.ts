import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { ProviderResponseSchema, IProviderResponse, IStreamSource } from './providers/ProviderSchemas.js';
import { tmdbService } from './tmdbService.js';
import { VidlinkResolver } from './providers/VidlinkResolver.js';

class VidlinkService {
    private config = ProviderConfig.vidlink;

    async getSources(id: string, season: number, episode: number, type: 'movie' | 'tv' | 'anime' | 'series', audioPreference?: string): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        try {
            // Strip 'tmdb_', 'tv_', 'movie_', 'series_' prefixes to ensure raw TMDB ID
            const cleanId = id.replace(/^(tmdb_|tv_|movie_|series_)/, '');

            // This handles cases like "id-12345" if they ever occur
            const numericId = cleanId.match(/^\d+$/) ? cleanId : (cleanId.match(/\d+/) || [cleanId])[0];

            const mappedType: 'movie' | 'tv' = (type === 'tv' || type === 'anime' || type === 'series') ? 'tv' : 'movie';

            // 1. Fetch IMDB ID for redundancy (Best Reliability)
            // IMDB IDs for movies are handled correctly, but for TV shows we need to be careful with TMDB's generic ID mapping
            let imdbId: string | null = null;
            try {
                imdbId = await tmdbService.getExternalIds(numericId, mappedType);
                console.log(`[Vidlink] Reliability: TMDB:${numericId} IMDB:${imdbId || 'N/A'}`);
            } catch (e) {
                console.warn(`[Vidlink] IMDB ID fetch failed for ${type}/${numericId}`);
            }

            console.log(`[Vidlink] Generating Embed for ID: ${id} -> Clean: ${numericId} Type: ${type} Season: ${season} Episode: ${episode}`);

            const sources: IStreamSource[] = [];

            // 0. Primary Extraction: Attempt Direct M3U8 (Ad-Free)
            const subtitles: any[] = [];
            try {
                console.log(`[Vidlink] Attempting Direct HLS Extraction for ${type}/${numericId} (Pref: ${audioPreference})`);
                const preferDub = audioPreference === 'dub';
                const directResult = await VidlinkResolver.resolve(numericId, mappedType === 'tv' && type === 'anime' ? 'anime' : mappedType, season, episode, preferDub);
                
                if (directResult.sources && directResult.sources.length > 0) {
                    directResult.sources.forEach(ds => {
                        sources.push({
                            url: ds.url,
                            quality: ds.quality || 'auto',
                            type: ds.isM3U8 ? 'hls' : 'mp4',
                            provider: 'Vidlink (Direct)',
                            isDub: !!ds.isDub,
                            isSub: !!ds.isSub
                        });
                    });
                    console.log(`[Vidlink] Successfully extracted ${directResult.sources.length} direct sources.`);
                    
                    if (directResult.subtitles && directResult.subtitles.length > 0) {
                        directResult.subtitles.forEach(sub => {
                            subtitles.push({
                                url: sub.url,
                                lang: sub.lang,
                                label: sub.label
                            });
                        });
                        console.log(`[Vidlink] Extracted ${directResult.subtitles.length} direct subtitles.`);
                    }
                }
            } catch (error) {
                console.warn(`[Vidlink] Direct extraction failed:`, error);
            }

            // Vidlink Customization Props
            const params = new URLSearchParams({
                primaryColor: 'dc2626', // Red-600
                secondaryColor: '141414', // Zinc-950
                iconColor: 'ffffff',
                icons: 'default', // 'vid' or 'default'
                autoplay: 'true',
                nextbutton: 'true'
            }).toString();

            const isMovie = mappedType === 'movie';

            // 1. Primary: Vidlink (Better Quality)
            if (isMovie) {
                const url = `https://vidlink.pro/movie/${numericId}?${params}`;
                console.log(`[Vidlink] Movie URL: ${url}`);
                sources.push({
                    url: url,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "Vidlink (HQ)"
                });

                // Add IMDB Version if available
                if (imdbId) {
                    sources.push({
                        url: `https://vidlink.pro/movie/${imdbId}?${params}`,
                        quality: "1080p",
                        type: "embed" as const,
                        provider: "Vidlink (Backup)"
                    });
                }
            } else {
                const isAnime = type === 'anime';
                const endpoint = isAnime ? `/anime/${numericId}/${episode}` : `/tv/${numericId}/${season}/${episode}`;
                const audioSuffix = isAnime && audioPreference === 'dub' ? '/dub' : '';
                
                const url = `https://vidlink.pro${endpoint}${audioSuffix}?${params}`;
                console.log(`[Vidlink] ${isAnime ? 'Anime' : 'TV'} URL: ${url}`);
                sources.push({
                    url: url,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: `Vidlink (${isAnime ? 'Anime' : 'HQ'})`,
                    isDub: isAnime && audioPreference === 'dub',
                    isSub: isAnime && audioPreference !== 'dub'
                });

                if (imdbId && !isAnime) {
                    sources.push({
                        url: `https://vidlink.pro/tv/${imdbId}/${season}/${episode}?${params}`,
                        quality: "1080p",
                        type: "embed" as const,
                        provider: "Vidlink (Backup)"
                    });
                }
            }

            // 2. Additional HQ Provider: Multi-Source
            if (imdbId) {
                sources.push({
                    url: `https://multiembed.mov/directstream.php?video_id=${imdbId}${!isMovie ? `&s=${season}&e=${episode}` : ''}`,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "NovaCore"
                });
            }

            // 3. Fallback: VidSrc (Robust)
            if (isMovie) {
                sources.push({
                    url: `https://vidsrc.icu/embed/movie/${imdbId || cleanId}`,
                    quality: "720p",
                    type: "embed" as const,
                    provider: "VidSrc (Stable)"
                });
            } else {
                // VidSrc usually uses /embed/tv/ID/SEASON/EPISODE
                sources.push({
                    url: `https://vidsrc.icu/embed/tv/${imdbId || cleanId}/${season}/${episode}`,
                    quality: "720p",
                    type: "embed" as const,
                    provider: "VidSrc (Stable)"
                });
            }

            // 4. Ultra Fallback: Pro
            if (imdbId) {
                 sources.push({
                    url: `https://vidsrc.pro/embed/${isMovie ? 'movie' : 'tv'}/${imdbId}${!isMovie ? `/${season}/${episode}` : ''}`,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "VidSrc Pro"
                });
            }

            return {
                sources: sources,
                subtitles: subtitles
            };

        } catch (error: any) {
            console.warn(`Vidlink source error for ${type}/${id}:`, error.message);
            return null;
        }
    }
}

const vidlinkService = new VidlinkService();
export { vidlinkService };
