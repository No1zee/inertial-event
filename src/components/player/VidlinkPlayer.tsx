'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { SanctumAmbiance } from './SanctumAmbiance';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, ShieldCheck, Users } from 'lucide-react';
import { useUserPreferencesStore, useActiveSource, usePlayerPreferences } from '@/lib/stores/preferencesStore';
import NativePlayer from './NativePlayer';
import { streamingOptimizer } from '@/services/streamingOptimizer';
import { CinematicEndCredits } from './CinematicEndCredits';
import SourceSwitcher from './overlay/SourceSwitcher';
import { usePlayerStore } from '@/store/playerStore';
import { AutoNextHandler } from './AutoNextHandler';
import { cn } from '@/lib/utils';
import StillWatchingOverlay from './overlay/StillWatchingOverlay';
import { EpisodeNavigator } from '../content/EpisodeNavigator';
import { LoungeOverlay } from '../social/LoungeOverlay';
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
}: VidlinkPlayerProps) {
  const router = useRouter();
  const addToHistory = useLocalDataStore(state => state.addToWatchHistory);
  const activeSource = useActiveSource();
  const cycleToNextSource = useUserPreferencesStore(state => state.cycleToNextSource);
  const playerPrefs = usePlayerPreferences();
  const { setPlayerState, resetPlayer } = usePlayerStore();

  const [animeEndpoint, setAnimeEndpoint] = useState<string | null>(null);
  const [isFetchingMalId, setIsFetchingMalId] = useState<boolean>(type === 'anime');
  const [playerReady, setPlayerReady] = useState(false);
  const [allSources, setAllSources] = useState<SourceItem[]>([]);
  const [activeSourceUrl, setActiveSourceUrl] = useState<string>('');
  const [preloadPath, setPreloadPath] = useState<string | null>(null);
  const [directResult, setDirectResult] = useState<DirectSource | null>(null);
  const [showSourceSwitcher, setShowSourceSwitcher] = useState(false);
  const [showStillWatching, setShowStillWatching] = useState(false);
  const [showEpisodeNavigator, setShowEpisodeNavigator] = useState(false);
  const [showLounge, setShowLounge] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);
  const [consecutiveEpisodes, setConsecutiveEpisodes] = useState(0);
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

  const nextEpisodeNumber = Number(episode || 1) + 1;

  const onWebviewRef = useCallback(
    (wv: HTMLWebViewElement | null) => {
      if (!wv || webviewRef.current === wv) return;
      webviewRef.current = wv as unknown as ElectronWebView;

      const handleDomReady = () => {
        setPlayerReady(true);
        const resumeData = useLocalDataStore.getState().getResumeData(tmdbId);
        if (resumeData && resumeData.currentTime > 0) {
          (wv as ElectronWebView)
            .executeJavaScript(
              `
                    const video = document.querySelector('video');
                    if (video) video.currentTime = ${resumeData.currentTime};
                `
            )
            .catch((err: Error) => console.warn('[MaiWatch] Failed to set resume time:', err));
        }
      };

      const handleIpcMessage = (event: Event) => {
        const electronEvent = event as WebviewIpcEvent;
        const channel = electronEvent.channel;
        const data = electronEvent.args?.[0] as Record<string, unknown> | undefined;

        if (channel === 'video-ended') {
          if (!transitionTriggeredRef.current) {
            transitionTriggeredRef.current = true;
            onNextRef.current?.();
          }
        } else if (channel === 'AG_UPDATE' && data) {
          const { currentTime, duration } = data as { currentTime: number; duration: number };
          if (content && currentTime > 0) {
            setPlayerState({ currentTime, duration });
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
        } else if (channel === 'AG_SOURCE_FOUND' && data) {
          const { url, type: sourceType } = data as { url: string; type: string };
          if (!hasFailedNativeRef.current) {
            console.log('[Aegis] Intercepted direct source from webview:', url);
            setActiveSourceUrl(url);
            setDirectResult({
              sources: [{ 
                url, 
                type: (sourceType === 'hls' ? 'hls' : 'mp4') as 'hls' | 'mp4', 
                provider: 'Aegis (Intercept)',
                quality: 'auto'
              }],
              subtitles: directResult?.subtitles || []
            });
          }
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
    [tmdbId, content, addToHistory, type, season, episode, setPlayerState]
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
      }
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
    setPlayerReady(false);
    setDirectResult(null);
    setAllSources([]);
    setActiveSourceUrl('');
    setShowSourceSwitcher(false);
    transitionTriggeredRef.current = false;
    hasFailedNativeRef.current = false;
    setConsecutiveEpisodes(prev => prev + 1);
    resetPlayer();
  }, [activeSource.id, tmdbId, season, episode, type, resetPlayer]);

  useEffect(() => {
    const checkAndPrefetchNext = async () => {
      const { currentTime, duration } = usePlayerStore.getState();
      if (type !== 'movie' && hasNext && duration > 0 && currentTime / duration > 0.8) {
        streamingOptimizer.preloadSources(tmdbId, type, Number(season), nextEpisodeNumber, content?.title || '', playerPrefs.audioLanguage);
      }
    };
    const interval = setInterval(checkAndPrefetchNext, 10000);
    return () => clearInterval(interval);
  }, [type, hasNext, season, nextEpisodeNumber, tmdbId, content?.title, playerPrefs.audioLanguage]);

  const handleToggleSource = useCallback(() => {
    if (allSources.length > 0) setShowSourceSwitcher(prev => !prev);
    else cycleToNextSource();
  }, [allSources, cycleToNextSource]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vidlink.pro')) return;
      if (event.data?.type === 'PLAYER_EVENT') {
        const typedData = event.data as VidlinkEvent;
        const { event: eventType, currentTime, duration } = typedData.data;
        if (eventType === 'ready') setPlayerReady(true);
        if (content && (eventType === 'timeupdate' || eventType === 'pause' || eventType === 'ended')) {
          setPlayerState({ currentTime, duration, isPaused: eventType === 'pause' });
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
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [content, type, season, episode, addToHistory, tmdbId, setPlayerState, hasNext, handleNextEpisode]);

  const handleSourceSelect = useCallback((source: SourceItem) => {
    setActiveSourceUrl(source.url);
    if (source.type === 'hls' || source.type === 'mp4') {
      setDirectResult({ sources: [source], subtitles: directResult?.subtitles || [] });
    } else {
      setDirectResult(null);
    }
    setShowSourceSwitcher(false);
  }, [directResult?.subtitles]);

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

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col group-player">
      <div className={cn("absolute top-0 left-0 right-0 p-8 z-50 flex items-center justify-between transition-opacity duration-500", playerReady ? "opacity-0 group-hover-player:opacity-100" : "opacity-100")}>
        <button onClick={handleBack} className="flex items-center gap-3 text-white/70 hover:text-white transition-all hover:scale-105 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
          <ChevronLeft size={24} />
          <span className="font-medium text-lg">Back</span>
        </button>
        <div className="flex items-center gap-4">
          {(type === 'tv' || type === 'anime') && (
            <button onClick={() => setShowEpisodeNavigator(true)} className="flex items-center gap-3 text-white/70 hover:text-white transition-all hover:scale-105 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
              <span className="font-black uppercase italic tracking-tighter text-lg">Log</span>
            </button>
          )}
          {(type === 'tv' || type === 'anime') && (
            <button onClick={() => setShowLounge(true)} className="flex items-center gap-3 text-white/70 hover:text-white transition-all hover:scale-105 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
               <Users size={20} className="text-primary" />
               <span className="font-black uppercase italic tracking-tighter text-lg">Lounge</span>
            </button>
          )}
          <AnimatePresence>
          {directResult && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-md">
              <ShieldCheck size={20} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Direct Source</span>
                <span className="text-xs font-bold uppercase tracking-tighter text-white">Master Quality</span>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full relative">
        <SanctumAmbiance src={content?.backdrop || content?.poster || null} />
        {/* NATIVE PLAYER: Only render if we have a direct stream URL. If not, show hydrating state. */}
        {(activeSourceUrl || directResult?.sources?.[0]?.url) ? (
          <div className="w-full h-full relative z-10 flex items-center justify-center">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl">
                <Loader2 className="w-16 h-16 text-brand-primary animate-spin mb-6" />
                <PretextHeadline text="INITIALIZING STREAM" className="text-2xl font-bold tracking-tighter" />
              </div>
            ) : (
              <webview
                ref={onWebviewRef}
                src={src}
                preload={preloadPath || undefined}
                className="w-full h-full"
                allowFullScreen
                webpreferences="contextIsolation=no, nodeIntegration=no"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              />
            )}
          </div>
        )}

        {(onNext || onPrev) && (
          <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between px-8 opacity-0 group-hover-player:opacity-100 transition-opacity duration-500 pointer-events-none z-50">
            <button title="Previous" onClick={onPrev} disabled={!hasPrev} className={cn('p-6 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white transition-all pointer-events-auto', hasPrev ? 'hover:bg-white hover:text-black hover:scale-110 shadow-2xl' : 'opacity-20 cursor-not-allowed')}>
              <ChevronLeft size={32} strokeWidth={3} />
            </button>
            <button title="Next" onClick={onNext} disabled={!hasNext} className={cn('p-6 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white transition-all pointer-events-auto', hasNext ? 'hover:bg-white hover:text-black hover:scale-110 shadow-2xl' : 'opacity-20 cursor-not-allowed')}>
              <ChevronRight size={32} strokeWidth={3} />
            </button>
          </div>
        )}
      </motion.div>

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
      
      {(type === 'tv' || type === 'anime') && content?.seasonsList && (
        <EpisodeNavigator 
          show={showEpisodeNavigator}
          onClose={() => setShowEpisodeNavigator(false)}
          tmdbId={tmdbId}
          type={type}
          currentSeason={Number(season)}
          currentEpisode={Number(episode)}
          onSelect={(s, e) => {
            setShowEpisodeNavigator(false);
            router.push(`/watch?id=${tmdbId}&type=${type}&season=${s}&episode=${e}${activeSource.id ? `&provider=${activeSource.id}` : ''}`);
          }}
          seasons={content.seasonsList}
        />
      )}

      <AutoNextHandler type={type} hasNext={hasNext || false} onNext={handleNextEpisode} />
      <LoungeOverlay show={showLounge} onClose={() => setShowLounge(false)} roomUrl={typeof window !== 'undefined' ? window.location.href : ''} />
    </div>
  );
}
