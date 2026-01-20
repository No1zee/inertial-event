interface StreamSource {
    url: string;
    quality: string;
    type: 'hls' | 'mp4' | 'torrent' | 'embed';
}

interface ContentItem {
    id: string;
    title: string;
    type: 'anime' | 'movie' | 'series';
}

class SourceProvider {
    private consumetAPI = 'https://api.consumet.org';
    private cache: Map<string, Map<string, StreamSource[]>> = new Map();

    async getSources(contentId: string, type: 'movie' | 'series' | 'anime', title: string): Promise<StreamSource[]> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            console.log(`[SourceProvider] Fetching: ${API_URL}/api/sources?id=${contentId}&type=${type}&title=${title}`);
            const response = await fetch(`${API_URL}/api/sources?id=${contentId}&type=${type}&title=${encodeURIComponent(title)}`);
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

    async getAllSources(
        content: ContentItem,
        season: number = 1,
        episode: number = 1
    ): Promise<Map<string, StreamSource[]>> {
        const cacheKey = `${content.type}:${content.id}:${season}:${episode}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const sources = new Map<string, StreamSource[]>();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Single call to backend which handles aggregator logic (Vidlink + Torrent + etc)
        const url = `${API_URL}/api/sources?id=${content.id}&type=${content.type}&title=${encodeURIComponent(content.title)}&season=${season}&episode=${episode}`;
        console.log(`[SourceProvider] Fetching: ${url}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error("[SourceProvider] API error:", response.status, response.statusText);
                return sources;
            }
            console.log("[SourceProvider] Response Status:", response.status);
            const data = await response.json();
            const allSources = data.sources || [];
            
            console.log(`[SourceProvider] Found ${allSources.length} total sources for ${content.title}`);
            console.log("[SourceProvider] Raw Sources Summary:", allSources.map((s: any) => `${s.type}: ${s.quality || 'N/A'}`));

            if (allSources.length > 0) {
                // Group by type for the UI
                const vidlink = allSources.filter((s: any) => s.type === 'hls' || s.type === 'embed');
                const torrent = allSources.filter((s: any) => s.type === 'torrent' || s.type === 'mp4');

                console.log(`[SourceProvider] Categorized: ${vidlink.length} Vidlink, ${torrent.length} Torrent`);
                if (torrent.length > 0) {
                     console.log("[SourceProvider] Torrent Candidates:", torrent);
                }

                if (vidlink.length > 0) sources.set('vidlink', vidlink);
                if (torrent.length > 0) sources.set('torrent', torrent);
            } else {
                console.warn("[SourceProvider] No sources returned from API.");
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
export default sourceProvider;
