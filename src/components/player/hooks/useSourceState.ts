import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { useUserPreferencesStore, useActiveSource, usePlayerPreferences } from '@/lib/stores/preferencesStore';
import { usePlayerActions, usePlayerStore } from '@/lib/stores/playerStore';
import { streamingOptimizer } from '@/services/streamingOptimizer';
import { Content } from '@/lib/types/content';

export interface SourceItem {
  url: string;
  type: string;
  quality?: string;
  provider?: string;
  size?: string;
  seeders?: string;
}

export interface DirectSource {
  sources: SourceItem[];
  provider?: string;
  subtitles?: {
    url: string;
    label?: string;
    lang: string;
  }[];
}

interface UseSourceStateProps {
  tmdbId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  season?: string | number;
  episode?: string | number;
  content?: Content;
  nextSeasonNumber?: number;
  nextEpisodeNumber?: number;
  hasNext?: boolean;
}

export function useSourceState({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  content,
  nextSeasonNumber,
  nextEpisodeNumber,
  hasNext,
}: UseSourceStateProps) {
  const globalPrefs = useLocalDataStore(state => state.globalPreferences);
  const activeSource = useActiveSource();
  const cycleToNextSource = useUserPreferencesStore(state => state.cycleToNextSource);
  const playerPrefs = usePlayerPreferences();
  const { resetPlayer, loadMedia } = usePlayerActions();

  const [animeEndpoint, setAnimeEndpoint] = useState<string | null>(null);
  const [isFetchingMalId, setIsFetchingMalId] = useState<boolean>(type === 'anime');
  const [allSources, setAllSources] = useState<SourceItem[]>([]);
  const [activeSourceUrl, setActiveSourceUrl] = useState<string>('');
  const [directResult, setDirectResult] = useState<DirectSource | null>(null);
  const [selectedEmbedUrl, setSelectedEmbedUrl] = useState<string | null>(null);
  
  const hasFailedNativeRef = useRef<boolean>(false);

  // Reset identity-linked state when content changes
  useEffect(() => {
    console.log('[VidlinkPlayer] Identity Change Detected - Resetting source state');
    setSelectedEmbedUrl(null);
    setActiveSourceUrl('');
    setDirectResult(null);
    setAllSources([]);
    hasFailedNativeRef.current = false;
  }, [tmdbId, season, episode, type]);

  // Anime MAL ID resolution
  useEffect(() => {
    if (type === 'anime' && content?.title && activeSource.id === 'vidlink') {
      const fetchMalId = async () => {
        try {
          const cleanTitle = content.title.replace(/Season \d+/i, '').trim();
          const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`);
          const data = await res.json();

          if (data?.data?.[0]?.mal_id) {
            const malId = data.data[0].mal_id;
            setAnimeEndpoint(`/anime/${malId}/${episode}/${playerPrefs.audioLanguage}`);
          } else {
            throw new Error('No MAL ID found');
          }
        } catch {
          setAnimeEndpoint(`/tv/${tmdbId}/${season}/${episode}`);
        } finally {
          setIsFetchingMalId(false);
        }
      };
      fetchMalId();
    } else {
      setIsFetchingMalId(false);
    }
  }, [type, content?.title, tmdbId, season, episode, activeSource.id, playerPrefs.audioLanguage]);

  // Resolve base embed URL
  const memoizedUrl = useMemo(() => {
    const baseUrl = activeSource.baseUrl;
    if (activeSource.id === 'vidlink') {
      let endpoint = '';
      if (type === 'movie') endpoint = `/movie/${tmdbId}`;
      else if (type === 'tv' || type === 'series') endpoint = `/tv/${tmdbId}/${season}/${episode}`;
      else if (type === 'anime') endpoint = animeEndpoint || `/tv/${tmdbId}/${season}/${episode}`;

      const params: Record<string, string> = {
        primaryColor: 'c0392b',
        secondaryColor: '1a1a1a',
        iconColor: 'ffffff',
        autoplay: 'true',
        nextbutton: 'false',
      };
      if (type === 'anime') params.fallback = 'true';
      return endpoint ? `${baseUrl}${endpoint}?${new URLSearchParams(params).toString()}` : '';
    }

    if (activeSource.id === 'vidsrc-to' || activeSource.id === 'vidsrc-me' || activeSource.id === 'embed-su' || activeSource.id === 'autoembed') {
      const path = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}/${season}/${episode}`;
      return `${baseUrl}/embed${path}?autoplay=1`;
    }

    if (activeSource.id === 'multiembed') {
      const path = type === 'movie' ? `?video_id=${tmdbId}&tmdb=1&autoplay=1` : `?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}&autoplay=1`;
      return `${baseUrl}/${path}`;
    }

    return '';
  }, [activeSource, animeEndpoint, episode, season, tmdbId, type]);

  const src = selectedEmbedUrl || activeSourceUrl || memoizedUrl;

  const isNativeSource = useMemo(() => {
    if (selectedEmbedUrl) return false;
    const url = activeSourceUrl || directResult?.sources?.[0]?.url;
    if (!url) return false;
    
    // Check if it's a direct video link or a known embed provider
    const isEmbed = url.includes('vidlink.pro') || 
                   url.includes('vidsrc.to') || 
                   url.includes('vidsrc.me') || 
                   url.includes('embed.su') ||
                   url.includes('autoembed.cc') ||
                   url.includes('2embed.cc');
                   
    // Explicitly exclude magnet links as they are not supported by the native provider
    const isMagnet = url.startsWith('magnet:');
                   
    return !isEmbed && !isMagnet && (
      url.includes('.m3u8') || 
      url.includes('.mp4') || 
      url.includes('.mkv') || 
      directResult?.sources?.[0]?.type === 'hls' ||
      directResult?.sources?.[0]?.type === 'mp4'
    );
  }, [selectedEmbedUrl, activeSourceUrl, directResult]);

  // Main synchronization and preloading logic
  useEffect(() => {
    const syncMediaState = async () => {
      hasFailedNativeRef.current = false;
      
      const state = usePlayerStore.getState();
      const isSameMedia = state.currentMedia?.id === tmdbId && 
                         state.currentMedia?.season === Number(season) && 
                         state.currentMedia?.episode === Number(episode);

      if (!isSameMedia) {
        resetPlayer();
        if (content) {
          loadMedia({
            id: tmdbId,
            type,
            title: content.title || 'Untitled',
            poster: content.poster || '',
            season: Number(season),
            episode: Number(episode),
            source: src,
          });
        }
      } else if (src && state.currentMedia?.source !== src) {
        // Just update the source in store if content is identical
        const { updateMediaSource } = usePlayerStore.getState();
        updateMediaSource(src);
      }

      const key = streamingOptimizer.getPreloadKey(tmdbId, type, Number(season), Number(episode));
      const cached = streamingOptimizer.getPreloaded(key);

      if (cached && cached.sources.length > 0) {
        setAllSources(cached.sources as SourceItem[]);
        setDirectResult(cached as DirectSource);
        
        const nativeSources = cached.sources.filter(s => 
          ['hls', 'mp4'].includes(s.type) && !s.url.startsWith('magnet:')
        );
        
        if (nativeSources.length > 0) {
          setActiveSourceUrl(nativeSources[0].url);
        } else {
          setActiveSourceUrl(cached.sources[0].url);
        }
        return;
      }

      if (src) {
        setDirectResult(null);
        setAllSources([]);
        setActiveSourceUrl('');

        const sanitizedId = String(tmdbId).replace('tmdb_', '');
        const result = await streamingOptimizer.preloadSources(
          sanitizedId, 
          type, 
          Number(season), 
          Number(episode), 
          content?.title || '', 
          playerPrefs.audioLanguage
        );
        
        if (result && result.sources.length > 0) {
          let prioritizedSources = [...result.sources];
          if (globalPrefs.av1MasterStream) {
            prioritizedSources.sort((a, b) => {
              const aScore = (a.url.toLowerCase().includes('av1') || a.url.toLowerCase().includes('10bit')) ? 1 : 0;
              const bScore = (b.url.toLowerCase().includes('av1') || b.url.toLowerCase().includes('10bit')) ? 1 : 0;
              return bScore - aScore;
            });
          }
          
          setAllSources(prioritizedSources as SourceItem[]);
          
          const nativeSources = (prioritizedSources as SourceItem[]).filter(s => 
            ['hls', 'mp4'].includes(s.type) && !s.url.startsWith('magnet:')
          );
          
          if (nativeSources.length > 0) {
            setDirectResult({ ...result, sources: nativeSources } as DirectSource);
            setActiveSourceUrl(nativeSources[0].url);
          } else {
            // Filter out magnet links for the default active source if possible
            const stableSources = prioritizedSources.filter(s => !s.url.startsWith('magnet:'));
            if (stableSources.length > 0) {
              setActiveSourceUrl(stableSources[0].url);
            } else if (prioritizedSources.length > 0) {
              setActiveSourceUrl(prioritizedSources[0].url);
            }
          }
        } else {
          // If backend returns no sources, we still have the hardcoded memoizedUrl as a last resort
          setActiveSourceUrl('');
        }
      }
    };

    syncMediaState();
  }, [tmdbId, season, episode, type, playerPrefs.audioLanguage, loadMedia, resetPlayer, activeSource.id, globalPrefs.av1MasterStream]);

  // Preload next episode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (type !== 'movie' && hasNext && nextSeasonNumber !== undefined && nextEpisodeNumber !== undefined) {
      const checkAndPrefetchNext = () => {
        const state = usePlayerStore.getState();
        const { currentTime, duration } = state;
        if (duration > 0 && currentTime / duration > 0.8) {
          streamingOptimizer.preloadSources(tmdbId, type, nextSeasonNumber, nextEpisodeNumber, content?.title || '', playerPrefs.audioLanguage);
          clearInterval(interval);
        }
      };
      interval = setInterval(checkAndPrefetchNext, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [type, hasNext, nextSeasonNumber, nextEpisodeNumber, tmdbId, content, playerPrefs.audioLanguage]);

  const handleSourceSelect = useCallback((source: SourceItem) => {
    const isNative = ['hls', 'mp4'].includes(source.type) && !source.url.startsWith('magnet:');
    const { updateMediaSource } = usePlayerStore.getState();
    
    if (isNative) {
      setActiveSourceUrl(source.url);
      setSelectedEmbedUrl(null);
      setDirectResult({ 
        sources: [source], 
        subtitles: directResult?.subtitles || [],
        provider: source.provider
      });
      updateMediaSource(source.url);
      hasFailedNativeRef.current = false;
    } else {
      setActiveSourceUrl('');
      setSelectedEmbedUrl(source.url);
      setDirectResult(null);
      updateMediaSource(source.url);
    }
  }, [directResult?.subtitles]);

  const handleNativeError = useCallback((error: unknown) => {
    if (hasFailedNativeRef.current) return;
    console.warn('[NovaStream] Native failover triggered. Falling back to next source or embed.', error);
    hasFailedNativeRef.current = true;
    
    const currentIdx = allSources.findIndex(s => s.url === activeSourceUrl);
    
    setDirectResult(null);
    setActiveSourceUrl('');
    
    if (allSources.length > 1 && currentIdx !== -1 && currentIdx < allSources.length - 1) {
      handleSourceSelect(allSources[currentIdx + 1]);
      return false; // Indicating handled
    }
    return true; // Indicating needs source switcher
  }, [allSources, activeSourceUrl, handleSourceSelect]);

  return {
    src,
    isNativeSource,
    allSources,
    directResult,
    activeSourceUrl,
    isFetchingMalId,
    hasFailedNative: hasFailedNativeRef.current,
    handleSourceSelect,
    handleNativeError,
    cycleToNextSource
  };
}
