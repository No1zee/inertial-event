import { useState, useCallback } from 'react';

interface Subtitle {
    lang: string;
    url: string;
    label: string;
}

export const useSubtitles = () => {
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

    const addSubtitle = useCallback((sub: Subtitle) => {
        setSubtitles(prev => [...prev.filter(s => s.lang !== sub.lang), sub]);
    }, []);

    const clearSubtitles = useCallback(() => {
        setSubtitles([]);
        setActiveSubtitle(null);
    }, []);

    return {
        subtitles,
        activeSubtitle,
        setActiveSubtitle,
        addSubtitle,
        clearSubtitles
    };
};

export default useSubtitles;
