import { useState, useEffect } from 'react';
import sourceProvider from '../services/sourceProvider';

interface StreamSource {
    url: string;
    quality: string;
    type: 'hls' | 'mp4' | 'torrent' | 'embed';
}

export const useSource = (content: { id: string; title: string; type: 'movie' | 'tv' | 'anime' | 'series' } | null) => {
    const [sources, setSources] = useState<Map<string, StreamSource[]>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!content) return;

        const fetchSources = async () => {
            setLoading(true);
            setError(null);
            try {
                const results = await sourceProvider.getAllSources(content as any);
                setSources(results);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch sources');
            } finally {
                setLoading(false);
            }
        };

        fetchSources();
    }, [content]);

    return { sources, loading, error };
};

export default useSource;
