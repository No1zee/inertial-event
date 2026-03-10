import React, { useEffect } from 'react';
import { useHistoryStore } from "@/lib/store/historyStore";
import { useSeriesTrackingStore } from "@/lib/store/seriesTrackingStore";

interface VidlinkPlayerProps {
    tmdbId: string;
    type: 'movie' | 'tv' | 'anime';
    season?: string | number;
    episode?: string | number;
    content?: any;
}

export function VidlinkPlayer({ tmdbId, type, season = 1, episode = 1, content }: VidlinkPlayerProps) {
    const addToHistory = useHistoryStore((state: any) => state.addToHistory);
    const trackSeries = useSeriesTrackingStore((state: any) => state.trackSeries);

    // Build URL
    let baseUrl = 'https://vidlink.pro';
    
    // Fallback Anime to TV endpoint using TMDB ID
    let endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}/${season}/${episode}`;

    // Apply parameters
    const params = new URLSearchParams({
        primaryColor: '63b8bc',
        secondaryColor: 'a2a2a2',
        iconColor: 'eefdec',
        icons: 'default',
        player: 'default',
        title: 'true',
        poster: 'true',
        autoplay: 'false',
        nextbutton: 'true'
    });

    const src = `${baseUrl}${endpoint}?${params.toString()}`;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://vidlink.pro') return;

            // Handle watch progress from custom Continue Watching data structure via Vidlink API
            if (event.data?.type === 'MEDIA_DATA') {
                const mediaData = event.data.data;
                localStorage.setItem('vidLinkProgress', JSON.stringify(mediaData));
            }

            // Handle player events to sync with our custom history and tracking stores
            if (event.data?.type === 'PLAYER_EVENT') {
                const { event: eventType, currentTime, duration } = event.data.data;
                
                if (eventType === 'timeupdate' || eventType === 'pause' || eventType === 'ended') {
                    if (content && currentTime > 0) {
                        const now = Date.now();
                        
                        // Throttle History Updates (Every 5s)
                        const lastHistUpdate = (window as any)._lastHistoryUpdate || 0;
                        if (now - lastHistUpdate > 5000 || eventType === 'ended') {
                            addToHistory({
                                ...content,
                                progress: currentTime,
                                duration: duration,
                                season: type !== 'movie' ? Number(season) : undefined,
                                episode: type !== 'movie' ? Number(episode) : undefined
                            });
                            (window as any)._lastHistoryUpdate = now;
                        }

                        // Throttle Series Tracking
                        if (type === 'tv' || type === 'anime') {
                            const lastTrackUpdate = (window as any)._lastTrackUpdate || 0;
                            if (now - lastTrackUpdate > 60000 || eventType === 'ended') {
                                trackSeries(content, Number(season), Number(episode));
                                (window as any)._lastTrackUpdate = now;
                            }
                        }
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [content, type, season, episode, addToHistory, trackSeries]);

    return (
        <div className="w-full h-full bg-black relative">
            <iframe
                src={src}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
            />
        </div>
    );
}
