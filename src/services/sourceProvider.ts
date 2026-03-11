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
        let API_URL = (process.env.NEXT_PUBLIC_API_URL && 
                         process.env.NEXT_PUBLIC_API_URL !== "undefined" && 
                         !process.env.NEXT_PUBLIC_API_URL.includes('your-vercel-domain')) 
            ? process.env.NEXT_PUBLIC_API_URL 
            : "";
        if (API_URL && !API_URL.startsWith('http')) API_URL = `https://${API_URL}`;
        try {
            // Normalize URL to prevent double /api/api
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const endpoint = baseUrl.endsWith('/api') && baseUrl.endsWith('/api/api') ? baseUrl.replace('/api/api', '/api') : baseUrl;
            
            const response = await fetch(`${endpoint}/sources?id=${contentId}&type=${type}&title=${encodeURIComponent(title)}`);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("[SourceProvider] API error:", response.status, response.statusText, "Body:", errorBody);
                return [];
            }
            const data = await response.json();
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
        let API_URL = (process.env.NEXT_PUBLIC_API_URL && 
                         process.env.NEXT_PUBLIC_API_URL !== "undefined" && 
                         !process.env.NEXT_PUBLIC_API_URL.includes('your-vercel-domain')) 
            ? process.env.NEXT_PUBLIC_API_URL 
            : "";
        if (API_URL && !API_URL.startsWith('http')) API_URL = `https://${API_URL}`;

        // Single call to backend which handles aggregator logic (Vidlink + Torrent + etc)
        const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const url = `${baseUrl}/sources?id=${content.id}&type=${content.type}&title=${encodeURIComponent(content.title)}&season=${season}&episode=${episode}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("[SourceProvider] API error:", response.status, response.statusText, "Body:", errorBody);
                return sources;
            }
            const data = await response.json();
            const allSources = data.sources || [];
            
            if (allSources.length > 0) {
                // Group by type for the UI
                const vidlink = allSources.filter((s: any) => s.type === 'hls' || s.type === 'embed');
                const torrent = allSources.filter((s: any) => s.type === 'torrent' || s.type === 'mp4');

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
