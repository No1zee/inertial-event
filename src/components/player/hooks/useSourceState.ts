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
  initialSource?: string | null;
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
  initialSource,
}: UseSourceStateProps) {
  const globalPrefs = useLocalDataStore(state => state.globalPreferences);
  const activeSource = useActiveSource();
  const cycleToNextSource = useUserPreferencesStore(state => state.cycleToNextSource);
  const playerPrefs = usePlayerPreferences();
  const { resetPlayer, loadMedia } = usePlayerActions();

  const [animeEndpoint, setAnimeEndpoint] = useState<string | null>(null);
  const [isFetchingMalId, setIsFetchingMalId] = useState<boolean>(type === 'anime');
  const [allSources, setAllSources] = useState<SourceItem[]>([]);
  const [activeSourceUrl, setActiveSourceUrl] = useState<string>(initialSource || '');
  const [directResult, setDirectResult] = useState<DirectSource | null>(initialSource ? {
    sources: [{ url: initialSource, type: initialSource.startsWith('magnet:') ? 'magnet' : 'mp4' }],
    provider: 'Direct Source'
  } : null);
  const [selectedEmbedUrl, setSelectedEmbedUrl] = useState<string | null>(null);
  
  const [hasFailedNative, setHasFailedNative] = useState<boolean>(false);
  const [isSearchingSources, setIsSearchingSources] = useState<boolean>(false);

  // Reset identity-linked state when content changes
  useEffect(() => {
    console.log('[VidlinkPlayer] Identity Change Detected - Resetting source state');
    setSelectedEmbedUrl(null);
    setActiveSourceUrl(initialSource || '');
    setIsSearchingSources(false);
    if (initialSource) {
      setDirectResult({
        sources: [{ url: initialSource, type: initialSource.startsWith('magnet:') ? 'magnet' : 'mp4' }],
        provider: 'Direct Source'
      });
    } else {
      setDirectResult(null);
    }
    setAllSources([]);
    setHasFailedNative(false);
  }, [tmdbId, season, episode, type, initialSource]);

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
    if (selectedEmbedUrl) {
      console.log('[useSourceState] Force Embed Mode: Selected Embed URL is set');
      return false;
    }
    
    // 0. Check initial source (for direct magnet/URL playback)
    if (initialSource) {
      if (initialSource.startsWith('magnet:') || 
          initialSource.includes('.m3u8') || 
          initialSource.includes('.mp4')) {
        console.log('[useSourceState] Native Detection: Initial Source matches native pattern');
        return true;
      }
    }
    
    // 1. Explicitly check the directResult source type if available (high confidence)
    if (directResult?.sources?.[0]) {
      const type = directResult.sources[0].type;
      if (['hls', 'mp4', 'torrent', 'magnet'].includes(type)) {
        console.log(`[useSourceState] Native Detection: directResult type "${type}" is native`);
        return true;
      }
      if (type === 'embed') {
        console.log('[useSourceState] Native Detection: directResult type is explicitly "embed"');
        return false;
      }
    }

    const url = activeSourceUrl || directResult?.sources?.[0]?.url;
    if (!url) {
      console.log('[useSourceState] Native Detection: No URL available for detection');
      return false;
    }
    
    // 2. Format-based detection (medium confidence)
    const isMagnet = url.startsWith('magnet:');
    const isDirectStream = /\.(m3u8|mp4|mkv|webm|avi|mov|ts|m4s)(\?|$)/i.test(url);
                     
    // 3. Localhost/127.0.0.1 URLs are always native (torrent stream server)
    const isLocalStream = url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:');
                                  
    const result = isMagnet || isDirectStream || isLocalStream;
    
    if (result) {
      console.log(`[useSourceState] Native Detection: URL pattern match (Magnet/Direct/Local) for ${url.substring(0, 50)}...`);
    } else {
      console.log(`[useSourceState] Native Detection: No native patterns found in URL: ${url.substring(0, 50)}...`);
    }

    return result;
  }, [selectedEmbedUrl, activeSourceUrl, directResult, initialSource]);

  const isYouTubeSource = useMemo(() => {
    const url = src?.toLowerCase() || '';
    return url.includes('youtube.com') || url.includes('youtu.be');
  }, [src]);

  // Main synchronization and preloading logic
  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;

    const syncMediaState = async () => {
      setHasFailedNative(false);
      
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

      if (isCancelled) return;

      const key = streamingOptimizer.getPreloadKey(tmdbId, type, Number(season), Number(episode));
      const cached = streamingOptimizer.getPreloaded(key);

      if (cached && cached.sources.length > 0) {
        console.log(`[useSourceState] Using cached sources (${cached.sources.length})`, cached.sources);
        if (isCancelled) return;

        setAllSources(cached.sources as SourceItem[]);
        setDirectResult(cached as DirectSource);
        
        const nativeSources = cached.sources.filter(s => 
          ['hls', 'mp4', 'torrent', 'magnet', 'yts', 'webtorrent'].includes(s.type) || s.url.startsWith('magnet:')
        );
        
        if (nativeSources.length > 0) {
          setActiveSourceUrl(nativeSources[0].url);
        } else {
          setActiveSourceUrl(cached.sources[0].url);
        }
        return;
      }

      if (src) {
        if (!initialSource) {
          setDirectResult(null);
          setAllSources([]);
          setActiveSourceUrl('');
        }

        const sanitizedId = String(tmdbId).replace('tmdb_', '');
        setIsSearchingSources(true);
        
        try {
          const result = await streamingOptimizer.preloadSources(
            sanitizedId, 
            type, 
            Number(season), 
            Number(episode), 
            content?.title || '', 
            playerPrefs.audioLanguage
          );

          if (isCancelled) return;
          setIsSearchingSources(false);
          
          if (result && result.sources.length > 0) {
            console.log(`[useSourceState] Sources discovered:`, result.sources.map(s => `${s.type}:${s.provider}`));
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
              ['hls', 'mp4', 'torrent', 'magnet', 'yts', 'webtorrent'].includes(s.type) || s.url.startsWith('magnet:')
            );
            
            if (nativeSources.length > 0) {
              // FIX: Reset hasFailedNative so NativePlayer can mount with the real source
              setHasFailedNative(false);
              setDirectResult({ ...result, sources: nativeSources } as DirectSource);
              if (initialSource) {
                setActiveSourceUrl(initialSource);
              } else {
                setActiveSourceUrl(nativeSources[0].url);
              }
            } else if (initialSource) {
              setActiveSourceUrl(initialSource);
            } else {
              if (prioritizedSources.length > 0) {
                setActiveSourceUrl(prioritizedSources[0].url);
              }
            }
          } else if (!initialSource) {
            // If backend returns no sources, and we don't have a direct override, clear it
            setActiveSourceUrl('');
          }
        } catch (err) {
          console.error('[useSourceState] Error during source discovery:', err);
          if (!isCancelled) setIsSearchingSources(false);
        }
      }
    };

    syncMediaState();

    return () => {
      isCancelled = true;
      controller.abort();
    };
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
    const isNative = ['hls', 'mp4', 'torrent', 'magnet'].includes(source.type) || source.url.startsWith('magnet:');
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
      setHasFailedNative(false);
    } else {
      setActiveSourceUrl('');
      setSelectedEmbedUrl(source.url);
      setDirectResult(null);
      updateMediaSource(source.url);
    }
  }, [directResult?.subtitles]);

  const handleNativeError = useCallback((error: unknown) => {
    console.warn('[NovaStream] Native source error:', error);
    
    const currentIdx = allSources.findIndex(s => s.url === activeSourceUrl);
    const nextSource = allSources[currentIdx + 1];

    if (nextSource) {
      console.log(`[NovaStream] Attempting next available source: ${nextSource.provider} (${nextSource.type})`);
      handleSourceSelect(nextSource);
      return false; // Handled internally
    }

    // Only if we've exhausted ALL sources do we permanently fail over to embed/error
    if (!hasFailedNative) {
      console.error('[NovaStream] All sources exhausted. Falling back to global failover.');
      setHasFailedNative(true);
      setDirectResult(null);
      setActiveSourceUrl('');
    }
    
    return true; // Indicating needs user intervention or global fallback
  }, [allSources, activeSourceUrl, handleSourceSelect, hasFailedNative]);

  return {
    src,
    isNativeSource,
    allSources,
    directResult,
    activeSourceUrl,
    isFetchingMalId,
    hasFailedNative,
    isSearchingSources,
    isYouTubeSource,
    handleSourceSelect,
    handleNativeError,
    cycleToNextSource
  };
}
