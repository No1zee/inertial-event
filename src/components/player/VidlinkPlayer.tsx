'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalDataStore } from '@/lib/stores/localDataStore';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserPreferencesStore, useActiveSource, usePlayerPreferences } from '@/lib/stores/preferencesStore';
import NativePlayer from './NativePlayer';
import { streamingOptimizer } from '@/services/streamingOptimizer';
import { aegisShield } from '@/services/AegisShield';
import { CinematicEndCredits } from './CinematicEndCredits';
import SourceSwitcher from './overlay/SourceSwitcher';
import { usePlayerActions, usePlayerStore } from '@/lib/stores/playerStore';

import { cn } from '@/lib/utils';
import StillWatchingOverlay from './overlay/StillWatchingOverlay';

import { Content } from '@/lib/types/content';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import '@/types/electron.d';

interface VidlinkPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv' | 'anime';
  season?: string | number;
  episode?: string | number;
  content?: Content;
  onNext?: () => void;
  onPrev?: () => void;
  onBack?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  showUI?: boolean;
}

interface VidlinkEvent {
  type: string;
  data: {
    event: string;
    currentTime: number;
    duration: number;
  };
}

interface WebviewIpcEvent extends Event {
  channel: string;
  args: unknown[];
}

interface ElectronWebView extends HTMLWebViewElement {
  executeJavaScript(script: string): Promise<unknown>;
}

interface SourceItem {
  url: string;
  type: string;
  quality?: string;
  provider?: string;
}

interface DirectSource {
  sources: SourceItem[];
  provider?: string;
  subtitles?: {
    url: string;
    label?: string;
    lang: string;
  }[];
}

export function VidlinkPlayer({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  content,
  onNext,
  onPrev,
  onBack,
  hasNext,
  hasPrev,
  showUI = true,
}: VidlinkPlayerProps) {
  const router = useRouter();
  const addToHistory = useLocalDataStore(state => state.addToWatchHistory);
  const activeSource = useActiveSource();
  const cycleToNextSource = useUserPreferencesStore(state => state.cycleToNextSource);
  const playerPrefs = usePlayerPreferences();
  const { setCurrentTime, setDuration, setPlaying, resetPlayer, loadMedia } = usePlayerActions();

  const [animeEndpoint, setAnimeEndpoint] = useState<string | null>(null);
  const [isFetchingMalId, setIsFetchingMalId] = useState<boolean>(type === 'anime');
  const [playerReady, setPlayerReady] = useState(false);
  const [allSources, setAllSources] = useState<SourceItem[]>([]);
  const [activeSourceUrl, setActiveSourceUrl] = useState<string>('');
  const [preloadPath, setPreloadPath] = useState<string | null>(null);
  const [directResult, setDirectResult] = useState<DirectSource | null>(null);
  const [showSourceSwitcher, setShowSourceSwitcher] = useState(false);
  const [showStillWatching, setShowStillWatching] = useState(false);

  const [initialProgress, setInitialProgress] = useState(0);
  const [consecutiveEpisodes, setConsecutiveEpisodes] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const transitionTriggeredRef = useRef(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const hasFailedNativeRef = useRef<boolean>(false);

  const webviewRef = useRef<ElectronWebView | null>(null);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);
  useEffect(() => {
    onPrevRef.current = onPrev;
  }, [onPrev]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  }, [onBack]);

  const handleNextEpisode = useCallback(() => {
    setConsecutiveEpisodes(prev => prev + 1);
    if (onNext) onNext();
  }, [onNext]);

  const handleCancelTransition = useCallback(() => {
    // Transition cancel logic
  }, []);

  const { nextSeasonNumber, nextEpisodeNumber } = useMemo(() => {
    if (type === 'movie') return { nextSeasonNumber: 1, nextEpisodeNumber: 1 };
    
    const s = Number(season);
    const e = Number(episode);
    
    // Boundary-aware logic for prefetching and internal state
    const totalSeasons = content?.seasons || content?.seasonsList?.length || 0;
    const currentSeasonMeta = content?.seasonsList?.find(m => m.season_number === s);
    
    if (currentSeasonMeta && e >= currentSeasonMeta.episode_count) {
      if (s < totalSeasons) {
        return { nextSeasonNumber: s + 1, nextEpisodeNumber: 1 };
      }
    }
    
    return { nextSeasonNumber: s, nextEpisodeNumber: e + 1 };
  }, [type, season, episode, content]);

  const handleIpcMessage = useCallback((event: Event) => {
    const electronEvent = event as WebviewIpcEvent;
    const channel = electronEvent.channel;
    const data = electronEvent.args?.[0] as Record<string, unknown> | undefined;

    if (channel === 'video-ended' || channel === 'AG_ENDED') {
      if (!transitionTriggeredRef.current) {
        transitionTriggeredRef.current = true;
        onNextRef.current?.();
      }
    } else if (channel === 'AG_UPDATE' && data) {
      const { currentTime, duration } = data as { currentTime: number; duration: number };
      if (content && currentTime > 0) {
        setCurrentTime(currentTime);
        setDuration(duration);
        addToHistory({
          contentId: tmdbId,
          type,
          title: content.title || 'Untitled',
          poster: content.poster || '',
          backdrop: content.backdrop || '',
          currentTime,
          duration,
          season: type !== 'movie' ? Number(season) : undefined,
          episode: type !== 'movie' ? Number(episode) : undefined,
        });
      }
    }
  }, [tmdbId, type, content, season, episode, setCurrentTime, setDuration, addToHistory]);


  const onWebviewRef = useCallback(
    (wv: HTMLWebViewElement | null) => {
      if (!wv || webviewRef.current === wv) return;
      webviewRef.current = wv as unknown as ElectronWebView;

      const handleDomReady = () => {
        setPlayerReady(true);
        if (initialProgress > 0) {
          (wv as ElectronWebView)
            .executeJavaScript(
              `
                    const video = document.querySelector('video');
                    if (video) video.currentTime = ${initialProgress};
                `
            )
            .catch((err: Error) => console.warn('[MaiWatch] Failed to set resume time:', err));
        }
      };

      const handleConsoleMessage = (e: { message: string }) => {
        console.log(`[Webview Console] ${e.message}`);
      };

      const handleFailLoad = (e: { errorCode: number; errorDescription: string }) => {
        console.warn(`[Webview Error] Failed to load: ${e.errorCode} ${e.errorDescription}`);
      };

      wv.addEventListener('dom-ready', handleDomReady);
      wv.addEventListener('console-message', handleConsoleMessage as unknown as EventListener);
      wv.addEventListener('did-fail-load', handleFailLoad as unknown as EventListener);
      wv.addEventListener('ipc-message', handleIpcMessage as unknown as EventListener);
    },
    [initialProgress, handleIpcMessage]
  );

  useEffect(() => {
    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateInteraction);
    window.addEventListener('keydown', updateInteraction);
    window.addEventListener('mousedown', updateInteraction);
    window.addEventListener('touchstart', updateInteraction);

    return () => {
      window.removeEventListener('mousemove', updateInteraction);
      window.removeEventListener('keydown', updateInteraction);
      window.removeEventListener('mousedown', updateInteraction);
      window.removeEventListener('touchstart', updateInteraction);
    };
  }, []);

  useEffect(() => {
    if (showStillWatching || type === 'movie') return;

    const checkStillWatching = () => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      const thirtyMinsInMs = 30 * 60 * 1000;
      const twoHoursInMs = 2 * 60 * 60 * 1000;

      if (timeSinceLastInteraction > twoHoursInMs || (timeSinceLastInteraction > thirtyMinsInMs && consecutiveEpisodes >= 2)) {
        setShowStillWatching(true);
        if (webviewRef.current) {
          webviewRef.current.executeJavaScript('document.querySelector("video")?.pause()');
        }
      }
    };

    const interval = setInterval(checkStillWatching, 60000);
    return () => clearInterval(interval);
  }, [showStillWatching, consecutiveEpisodes, type]);

  const handleContinueWatching = () => {
    setShowStillWatching(false);
    setConsecutiveEpisodes(0);
    lastInteractionRef.current = Date.now();
    if (webviewRef.current) {
      webviewRef.current.executeJavaScript('document.querySelector("video")?.play()');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('get-player-preload-path').then((path: unknown) => {
        if (typeof path === 'string') setPreloadPath(path);
      });
    }
  }, []);

  const handleNativeError = useCallback((error: unknown) => {
    if (hasFailedNativeRef.current) return;
    console.warn('[MaiWatch] Native failover triggered.', error);
    hasFailedNativeRef.current = true;
    setDirectResult(null);
  }, []);

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

  const getResumeData = useLocalDataStore(state => state.getResumeData);

  useEffect(() => {
    const resume = getResumeData(tmdbId);
    if (resume && !resume.completed) {
      if (type === 'movie' || (resume.season === Number(season) && resume.episode === Number(episode))) {
        setInitialProgress(resume.currentTime);
      } else {
        setInitialProgress(0); // Reset for new episodes
      }
    } else {
      setInitialProgress(0);
    }
  }, [tmdbId, season, episode, type, getResumeData]);

  const memoizedUrl = useMemo(() => {
    const baseUrl = activeSource.baseUrl;
    if (activeSource.id === 'vidlink') {
      let endpoint = '';
      if (type === 'movie') endpoint = `/movie/${tmdbId}`;
      else if (type === 'tv') endpoint = `/tv/${tmdbId}/${season}/${episode}`;
      else if (type === 'anime') endpoint = animeEndpoint || `/tv/${tmdbId}/${season}/${episode}`;

      const params: Record<string, string> = {
        primaryColor: 'c0392b',
        secondaryColor: '1a1a1a',
        iconColor: 'ffffff',
        autoplay: 'true',
        nextbutton: 'true',
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

  const src = activeSourceUrl || memoizedUrl;

  useEffect(() => {
    const preloadContent = async () => {
      const result = await streamingOptimizer.preloadSources(tmdbId, type, Number(season), Number(episode), content?.title || '', playerPrefs.audioLanguage);
      if (result && result.sources.length > 0) {
        setAllSources(result.sources as SourceItem[]);
        const nativeSources = result.sources.filter(s => s.type === 'hls' || s.type === 'mp4');
        if (nativeSources.length > 0) {
          setPlayerReady(true);
          setDirectResult(result as DirectSource);
          setActiveSourceUrl(nativeSources[0].url);
        }
      }
    };

    if (src) preloadContent();
  }, [tmdbId, season, episode, type, activeSource.id, src, content?.title, playerPrefs.audioLanguage]);

  useEffect(() => {
    // SEAMLESS TRANSITION ENGINE (Feature 11)
    // Instead of a destructive reset, we check if the next segment is already optimized.
    const key = streamingOptimizer.getPreloadKey(tmdbId, type, Number(season), Number(episode));
    const cached = streamingOptimizer.getPreloaded(key);

    if (cached && cached.sources.length > 0) {
      console.log('[MaiWatch] Seamless transition: Using preloaded direct source for', key);
      setAllSources(cached.sources as SourceItem[]);
      setDirectResult(cached as DirectSource);
      const nativeSources = cached.sources.filter(s => s.type === 'hls' || s.type === 'mp4');
      if (nativeSources.length > 0) {
        setActiveSourceUrl(nativeSources[0].url);
        setPlayerReady(true);
      }
    } else {
      setPlayerReady(false);
      setDirectResult(null);
      setAllSources([]);
      setActiveSourceUrl('');
    }

    setShowSourceSwitcher(false);
    transitionTriggeredRef.current = false;
    hasFailedNativeRef.current = false;
    setConsecutiveEpisodes(prev => prev + 1);
    resetPlayer();
  }, [activeSource.id, tmdbId, season, episode, type, resetPlayer]);

  useEffect(() => {
    aegisShield.updateCurrentSource(activeSource.id);
  }, [activeSource.id]);

  const playbackRef = useRef({ currentTime: 0, duration: 0 });
  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (state) => ({ currentTime: state.currentTime, duration: state.duration }),
      (vals) => { playbackRef.current = vals; }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const checkAndPrefetchNext = async () => {
      const { currentTime, duration } = playbackRef.current;
      if (type !== 'movie' && hasNext && duration > 0 && currentTime / duration > 0.8) {
        streamingOptimizer.preloadSources(tmdbId, type, nextSeasonNumber, nextEpisodeNumber, content?.title || '', playerPrefs.audioLanguage);
      }
    };
    const interval = setInterval(checkAndPrefetchNext, 10000);
    return () => clearInterval(interval);
  }, [type, hasNext, season, nextEpisodeNumber, tmdbId, content?.title, playerPrefs.audioLanguage]);

  const handleSourceSelect = useCallback((source: SourceItem) => {
    setActiveSourceUrl(source.url);
    if (source.type === 'hls' || source.type === 'mp4') {
      setDirectResult({ sources: [source], subtitles: directResult?.subtitles || [] });
    } else {
      setDirectResult(null);
    }
    setShowSourceSwitcher(false);
  }, [directResult?.subtitles]);

  const handleToggleSource = useCallback((recommendedSourceId?: string) => {
    if (recommendedSourceId) {
       // Find the source matching the recommendation (assuming source.url or source.provider might match, or fallback to cycle)
       const rec = allSources.find(s => s.provider === recommendedSourceId || s.url.includes(recommendedSourceId));
       if (rec) {
         handleSourceSelect(rec);
         return;
       }
    }
    if (allSources.length > 0) setShowSourceSwitcher(prev => !prev);
    else cycleToNextSource();
  }, [allSources, cycleToNextSource, handleSourceSelect]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vidlink.pro')) return;
      if (event.data?.type === 'PLAYER_EVENT') {
        const typedData = event.data as VidlinkEvent;
        const { event: eventType, currentTime, duration } = typedData.data;
        if (eventType === 'ready') setPlayerReady(true);
        if (content && (eventType === 'timeupdate' || eventType === 'pause' || eventType === 'ended')) {
          setCurrentTime(currentTime);
          setDuration(duration);
          setPlaying(eventType !== 'pause');
          addToHistory({
            contentId: tmdbId,
            type,
            title: content.title || 'Untitled',
            poster: content.poster || '',
            backdrop: content.backdrop || '',
            currentTime,
            duration,
            season: type !== 'movie' ? Number(season) : undefined,
            episode: type !== 'movie' ? Number(episode) : undefined,
          });
          if (eventType === 'ended' && type !== 'movie' && hasNext && !transitionTriggeredRef.current) {
            transitionTriggeredRef.current = true;
            handleNextEpisode();
          }
        }
      } else if (event.data?.type === 'NEXT_EPISODE') {
        console.log('[MaiWatch] VidLink Internal: Next Episode Triggered');
        if (hasNext) handleNextEpisode();
      } else if (event.data?.type === 'PREV_EPISODE') {
        console.log('[MaiWatch] VidLink Internal: Prev Episode Triggered');
        if (hasPrev && onPrevRef.current) onPrevRef.current();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [content, type, season, episode, addToHistory, tmdbId, setCurrentTime, setDuration, setPlaying, hasNext, handleNextEpisode]);

  const memoizedSubtitles = useMemo(() => 
    (directResult?.subtitles || []).map(sub => ({ 
      url: sub.url, 
      label: sub.label || sub.lang || 'Unknown', 
      language: sub.lang 
    })), 
    [directResult?.subtitles]
  );

  const memoizedCast = useMemo(() => 
    (content?.cast || []).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profilePath,
    })), 
    [content?.cast]
  );

  const handleProgress = useCallback((progress: { currentTime: number; duration: number }) => {
    if (content) {
      addToHistory({
        contentId: tmdbId,
        type,
        title: content.title || 'Untitled',
        poster: content.poster || '',
        backdrop: content.backdrop || '',
        currentTime: progress.currentTime,
        duration: progress.duration,
        season: type !== 'movie' ? Number(season) : undefined,
        episode: type !== 'movie' ? Number(episode) : undefined,
      });
    }
  }, [content, tmdbId, type, season, episode, addToHistory]);

  useEffect(() => {
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
  }, [loadMedia, tmdbId, type, content, season, episode, src]);


  if (!isHydrated) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col group-player overflow-hidden max-h-screen">
      <motion.div initial={{ opacity: 0, scale: 1 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full relative flex flex-col overflow-hidden min-h-0">
        {/* NATIVE PLAYER: Only render if we have a direct stream URL. If not, show hydrating state. */}
        {(activeSourceUrl || directResult?.sources?.[0]?.url) ? (
          <div className="w-full h-full relative z-10 flex items-center justify-center min-h-0">
            <NativePlayer
              src={activeSourceUrl || directResult?.sources?.[0]?.url || ''}
              poster={content?.poster}
              title={content?.title || 'Unknown'}
              subTitle={type !== 'movie' ? `S${season} E${episode}` : undefined}
              type={type}
              season={String(season)}
              episode={String(episode)}
              initialTime={initialProgress}
              tmdbId={tmdbId}
              subtitles={memoizedSubtitles}
              cast={memoizedCast}
              provider={directResult?.provider || (activeSourceUrl ? 'Direct Stream' : undefined)}
              onNext={onNext}
              onPrev={onPrev}
              onFatalError={handleNativeError}
              onToggleSource={handleToggleSource}
              onProgress={handleProgress}
            />
          </div>
        ) : (
          <div className="w-full h-full relative z-10">
            {isFetchingMalId || !src ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl z-20">
                <Loader2 className="w-16 h-16 text-brand-primary animate-spin mb-6" />
                <PretextHeadline text="PROCESSING STREAM" className="text-2xl font-bold tracking-tighter" />
              </div>
            ) : (
              typeof window !== 'undefined' && window.electron ? (
                <webview
                  ref={onWebviewRef}
                  src={src}
                  preload={preloadPath || undefined}
                  className="flex-1 w-full h-full"
                  allowFullScreen
                  webpreferences="contextIsolation=no, nodeIntegration=no"
                  useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                  data-testid="video-player"
                />
              ) : (
                <iframe
                  src={src}
                  className="flex-1 w-full h-full border-none"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
                  data-testid="video-player"
                />
              )
            )}
          </div>
        )}
      </motion.div>

      {/* DIRECTORIAL NAVIGATION OVERLAY (Feature 6 Fix) */}
      <AnimatePresence>
        {showUI && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-y-0 inset-x-0 z-[150] pointer-events-none flex items-center justify-between px-8"
          >
            {hasPrev && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => onPrevRef.current?.()}
                className="group pointer-events-auto p-6 bg-black/20 hover:bg-white/10 backdrop-blur-2xl rounded-full border border-white/5 transition-all active:scale-90"
                aria-label="Previous Episode"
              >
                <ChevronLeft size={48} className="text-white/20 group-hover:text-white transition-colors" strokeWidth={1} />
              </motion.button>
            )}

            <div className="flex-1" />

            {hasNext && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => handleNextEpisode()}
                className="group pointer-events-auto p-6 bg-black/20 hover:bg-white/10 backdrop-blur-2xl rounded-full border border-white/5 transition-all active:scale-90"
                aria-label="Next Episode"
              >
                <ChevronRight size={48} className="text-white/20 group-hover:text-white transition-colors" strokeWidth={1} />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {type !== 'movie' && hasNext && (
        <CinematicEndCredits
          contentId={tmdbId}
          type={type}
          season={Number(season)}
          nextEpisode={nextEpisodeNumber}
          hasNext={hasNext}
          onNext={handleNextEpisode}
          onCancel={handleCancelTransition}
        />
      )}

      <SourceSwitcher show={showSourceSwitcher} sources={allSources} activeSourceUrl={activeSourceUrl} onSelect={handleSourceSelect} onClose={() => setShowSourceSwitcher(false)} />
      <StillWatchingOverlay show={showStillWatching} onContinue={handleContinueWatching} onExit={handleBack} />
      

    </div>
  );
}
