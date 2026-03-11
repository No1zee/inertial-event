import React, { useEffect, useState } from 'react';
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

    const [animeEndpoint, setAnimeEndpoint] = useState<string | null>(null);
    const [isFetchingMalId, setIsFetchingMalId] = useState<boolean>(type === 'anime');

    // Fetch MAL ID for Anime to support English Dub preference
    useEffect(() => {
        if (type === 'anime' && content?.title) {
            const fetchMalId = async () => {
                try {
                    // Clean title for better search results (remove "Season 2", etc)
                    const cleanTitle = content.title.replace(/Season \d+/i, '').trim();
                    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`);
                    const data = await res.json();
                    
                    if (data?.data?.[0]?.mal_id) {
                        const malId = data.data[0].mal_id;
                        // Use Vidlink's dedicated anime endpoint requesting 'dub'
                        // Vidlink uses absolute episode logic for this endpoint mostly, but we pass what we have
                        setAnimeEndpoint(`/anime/${malId}/${episode}/dub`);
                    } else {
                        throw new Error('No MAL ID found');
                    }
                } catch (error) {
                    console.error("Failed to map TMDB to MAL for Anime play. Falling back to generic TV endpoint.", error);
                    setAnimeEndpoint(`/tv/${tmdbId}/${season}/${episode}`);
                } finally {
                    setIsFetchingMalId(false);
                }
            };
            fetchMalId();
        }
    }, [type, content?.title, tmdbId, season, episode]);

    // Build URL endpoint
    let endpoint = '';
    if (type === 'movie') endpoint = `/movie/${tmdbId}`;
    else if (type === 'tv') endpoint = `/tv/${tmdbId}/${season}/${episode}`;
    else if (type === 'anime') endpoint = animeEndpoint || '';

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

    if (type === 'anime') {
        params.append('fallback', 'true'); // Fallback to sub if dub is unavailable
    }

    const baseUrl = 'https://vidlink.pro';
    const src = endpoint ? `${baseUrl}${endpoint}?${params.toString()}` : '';

    // Message listener for tracking progress
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

    if (isFetchingMalId || !src) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black relative">
            <iframe
                src={src}
                className="w-full h-full border-0 absolute inset-0 transition-opacity duration-500"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
            />
        </div>
    );
}
