import axios from 'axios';

class ManifestService {
    async fetchManifest(url: string) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error: any) {
            console.error('Manifest fetch error:', error.message);
            return null;
        }
    }

    parseManifest(content: string) {
        // Simple manifest parsing logic
        const lines = content.split('\n');
        const sources: any[] = [];
        let currentQuality = 'auto';

        lines.forEach((line) => {
            if (line.startsWith('#EXT-X-STREAM-INF')) {
                const match = line.match(/RESOLUTION=(\d+x\d+)/);
                if (match) currentQuality = match[1];
            } else if (line.trim() && !line.startsWith('#')) {
                sources.push({ url: line.trim(), quality: currentQuality });
            }
        });

        return sources;
    }
}

const manifestService = new ManifestService();
export { manifestService };
