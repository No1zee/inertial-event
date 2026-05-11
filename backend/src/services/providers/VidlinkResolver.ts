import axios from 'axios';

export interface ISourceResult {
    url: string;
    isM3U8: boolean;
    quality?: string;
    isDub?: boolean;
    isSub?: boolean;
}

export interface ISubtitleResult {
    url: string;
    lang: string;
    label?: string;
}

export interface IResolveResult {
    sources: ISourceResult[];
    subtitles: ISubtitleResult[];
}

export class VidlinkResolver {
    private static BASE_URL = 'https://vidlink.pro/api';

    /**
     * Resolves direct HLS links and subtitles from Vidlink.
     */
    static async resolve(tmdbId: string, type: 'movie' | 'tv' | 'anime', season?: number, episode?: number, preferDub: boolean = false): Promise<IResolveResult> {
        try {
            let url = '';
            if (type === 'anime') {
                url = `${this.BASE_URL}/get-sources?id=${tmdbId}&type=anime&episode=${episode}${preferDub ? '&dub=true' : ''}`;
            } else {
                url = `${this.BASE_URL}/get-sources?id=${tmdbId}&type=${type}${type === 'tv' ? `&season=${season}&episode=${episode}` : ''}`;
            }
            
            console.log(`[VidlinkResolver] Calling API: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'Referer': 'https://vidlink.pro/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
                timeout: 12000
            });

            if (!response.data || !response.data.sources) {
                console.warn('[VidlinkResolver] No sources in API response');
                return { sources: [], subtitles: [] };
            }

            const sources: ISourceResult[] = response.data.sources.map((s: any) => ({
                url: s.file || s.url,
                isM3U8: (s.file || s.url || '').includes('.m3u8'),
                quality: s.label || s.quality || 'auto',
                isDub: preferDub || (s.label || '').toLowerCase().includes('dub'),
                isSub: !preferDub && (s.label || '').toLowerCase().includes('sub')
            }));

            const subtitles: ISubtitleResult[] = (response.data.subtitles || []).map((sub: any) => ({
                url: sub.file || sub.url,
                lang: sub.label || sub.lang || 'Unknown',
                label: sub.label
            }));

            return { sources, subtitles };
        } catch (error: any) {
            console.warn(`[VidlinkResolver] Direct extraction failed: ${error.message}`);
            // Fallback to empty results so the service can provide embed links
            return { sources: [], subtitles: [] };
        }
    }
}
