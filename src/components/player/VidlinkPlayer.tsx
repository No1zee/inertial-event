import React, { useEffect, useState } from 'react';
import { useHistoryStore } from "@/lib/store/historyStore";
import { useSeriesTrackingStore } from "@/lib/store/seriesTrackingStore";

interface VidlinkPlayerProps {
    tmdbId: string;
    type: 'movie' | 'tv' | 'anime';
    season?: string | number;
    episode?: string | number;
    content?: any;
    subtitles?: string;
}

export function VidlinkPlayer({ tmdbId, type, season = 1, episode = 1, content, subtitles }: VidlinkPlayerProps) {
    const addToHistory = useHistoryStore((state: any) => state.addToHistory);
    const trackSeries = useSeriesTrackingStore((state: any) => state.trackSeries);

    // Heuristically determine if it's anime, since TMDB often classifies it as 'tv'
    const isAnime = type === 'anime' || (
        type === 'tv' && 
        content?.originalLanguage === 'ja' &&
        content?.genres?.includes('Animation')
    );

    const activeType = isAnime ? 'anime' : type;

    const [animeEndpoint, setAnimeEndpoint] = useState<string | null>(null);
    const [isFetchingMalId, setIsFetchingMalId] = useState<boolean>(activeType === 'anime');
    const [startAt, setStartAt] = useState<number>(0);

    // Retrieve watch progress for startAt
    useEffect(() => {
        try {
            const stored = localStorage.getItem('vidLinkProgress');
            if (stored) {
                const progressData = JSON.parse(stored);
                const itemData = progressData[tmdbId];
                if (itemData) {
                    if (activeType === 'movie' && itemData.progress?.watched) {
                        if (itemData.progress.duration && (itemData.progress.duration - itemData.progress.watched < 300)) {
                            setStartAt(0);
                        } else {
                            setStartAt(Math.floor(itemData.progress.watched));
                        }
                    } else if ((activeType === 'tv' || activeType === 'anime') && itemData.show_progress) {
                        const epKey = `s${season}e${episode}`;
                        const epData = itemData.show_progress[epKey];
                        if (epData?.progress?.watched) {
                            if (epData.progress.duration && (epData.progress.duration - epData.progress.watched < 300)) {
                                setStartAt(0);
                            } else {
                                setStartAt(Math.floor(epData.progress.watched));
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error reading VidLink progress from localStorage:', e);
        }
    }, [tmdbId, activeType, season, episode]);

    // Fetch MAL ID for Anime to support English Dub preference and calculate Absolute Episode
    useEffect(() => {
        if (activeType === 'anime' && content?.title) {
            const fetchMalId = async () => {
                try {
                    // Calculate absolute episode number by summing previous seasons
                    let absoluteEpisode = Number(episode);
                    if (content.seasonsList && content.seasonsList.length > 0) {
                        const currentSeason = Number(season);
                        let previousEpisodesCount = 0;
                        for (const s of content.seasonsList) {
                            if (s.season_number > 0 && s.season_number < currentSeason) {
                                previousEpisodesCount += (s.episode_count || 0);
                            }
                        }
                        absoluteEpisode = previousEpisodesCount + Number(episode);
                    }

                    const cleanTitle = content.title.replace(/Season \d+/i, '').trim();
                    const res = await fetch(`/api/mal?q=${encodeURIComponent(cleanTitle)}`);
                    const data = await res.json();
                    
                    if (data?.data?.[0]?.mal_id) {
                        const malId = data.data[0].mal_id;
                        setAnimeEndpoint(`/anime/${malId}/${absoluteEpisode}/dub`);
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
    }, [activeType, content, tmdbId, season, episode]);

    // Build URL endpoint
    let endpoint = '';
    if (activeType === 'movie') endpoint = `/movie/${tmdbId}`;
    else if (activeType === 'tv') endpoint = `/tv/${tmdbId}/${season}/${episode}`;
    else if (activeType === 'anime') endpoint = animeEndpoint || '';

    // Apply Premium Player Parameters
    const params = new URLSearchParams({
        primaryColor: 'E50914', // Netflix Red / NovaStream accent
        secondaryColor: '1A1A1A', // Dark Gray overlay
        iconColor: 'FFFFFF', // Crisp White icons
        icons: 'vid', // Custom Vid icons
        title: 'true',
        poster: 'true',
        autoplay: 'false',
        nextbutton: 'true'
    });

    if (activeType !== 'anime') {
        params.append('player', 'jw'); // Professional JW Player UI for Movies/TV
    } else {
        params.append('fallback', 'true');
    }

    if (startAt > 0) {
        params.append('startAt', startAt.toString());
    }

    if (subtitles) {
        params.append('sub', subtitles);
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
                                season: activeType !== 'movie' ? Number(season) : undefined,
                                episode: activeType !== 'movie' ? Number(episode) : undefined
                            });
                            (window as any)._lastHistoryUpdate = now;
                        }

                        // Throttle Series Tracking
                        if (activeType === 'tv' || activeType === 'anime') {
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
    }, [content, activeType, season, episode, addToHistory, trackSeries]);

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
