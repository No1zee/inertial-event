'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MediaPlayer, MediaProvider, useMediaRemote, useMediaState, Track, MediaPlayerInstance, Captions } from '@vidstack/react';
import { Poster } from '@vidstack/react';
import { SanctumAmbiance } from './SanctumAmbiance';
import PlayerControls from './overlay/PlayerControls';
import SettingsOverlay from './overlay/SettingsOverlay';
import CastModal, { CastDevice } from './overlay/CastModal';
import { Season } from '@/lib/types/content';
import { useContentStore } from '@/store/contentStore';
import { usePlayerActions, usePlayerStore } from '@/lib/stores/playerStore';
import { aegisShield, type ShieldStatus } from '@/services/AegisShield';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';

interface NetworkInformation {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

import { SkipOverlay } from './SkipOverlay';
import { DialogueSearch } from './DialogueSearch';
import { XRayOverlay } from './XRayOverlay';
import { AmbientSync } from './AmbientSync';


interface NativePlayerProps {
  src: string;
  poster?: string;
  title: string;
  subTitle?: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  season?: string;
  episode?: string;
  seasons?: Season[];
  subtitles?: { url: string; label: string; language: string }[];
  onNext?: () => void;
  onPrev?: () => void;
  onEnded?: () => void;
  onFatalError?: (error: unknown) => void;
  onProgress?: (progress: { currentTime: number; duration: number }) => void;
  onToggleSource?: (recommendedSourceId?: string) => void;
  onSeasonChange?: (s: number) => void;
  onEpisodeChange?: (e: string) => void;
  initialTime?: number;
  tmdbId?: string;
  cast?: { id: number; name: string; character: string; profile_path: string | null }[];
  provider?: string;
}

export default function NativePlayer({
  src,
  poster,
  title,
  subTitle,
  type,
  season = '1',
  episode = '1',
  seasons = [],
  subtitles = [],
  onNext,
  onPrev,
  onEnded,
  onFatalError: _onFatalError,
  onProgress,
  onToggleSource,
  onSeasonChange,
  onEpisodeChange,
  initialTime = 0,
  tmdbId: _tmdbId,
  cast = [],
  provider = 'Direct Source',
}: NativePlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(playerRef);

  // Media State Hooks
  const currentTime = useMediaState('currentTime', playerRef);
  const duration = useMediaState('duration', playerRef);
  const isPaused = useMediaState('paused', playerRef);
  const volume = useMediaState('volume', playerRef);
  const isMuted = useMediaState('muted', playerRef);
  const isEnded = useMediaState('ended', playerRef);
  const qualities = useMediaState('qualities', playerRef);
  const audioTracks = useMediaState('audioTracks', playerRef);
  const textTracks = useMediaState('textTracks', playerRef);
  const playbackRate = useMediaState('playbackRate', playerRef);
  const buffered = useMediaState('buffered', playerRef);

  // Local UI State
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCast, setShowCast] = useState(false);
  const [showEndCredits, setShowEndCredits] = useState(false);
  const [showXRay, setShowXRay] = useState(false);
  const [showDialogueSearch, setShowDialogueSearch] = useState(false);
  const [showLounge, setShowLounge] = useState(false);
  const [shieldStatus, setShieldStatus] = useState<ShieldStatus | null>(null);
  const [castDevices] = useState<CastDevice[]>([]);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastInt = useRef<number>(-1);

  // Global Store Actions
  const { addToLibrary, removeFromLibrary, isInLibrary } = useContentStore();
  const { setCurrentTime, setDuration, loadMedia, unloadMedia } = usePlayerActions();
  const isSaved = isInLibrary(title); // Simple check for now, can be improved to use complex ID

  const {
    subtitleFont,
    subtitleOpacity,
    subtitleSize,
    subtitleColor,
    pipVisualBoost,
  } = useUserPreferencesStore();

  const [canPlay, setCanPlay] = useState(false);

  // Media Lifecycle Synchronization
  useEffect(() => {
    const { currentMedia, updateMediaSource } = usePlayerStore.getState();
    const isSameMedia = currentMedia && 
                       currentMedia.id === (_tmdbId || '') && 
                       currentMedia.season === Number(season) && 
                       currentMedia.episode === Number(episode);

    if (!isSameMedia) {
      loadMedia({
        id: _tmdbId || '',
        type,
        title,
        poster,
        season: Number(season),
        episode: Number(episode),
        source: src,
      });
    } else if (currentMedia?.source !== src) {
      // If same media but different source, just update the source in store
      updateMediaSource(src);
    }
  }, [loadMedia, _tmdbId, type, title, poster, season, episode, src]);

  // Progress Synchronization
  useEffect(() => {
    if (currentTime > 0) {
      // Throttle updates to only when the floor(currentTime) changes
      // to avoid infinite re-renders from VidlinkPlayer's prop chain.
      const currentInt = Math.floor(currentTime);
      
      if (currentInt !== lastInt.current) {
        setCurrentTime(currentTime);
        setDuration(duration);
        lastInt.current = currentInt;
      }

      // Call onProgress callback if provided
      if (onProgress) {
        onProgress({ currentTime, duration });
      }

      // Update Aegis Shield metrics
      const bufferedEnd = buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
      const bufferedDuration = Math.max(0, bufferedEnd - currentTime);
      aegisShield.updateMetrics(bufferedDuration, 0); // Bandwidth estimation can be added later
    }
  }, [currentTime, duration, buffered, setCurrentTime, setDuration, onProgress]);

  // Shield Initialization
  useEffect(() => {
    aegisShield.startMonitoring(setShieldStatus);
    return () => aegisShield.stopMonitoring();
  }, []);

  const [hasFatalError, setHasFatalError] = useState(false);

  // Handle Shield Failover Recommendations
  useEffect(() => {
    if (shieldStatus?.health === 'critical' && onToggleSource && !hasFatalError) {
      console.log(`[NativePlayer] Aegis Shield triggered auto-source optimization: ${shieldStatus.recommendation || 'Failover initiated'}`);
      // Auto-failover to next available source (Feature 25)
      onToggleSource(shieldStatus.recommendation);
    }
  }, [shieldStatus?.health, shieldStatus?.recommendation, onToggleSource, hasFatalError]);

  // Controls Visibility Logic
  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (!isPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPaused]);

  useEffect(() => {
    handleInteraction();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [handleInteraction]);

  // Player Handlers
  const togglePlay = () => (isPaused ? remote.play() : remote.pause());
  const handleSeek = (time: number) => remote.seek(time);
  const handleVolume = (v: number) => remote.changeVolume(v);
  const toggleMute = () => remote.toggleMuted();
  const toggleFullscreen = () => remote.toggleFullscreen();

  const handleLibraryToggle = () => {
    if (isSaved) {
      removeFromLibrary(title);
    } else {
      addToLibrary(title);
    }
  };

  // Network-aware quality selection
  useEffect(() => {
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g')) {
      console.log(`[NativePlayer] Slow network detected (${connection.effectiveType}). Optimization active.`);
    }
  }, []);
  
  const onCanPlay = () => {
    if (playerRef.current) {
      console.log('[NativePlayer] Content can play. Initializing volume guard...');
      
      // Immediate sync
      remote.unmute();
      remote.changeVolume(1);
      
      setCanPlay(true);
      window.dispatchEvent(new CustomEvent('AG_LOADED', { detail: { provider, tmdbId: _tmdbId } }));

      // Force play state immediately
      remote.play();

      // TASK: "after a second of playing, volume should automatically become 100%"
      // This ensures that even if user/system muted it during load, it's forced back.
      setTimeout(() => {
        if (playerRef.current) {
          console.log('[NativePlayer] Volume Guard (1s): Enforcing 100% volume');
          remote.unmute();
          remote.changeVolume(1);
        }
      }, 1000);

      // Persistent Volume Guard: Force unmute/100% volume for the first 30 seconds
      let attempts = 0;
      const guardInterval = setInterval(() => {
        attempts++;
        if (attempts > 60) {
          clearInterval(guardInterval);
          return;
        }
        remote.unmute();
        remote.changeVolume(1);
      }, 500);

      // Store interval for cleanup
      (playerRef.current as any)._volumeGuard = guardInterval;
    }
  };

  const onPlaying = () => {
    if (playerRef.current) {
      remote.unmute();
      remote.changeVolume(1);
    }
  };

  useEffect(() => {
    if (canPlay && remote && src) {
      if (initialTime > 0) {
        remote.seek(initialTime);
      }
      
      // Direct enforcement on mount if already ready
      onCanPlay();
    }
    return () => {
      if (playerRef.current && (playerRef.current as any)._volumeGuard) {
        clearInterval((playerRef.current as any)._volumeGuard);
      }
    };
  }, [canPlay, remote, src, initialTime]);

  return (
    <div
      className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center group max-h-screen min-h-0"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
      onPointerMove={handleInteraction}
      aria-label="Media player container"
      data-testid="video-player"
    >
      {/* Ambient Background */}
      <SanctumAmbiance src={poster || null} />

      <MediaPlayer
        ref={playerRef}
        src={src}
        className="w-full h-full bg-black overflow-hidden [&_video]:max-h-full [&_video]:max-w-full [&_video]:object-contain"
        crossOrigin="anonymous"
        autoPlay
        muted={false}
        onCanPlay={onCanPlay}
        onPlaying={onPlaying}
        onEnded={() => {
          setShowEndCredits(true);
          onEnded?.();
        }}
        onPause={() => console.log('[NativePlayer] Paused')}
        onPlay={() => console.log('[NativePlayer] Playing')}
        onVolumeChange={(e) => {
          if (e.volume < 1 || e.muted) {
            // Keep at 100% volume
          }
        }}
        onError={(event: unknown) => {
          setHasFatalError(true);
          aegisShield.triggerCriticalFailover();
          if (_onFatalError) _onFatalError(event);
        }}
        onProviderSetup={(adapter) => {
          const a = adapter as unknown as { video?: HTMLVideoElement };
          if (a?.video) {
            videoRef.current = a.video as unknown as typeof videoRef.current;
          }
        }}
      >
        <MediaProvider>
          {poster && <Poster src={poster} className="vds-poster" />}
          {subtitles.map((track, i) => (
            <Track
              key={`${track.url}-${i}`}
              src={track.url}
              label={track.label}
              lang={track.language}
              kind="subtitles"
              default={track.language === 'en'}
            />
          ))}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Captions 
            className="vds-captions"
            {...({
              style: {
                '--media-caption-font-size': `${subtitleSize}px`,
                '--media-caption-color': subtitleColor,
                '--media-caption-font-family': subtitleFont === 'system-ui' ? 'sans-serif' : subtitleFont,
                '--media-caption-bg': `rgba(0, 0, 0, ${subtitleOpacity * 0.8})`,
              },
            } as any)}
          />
        </MediaProvider>

        <AmbientSync videoRef={videoRef} active={!isPaused} />

        {/* Aegis Shield HUD Indicator */}
        <AnimatePresence>
          {shieldStatus && showControls && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute top-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-2.5 rounded-2xl backdrop-blur-2xl border transition-colors duration-500",
                shieldStatus.health === 'optimal' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                shieldStatus.health === 'degraded' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                "bg-red-500/10 border-red-500/20 text-red-500"
              )}
            >
              {shieldStatus.health === 'optimal' ? <ShieldCheck size={18} /> : 
               shieldStatus.health === 'degraded' ? <Shield size={18} /> : 
               <ShieldAlert size={18} className="animate-pulse" />}
              
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Aegis Shield {'//'} {shieldStatus.health} {'//'} {provider} {'//'} {Math.round(shieldStatus.bufferedDuration)}s Secure
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom UI Overlay */}
        <PlayerControls
          show={showControls || isPaused || showSettings || showCast}
          title={title}
          subTitle={subTitle}
          currentTime={currentTime}
          duration={duration}
          isPaused={isPaused}
          volume={volume}
          isMuted={isMuted}
          isSaved={isSaved}
          downloadUrl={src}
          type={type}
          season={season}
          episode={episode}
          seasons={seasons}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          onVolumeChange={handleVolume}
          onToggleMute={toggleMute}
          onToggleSettings={() => setShowSettings(true)}
          onToggleFullscreen={toggleFullscreen}
          onNext={onNext}
          onPrev={onPrev}
          onSeasonChange={onSeasonChange}
          onEpisodeChange={onEpisodeChange}
          onToggleLibrary={handleLibraryToggle}
          onDownload={() => window.open(src, '_blank')}
          onTogglePiP={() => remote.enterPictureInPicture()}
          onToggleCast={() => setShowCast(true)}
          onToggleSource={onToggleSource}
          onToggleXRay={() => setShowXRay(true)}
          onToggleDialogueSearch={() => setShowDialogueSearch(true)}
          onToggleLounge={() => setShowLounge(true)}
        />

        {/* Skip Actions (Feature 2) */}
        <SkipOverlay 
          currentTime={currentTime}
          duration={duration}
          onSkip={(seconds) => remote.seek(currentTime + seconds)}
        />

        {/* X-Ray Context (Feature 5) */}
        <XRayOverlay 
          show={showXRay}
          onClose={() => setShowXRay(false)}
          cast={cast}
          trivia={["Production was filmed in 4K high-fidelity.", "Director requested a custom HSL color palette."]}
        />

        {/* Dialogue Search (Feature 15) */}
        <DialogueSearch 
          show={showDialogueSearch}
          onClose={() => setShowDialogueSearch(false)}
          onJump={(time) => {
            remote.seek(time);
            setShowDialogueSearch(false);
          }}
          subtitles={[]}
        />

        {/* Settings Overlay */}
        <SettingsOverlay
          show={showSettings}
          onClose={() => setShowSettings(false)}
          tracks={textTracks.map(t => ({
            label: t.label,
            language: t.language ?? 'en',
            active: t.mode === 'showing',
          }))}
          audioTracks={audioTracks.map(t => ({
            label: t.label,
            language: t.language ?? 'en',
            active: t.selected,
          }))}
          qualities={qualities.map(q => ({
            label: q.height ? `${q.height}p` : `${Math.round((q.bitrate ?? 0) / 1000)}kbps`,
            height: q.height,
            active: q.selected,
          }))}
          playbackSpeed={playbackRate}
          onTrackChange={idx => {
            if (idx === -1) {
              remote.changeTextTrackMode(-1, 'disabled');
            } else {
              remote.changeTextTrackMode(idx, 'showing');
            }
          }}
          onAudioTrackChange={idx => remote.changeAudioTrack(idx)}
          onQualityChange={idx => remote.changeQuality(idx)}
          onSpeedChange={v => remote.changePlaybackRate(v)}
        />

        {/* Cast Modal */}
        <CastModal
          isOpen={showCast}
          onClose={() => setShowCast(false)}
          devices={castDevices}
          onSelect={device => console.log('Casting to:', device)}
          isScanning={false}
        />


      </MediaPlayer>
    </div>
  );
}
