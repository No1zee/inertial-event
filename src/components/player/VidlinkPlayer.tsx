'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useUserPreferencesStore, useActiveSource, usePlayerPreferences } from '@/lib/stores/preferencesStore';
import NativePlayer from './NativePlayer';
import { useUIStore } from '@/lib/stores/uiStore';
import { useStillWatching } from './hooks/useStillWatching';
import { shallow } from 'zustand/shallow';
import { Content } from '@/lib/types/content';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { aegisShield } from '@/services/AegisShield';
import '@/types/electron.d';

import { useSourceState } from './hooks/useSourceState';
import { WebViewBridge } from './WebViewBridge';
import { OverlayContainer } from './overlay/OverlayContainer';

interface VidlinkPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  season?: string | number;
  episode?: string | number;
  content?: Content;
  onNext?: () => void;
  onPrev?: () => void;
  onBack?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  showUI?: boolean;
  onSeasonChange?: (s: number) => void;
  onEpisodeChange?: (e: string) => void;
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
  onSeasonChange,
  onEpisodeChange,
  showUI = true,
}: VidlinkPlayerProps) {
  if (!tmdbId || tmdbId === 'NaN' || isNaN(Number(String(tmdbId).replace('tmdb_', '')))) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-12">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mb-6" />
        <PretextHeadline text="UNABLE TO LOAD" fontSize={10} fontWeight={900} letterSpacing="0.4em" className="text-zinc-500 mb-4" />
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Playback Interrupted</h2>
        <p className="text-zinc-500 mb-12 max-w-md text-center leading-relaxed">
          We encountered an issue identifying this title. Please try returning to the home screen to refresh your session.
        </p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="h-14 px-10 bg-white text-black rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Return Home
        </button>
      </div>
    );
  }

  const addToHistory = useLocalDataStore(state => state.addToWatchHistory);
  const getResumeData = useLocalDataStore(state => state.getResumeData);
  const globalPrefs = useLocalDataStore(state => state.globalPreferences);
  const activeSource = useActiveSource();
  const playerPrefs = usePlayerPreferences();
  const visualBoost = useUIStore(state => state.visualBoost, shallow);

  const [isHydrated, setIsHydrated] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);
  const [showSourceSwitcher, setShowSourceSwitcher] = useState(false);
  const [discoveredSource, setDiscoveredSource] = useState<{ url: string; type: string } | null>(null);
  const [consecutiveEpisodes, setConsecutiveEpisodes] = useState(0);

  const lastInteractionRef = useRef<number>(Date.now());
  const playbackRef = useRef({ currentTime: 0, duration: 0 });

  const { 
    showStillWatching, 
    checkStillWatching, 
    handleContinueWatching: originalHandleContinueWatching,
    resetConsecutiveAutoplays 
  } = useStillWatching();

  useEffect(() => setIsHydrated(true), []);

  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (state) => ({ currentTime: state.currentTime, duration: state.duration }),
      (vals) => { playbackRef.current = vals; }
    );
    return unsub;
  }, []);

  useEffect(() => {
    setConsecutiveEpisodes(0);
  }, [tmdbId, season, episode, type]);

  const { nextSeasonNumber, nextEpisodeNumber } = useMemo(() => {
    if (type === 'movie') return { nextSeasonNumber: 1, nextEpisodeNumber: 1 };
    const s = Number(season);
    const e = Number(episode);
    const totalSeasons = content?.seasons || content?.seasonsList?.length || 0;
    const currentSeasonMeta = content?.seasonsList?.find(m => m.season_number === s);
    
    if (currentSeasonMeta && e >= currentSeasonMeta.episode_count) {
      if (s < totalSeasons) {
        return { nextSeasonNumber: s + 1, nextEpisodeNumber: 1 };
      }
    }
    return { nextSeasonNumber: s, nextEpisodeNumber: e + 1 };
  }, [type, season, episode, content]);

  const {
    src,
    isNativeSource,
    allSources,
    directResult,
    activeSourceUrl,
    isFetchingMalId,
    hasFailedNative,
    handleSourceSelect,
    handleNativeError,
    cycleToNextSource
  } = useSourceState({
    tmdbId,
    type,
    season,
    episode,
    content,
    nextSeasonNumber,
    nextEpisodeNumber,
    hasNext
  });

  const [dynamicResumeTime, setDynamicResumeTime] = useState(0);

  useEffect(() => {
    const resume = getResumeData(tmdbId);
    const time = (resume && !resume.completed) ? resume.currentTime : 0;
    setDynamicResumeTime(time);
    setInitialProgress(time);
  }, [tmdbId, season, episode, type, getResumeData]);

  // Update dynamicResumeTime when source changes to ensure the next source starts where we left off
  useEffect(() => {
    if (src) {
      const currentTime = usePlayerStore.getState().currentTime;
      if (currentTime > 0) {
        setDynamicResumeTime(currentTime);
      }
    }
  }, [src]);

  useEffect(() => {
    aegisShield.updateCurrentSource(activeSource.id);
  }, [activeSource.id]);

  const handleNextEpisode = useCallback(() => {
    setConsecutiveEpisodes(prev => prev + 1);
    
    // Check if we should show "Are you still watching?" before continuing
    const shouldStop = checkStillWatching(() => {
      window.dispatchEvent(new CustomEvent('AG_PLAYER_COMMAND', { detail: { action: 'pause' } }));
    });

    if (!shouldStop && onNext) {
      onNext();
    }
  }, [onNext, checkStillWatching]);

  const handleToggleSource = useCallback((recommendedSourceId?: string) => {
    if (recommendedSourceId) {
       const rec = allSources.find(s => s.provider === recommendedSourceId || s.url?.includes(recommendedSourceId));
       if (rec) {
         handleSourceSelect(rec);
         return;
       }
    }
    if (allSources.length > 0) setShowSourceSwitcher(prev => !prev);
    else cycleToNextSource();
  }, [allSources, cycleToNextSource, handleSourceSelect]);

  const lastHistoryUpdateRef = useRef<number>(0);

  const updateHistory = useCallback((currentTime: number, duration: number, completed = false) => {
    if (!content) return;
    
    // Throttle history updates to once every 10 seconds, unless completed
    const now = Date.now();
    if (!completed && now - lastHistoryUpdateRef.current < 10000) {
      return;
    }
    lastHistoryUpdateRef.current = now;

    addToHistory({
      contentId: tmdbId,
      type,
      title: content.title || 'Untitled',
      poster: content.poster || '',
      backdrop: content.backdrop || '',
      currentTime: completed ? duration : currentTime,
      duration: duration || 100,
      season: type !== 'movie' ? Number(season) : undefined,
      episode: type !== 'movie' ? Number(episode) : undefined,
      nextSeason: nextSeasonNumber,
      nextEpisode: nextEpisodeNumber,
    });
  }, [content, tmdbId, type, season, episode, nextSeasonNumber, nextEpisodeNumber, addToHistory]);

  const handleProgress = useCallback((progress: { currentTime: number; duration: number }) => {
    updateHistory(progress.currentTime, progress.duration);
  }, [updateHistory]);

  const handleEnded = useCallback(() => {
    // Force one final update on completion
    lastHistoryUpdateRef.current = 0; 
    updateHistory(playbackRef.current.duration, playbackRef.current.duration, true);
    if (type !== 'movie' && hasNext) {
      handleNextEpisode();
    }
  }, [updateHistory, type, hasNext, handleNextEpisode]);

  const handleWebviewProgress = useCallback((currentTime: number, duration: number) => {
    // Direct store updates bypass React state for smoother performance
    const state = usePlayerStore.getState();
    
    // Only update store if values changed significantly (at least 0.5s)
    if (Math.abs(state.currentTime - currentTime) > 0.5 || Math.abs(state.duration - duration) > 1) {
      state.setCurrentTime(currentTime);
      state.setDuration(duration);
    }
    
    updateHistory(currentTime, duration);
  }, [updateHistory]);

  useEffect(() => {
    const updateInteraction = () => { lastInteractionRef.current = Date.now(); };
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

  const handleContinueWatching = () => {
    originalHandleContinueWatching(() => {
      setConsecutiveEpisodes(0);
      lastInteractionRef.current = Date.now();
      window.dispatchEvent(new CustomEvent('AG_PLAYER_COMMAND', { detail: { action: 'play' } }));
    });
  };

  const handleSourceFound = useCallback((data: { url: string; type: string }) => {
    console.log('[VidlinkPlayer] Source discovered by bridge:', data.type);
    setDiscoveredSource(data);
  }, []);

  const handleSwitchToNative = useCallback(() => {
    if (!discoveredSource) return;
    console.log('[VidlinkPlayer] Switching to native player with discovered source');
    handleSourceSelect({
      url: discoveredSource.url,
      type: discoveredSource.type,
      provider: 'Native Fallback'
    });
    setDiscoveredSource(null);
  }, [discoveredSource, handleSourceSelect]);

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

  const visualEnhancements = useMemo(() => {
    if (typeof window !== 'undefined' && window.electron) return "";
    let classes = "";
    if (globalPrefs.ultraFluidPlayback) classes += " fluid-motion";
    if (globalPrefs.aiUpscaling) classes += " cinematic-ai";
    if (playerPrefs.visualBoost) classes += " visual-boost";
    return classes;
  }, [globalPrefs.ultraFluidPlayback, globalPrefs.aiUpscaling, visualBoost]);

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col group-player overflow-hidden max-h-screen">
      {!isHydrated ? (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full relative flex flex-col overflow-hidden min-h-0">
          {(isNativeSource && !hasFailedNative) ? (
            <div className={`w-full h-full relative z-10 flex items-center justify-center min-h-0 ${visualEnhancements}`}>
              <NativePlayer
                src={activeSourceUrl || directResult?.sources?.[0]?.url || ''}
                poster={content?.poster ?? undefined}
                title={content?.title || 'Unknown'}
                subTitle={type !== 'movie' ? `S${season} E${episode}` : undefined}
                type={type}
                season={String(season)}
                key={`${tmdbId}-${season}-${episode}`}
                seasons={content?.seasonsList}
                initialTime={initialProgress}
                tmdbId={tmdbId}
                subtitles={memoizedSubtitles}
                cast={memoizedCast}
                provider={directResult?.provider || (activeSourceUrl ? 'Direct Stream' : undefined)}
                onNext={onNext}
                onPrev={onPrev}
                onSeasonChange={onSeasonChange}
                onEpisodeChange={onEpisodeChange}
                onFatalError={handleNativeError}
                onToggleSource={handleToggleSource}
                onProgress={handleProgress}
              />
            </div>
          ) : (
            <div className={`w-full h-full relative z-10 ${!(typeof window !== 'undefined' && window.electron) ? visualEnhancements : ''}`}>
              {/* Only show loading state when we have no src at all (e.g. anime MAL ID still resolving
                   with no fallback URL yet). If src exists, render WebViewBridge immediately so the
                   embed is visible — prevents the black screen / audio-only bug. */}
              {(!src && isFetchingMalId) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-20 transition-all duration-1000">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-8 opacity-40" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                  </div>
                  <PretextHeadline text="ARCHIVE SYNCHRONIZATION" className="text-[10px] font-black tracking-[0.6em] text-white/40 uppercase" />
                </div>
              ) : src ? (
                <WebViewBridge
                  key={`${tmdbId}-${season}-${episode}`}
                  src={src}
                  tmdbId={tmdbId}
                  season={season}
                  episode={episode}
                  initialProgress={dynamicResumeTime}
                  visualBoost={playerPrefs.visualBoost}
                  pipBoost={playerPrefs.pipVisualBoost}
                  onEnded={handleEnded}
                  onProgress={handleWebviewProgress}
                  onSourceFound={handleSourceFound}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-8 opacity-40" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                  </div>
                  <PretextHeadline text="ARCHIVE SYNCHRONIZATION" className="text-[10px] font-black tracking-[0.6em] text-white/40 uppercase" />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {isHydrated && (
        <>
          <OverlayContainer
            showSourceSwitcher={showSourceSwitcher}
            onCloseSourceSwitcher={() => setShowSourceSwitcher(false)}
            allSources={allSources}
            activeSourceUrl={activeSourceUrl}
            onSourceSelect={(s) => {
              handleSourceSelect(s);
              setShowSourceSwitcher(false);
            }}
            showStillWatching={showStillWatching}
            onContinueWatching={handleContinueWatching}
            onExitStillWatching={() => onBack?.()}
            showEndCredits={type !== 'movie' && (hasNext ?? false)}
            onNextEpisode={handleNextEpisode}
            onCancelTransition={() => {}}
            contentId={tmdbId}
            type={type === 'series' ? 'tv' : type}
            season={Number(season)}
            nextEpisode={nextEpisodeNumber}
            hasNext={hasNext || false}
            discoveredSource={discoveredSource}
            onSwitchToNative={handleSwitchToNative}
          />
        </>
      )}
    </div>
  );
}
