'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MediaPlayer, MediaProvider, useMediaRemote, useMediaState, MediaPlayerInstance, useMediaPlayer, Poster } from '@vidstack/react';
import { SanctumAmbiance } from './SanctumAmbiance';
import PlayerControls from './overlay/PlayerControls';
import SettingsOverlay from './overlay/SettingsOverlay';
import CastModal, { CastDevice } from './overlay/CastModal';
import { Season, SeasonEpisode } from '@/lib/types/content';
import { useLibraryActions, useWatchHistoryActions, useLocalDataStore } from '@/lib/stores/localDataStore';
import { usePlayerActions, usePlayerStore } from '@/lib/stores/playerStore';
import { aegisShield, type ShieldStatus } from '@/services/AegisShield';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { shallow } from 'zustand/shallow';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';
import { useTorrentEngine } from '@/hooks/useTorrentEngine';
import TorrentFileSelector from './overlay/TorrentFileSelector';
import { SkipOverlay } from './SkipOverlay';
import { DialogueSearch } from './DialogueSearch';
import { XRayOverlay } from './XRayOverlay';

interface NativePlayerProps {
  src: string;
  poster?: string;
  title: string;
  subTitle?: string;
  type: 'movie' | 'tv' | 'anime' | 'series';
  season?: string;
  episode?: string;
  seasons?: Season[];
  episodeDetails?: SeasonEpisode[];
  subtitles?: { url: string; label: string; language: string }[];
  onNext?: () => void;
  onPrev?: () => void;
  onEnded?: () => void;
  onFatalError?: (error: unknown) => void;
  onProgress?: (progress: { currentTime: number; duration: number }) => void;
  onToggleSource?: (recommendedSourceId?: string) => void;
  onSeasonChange?: (s: number) => void;
  onEpisodeChange?: (e: string) => void;
  onBack?: () => void;
  initialTime?: number;
  tmdbId?: string;
  cast?: { id: number; name: string; character: string; profile_path: string | null }[];
  provider?: string;
  visualBoost?: boolean;
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
  episodeDetails = [],
  onNext,
  onPrev,
  onEnded,
  onFatalError: _onFatalError,
  onToggleSource,
  onSeasonChange,
  onEpisodeChange,
  onBack,
  initialTime = 0,
  tmdbId: _tmdbId,
  cast = [],
  visualBoost = false,
}: NativePlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const torrentEngine = useTorrentEngine();
  const { status: torrentStatus, loading: torrentLoading, error: torrentError, startTorrent, stopTorrent, getMetadata } = torrentEngine;
  const [actualSrc, setActualSrc] = useState(src.startsWith('magnet:') ? '' : src);
  const [isTorrentStarting, setIsTorrentStarting] = useState(src.startsWith('magnet:'));
  const [metadata, setMetadata] = useState<any>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState<number | null>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showStartup, setShowStartup] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  // --- REFACTOR: Moved media state hooks to a dedicated sub-component ---
  // This prevents the "this.$state[prop2] is not a function" error by ensuring
  // that hooks are only executed within the context of an active MediaPlayer.

  // --- Local UI State ---
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [showDialogueSearch, setShowDialogueSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCast, setShowCast] = useState(false);
  const [showXRay, setShowXRay] = useState(false);
  const [shieldStatus, setShieldStatus] = useState<ShieldStatus | null>(null);
  const [castDevices] = useState<CastDevice[]>([]);
  const handshakeStartTime = useRef<number>(Date.now());
  const lastStartedMagnetRef = useRef<string | null>(null);
  const canPlayRef = useRef<boolean>(false);
  const failoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cinematic Startup Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartup(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryActions();
  const { addToWatchHistory } = useWatchHistoryActions();
  const { loadMedia } = usePlayerActions();
  
  // NovaStream Fix: Use a reactive selector for library state to ensure UI updates immediately
  const contentId = _tmdbId || title;
  const isSaved = useLocalDataStore(
    state => state.library.some(item => item.contentId === contentId),
    shallow
  );

  const { bufferStrategy } = useUserPreferencesStore();

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
        fileIndex: selectedFileIndex ?? undefined,
      }, initialTime);
    } else {
      if (currentMedia.fileIndex !== undefined && selectedFileIndex === null) {
        setSelectedFileIndex(currentMedia.fileIndex);
      }
      
      if (currentMedia.source !== src) {
        updateMediaSource(src, selectedFileIndex ?? undefined);
      }
    }
  }, [loadMedia, _tmdbId, type, title, poster, season, episode, src, selectedFileIndex, initialTime]);

  useEffect(() => {
    let isMounted = true;
    
    if (src.startsWith('magnet:')) {
      if (lastStartedMagnetRef.current === src && !torrentError) {
        return;
      }
      setIsTorrentStarting(true);
      lastStartedMagnetRef.current = src;
      aegisShield.setMonitoringEnabled(false); 
      setActualSrc(''); 

      const fetchAndStart = async () => {
        handshakeStartTime.current = Date.now();
        try {
          const enginePromise = startTorrent(
            src, 
            Number(season), 
            Number(episode), 
            bufferStrategy, 
            selectedFileIndex,
            selectedAudioTrackIndex ?? undefined
          );

          // Decouple metadata from engine start to prevent hanging on slow metadata
          getMetadata(src).then(meta => {
            if (isMounted && lastStartedMagnetRef.current === src && meta) {
              setMetadata(meta);
            }
          }).catch(err => {
            console.warn('[NativePlayer] Metadata fetch failed:', err);
          });

          const streamUrl = await enginePromise;

          if (isMounted && lastStartedMagnetRef.current === src) {
            if (streamUrl) {
              if (window.electron?.ipcRenderer?.log) {
                const handshakeLatency = Date.now() - handshakeStartTime.current;
                window.electron.ipcRenderer.log(`[NativePlayer] Torrent engine provided stream URL: ${streamUrl} in ${handshakeLatency}ms`);
              }
              setActualSrc(streamUrl);
              setIsTorrentStarting(false);
            } else {
              setIsTorrentStarting(false);
              aegisShield.setMonitoringEnabled(true);
              if (_onFatalError) _onFatalError(new Error('Torrent stream failed to initialize'));
            }
          }
        } catch (err) {
          if (isMounted) {
            setIsTorrentStarting(false);
            if (_onFatalError) _onFatalError(err);
          }
        }
      };

      fetchAndStart();
    } else {
      setActualSrc(src);
      lastStartedMagnetRef.current = null;
      aegisShield.setMonitoringEnabled(true);
    }
    
    return () => {
      isMounted = false;
      if (typeof stopTorrent === 'function') {
        stopTorrent();
      }
    };
  }, [src, startTorrent, getMetadata, stopTorrent, selectedFileIndex, selectedAudioTrackIndex, _tmdbId, season, episode, bufferStrategy]);

  useEffect(() => {
    if (!isTorrentStarting) {
      console.log('[NovaStream] Aegis Shield: Initializing Health Monitor for Source:', actualSrc);
    }
    
    const unsub = aegisShield.startMonitoring((status) => {
      setShieldStatus(status);
    });
    return unsub;
  }, [isTorrentStarting, actualSrc]);

  useEffect(() => {
    if (shieldStatus?.health === 'critical' && onToggleSource) {
      onToggleSource(shieldStatus.recommendation);
    }
  }, [shieldStatus?.health, shieldStatus?.recommendation, onToggleSource]);

  const handleAudioTrackChange = (index: number) => {
    setSelectedAudioTrackIndex(index);
  };

  const lastHistoryUpdateRef = useRef<number>(0);

  const updateHistory = React.useCallback((currentTime: number, duration: number, completed = false) => {
    if (!contentId) return;
    
    // Throttle history updates to once every 10 seconds, unless completed
    const now = Date.now();
    if (!completed && now - lastHistoryUpdateRef.current < 10000) {
      return;
    }
    lastHistoryUpdateRef.current = now;

    addToWatchHistory({
      contentId,
      type: type as any,
      title,
      poster: poster || '',
      backdrop: '', // No backdrop in props, but could be added if needed
      currentTime: completed ? duration : currentTime,
      duration: duration || 100,
      season: type !== 'movie' ? Number(season) : undefined,
      episode: type !== 'movie' ? Number(episode) : undefined,
    });
  }, [contentId, type, title, poster, season, episode, addToWatchHistory]);

  return (
    <div
      className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center group max-h-screen min-h-0"
      aria-label="Media player container"
      data-testid="video-player"
    >
      <MediaPlayer
        ref={playerRef}
        src={actualSrc}
        className={cn(
          "w-full h-full bg-black overflow-hidden [&_video]:max-h-full [&_video]:max-w-full [&_video]:object-contain transition-all duration-700",
          visualBoost && "brightness-110 contrast-110 saturate-[1.1]"
        )}
        crossOrigin="anonymous"
        autoPlay
        onCanPlay={() => {
          const latency = Date.now() - handshakeStartTime.current;
          aegisShield.setHandshakeLatency(latency);
          aegisShield.setMonitoringEnabled(true);
          canPlayRef.current = true;
          if (failoverTimeoutRef.current) {
            clearTimeout(failoverTimeoutRef.current);
            failoverTimeoutRef.current = null;
          }
        }}
        onPlaying={() => {
          canPlayRef.current = true;
          if (failoverTimeoutRef.current) {
            clearTimeout(failoverTimeoutRef.current);
            failoverTimeoutRef.current = null;
          }
        }}
        onLoadStart={() => {
          canPlayRef.current = false;
          // Set a 30s failover timeout for unresponsive streams
          if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
          failoverTimeoutRef.current = setTimeout(() => {
            if (!canPlayRef.current && onToggleSource) {
              console.warn('[NovaStream] Stream load timeout. Triggering failover...');
              onToggleSource();
            }
          }, 30000);
        }}
        onError={(event: any) => {
          if (isTorrentStarting) return;
          aegisShield.triggerCriticalFailover();
          if (_onFatalError) _onFatalError(event);
        }}
      >
        <MediaProvider>
          {poster && <Poster src={poster} className="vds-poster" />}
        </MediaProvider>
        
        <MediaUI 
          title={title}
          subTitle={subTitle}
          type={type}
          isTorrent={src.startsWith('magnet:')}
          season={season}
          episode={episode}
          seasons={seasons}
          onBack={onBack}
          isSaved={isSaved}
          onToggleLibrary={() => isSaved ? removeFromLibrary(contentId) : addToLibrary({ 
            contentId, 
            title, 
            poster: poster || '', 
            backdrop: backdrop || '', 
            type: type as any,
            favorite: false
          })}
          onNext={onNext}
          onPrev={onPrev}
          onSeasonChange={onSeasonChange}
          onEpisodeChange={onEpisodeChange}
          shieldStatus={shieldStatus}
          torrentStatus={torrentStatus}
          isLoungeOpen={isLoungeOpen}
          setIsLoungeOpen={setIsLoungeOpen}
          showDialogueSearch={showDialogueSearch}
          setShowDialogueSearch={setShowDialogueSearch}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showCast={showCast}
          setShowCast={setShowCast}
          showXRay={showXRay}
          setShowXRay={setShowXRay}
          cast={cast}
          castDevices={castDevices}
          metadata={metadata}
          selectedFileIndex={selectedFileIndex}
          setSelectedFileIndex={setSelectedFileIndex}
          showFileSelector={showFileSelector}
          setShowFileSelector={setShowFileSelector}
          handleAudioTrackChange={handleAudioTrackChange}
          selectedAudioTrackIndex={selectedAudioTrackIndex}
          src={src}
          downloadUrl={actualSrc.startsWith('http') ? actualSrc : null}
          onToggleSource={onToggleSource}
          onToggleTorrentFiles={() => setShowFileSelector(true)}
          updateHistory={updateHistory}
        />
      </MediaPlayer>
    </div>
  );
}

function MediaUI(props: any) {
  const player = useMediaPlayer();
  const [isProxyReady, setIsProxyReady] = React.useState(false);

  React.useEffect(() => {
    if (player) {
      // NovaStream: Give Vidstack a micro-task to fully initialize the $state proxy
      // This is a known fix for 'this.$state[prop2] is not a function' errors.
      // Buffer increased to 100ms for extra stability in Electron environments.
      const timer = setTimeout(() => {
        if (player && player.$state) {
          setIsProxyReady(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [player]);
  
  if (!player || !isProxyReady) return null;
  
  return <MediaUIInner {...props} />;
}

function MediaUIInner({
  title,
  subTitle,
  type,
  isTorrent,
  season,
  episode,
  seasons,
  episodeDetails,
  onNext,
  onPrev,
  onSeasonChange,
  onEpisodeChange,
  shieldStatus,
  torrentStatus,
  isLoungeOpen,
  setIsLoungeOpen,
  showDialogueSearch,
  setShowDialogueSearch,
  showSettings,
  setShowSettings,
  showCast,
  setShowCast,
  showXRay,
  setShowXRay,
  cast,
  castDevices,
  metadata,
  selectedFileIndex,
  setSelectedFileIndex,
  showFileSelector,
  setShowFileSelector,
  handleAudioTrackChange,
  selectedAudioTrackIndex,
  src,
  onToggleSource,
  onToggleTorrentFiles,
  isSaved,
  onToggleLibrary,
  downloadUrl,
  updateHistory
}: any) {
  const player = useMediaPlayer();
  const remote = useMediaRemote(); // NovaStream: Do not pass player explicitly to avoid proxy timing issues
  
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const playing = useMediaState('playing');
  const qualities = useMediaState('qualities');
  const audioTracks = useMediaState('audioTracks');
  const textTracks = useMediaState('textTracks');
  const playbackRate = useMediaState('playbackRate');
  const volume = useMediaState('volume');
  const muted = useMediaState('muted');
  const canPlay = useMediaState('canPlay');

  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing && !showSettings && !isLoungeOpen && !showDialogueSearch && !showXRay && !showCast) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    if (currentTime > 0 && duration > 0 && playing) {
      updateHistory(currentTime, duration);
    }
  }, [currentTime, duration, playing, updateHistory]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 z-[100]"
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(true)}
    >
      <AegisShieldOverlay 
        status={shieldStatus} 
        torrentStatus={torrentStatus}
        show={showControls}
      />

      <PlayerControls
        show={showControls}
        title={title}
        subTitle={subTitle}
        currentTime={currentTime}
        duration={duration}
        isPaused={!playing}
        volume={volume}
        isMuted={muted}
        isSaved={isSaved}
        downloadUrl={downloadUrl}
        onToggleLibrary={onToggleLibrary}
        type={type}
        isTorrent={isTorrent}
        season={season}
        episode={episode}
        seasons={seasons}
        episodeDetails={episodeDetails}
        onNext={onNext}
        onPrev={onPrev}
        onTogglePlay={() => {
          if (!canPlay) return;
          playing ? player.pause() : player.play();
        }}
        onSeek={(time) => {
          if (!canPlay) return;
          player.currentTime = time;
        }}
        onVolumeChange={(v) => {
          if (!canPlay) return;
          player.volume = v;
        }}
        onToggleMute={() => {
          if (!canPlay) return;
          player.muted = !muted;
        }}
        onToggleLibrary={onToggleLibrary}
        onDownload={() => downloadUrl && window.open(downloadUrl, '_blank')}
        onToggleSettings={() => {
          if (!canPlay) return;
          setShowSettings(!showSettings);
        }}
        onTogglePiP={() => {
          if (!canPlay) return;
          player.enterPictureInPicture();
        }}
        onToggleCast={() => {
          if (!canPlay) return;
          setShowCast(true);
        }}
        onNext={onNext}
        onPrev={onPrev}
        onSeasonChange={onSeasonChange}
        onEpisodeChange={onEpisodeChange}
        onToggleFullscreen={() => {
          if (!canPlay) return;
          if (player.fullscreen.active) {
            player.fullscreen.exit();
          } else {
            player.fullscreen.enter();
          }
        }}
        onToggleLounge={() => {
          if (!canPlay) return;
          setIsLoungeOpen(!isLoungeOpen);
        }}
        onToggleDialogueSearch={() => {
          if (!canPlay) return;
          setShowDialogueSearch(!showDialogueSearch);
        }}
        onToggleXRay={() => {
          if (!canPlay) return;
          setShowXRay(true);
        }}
        onToggleSource={onToggleSource}
        onToggleTorrentFiles={onToggleTorrentFiles}
      />

      <SkipOverlay 
        currentTime={currentTime}
        duration={duration}
        onSkip={(seconds) => {
          if (!canPlay) return;
          remote.seek(currentTime + seconds);
        }}
      />

      <XRayOverlay 
        show={showXRay}
        onClose={() => setShowXRay(false)}
        cast={cast}
        trivia={["Production was filmed in 4K high-fidelity.", "Director requested a custom HSL color palette."]}
      />

      <DialogueSearch 
        show={showDialogueSearch}
        onClose={() => setShowDialogueSearch(false)}
        onJump={(time) => {
          if (!canPlay) return;
          remote.seek(time);
          setShowDialogueSearch(false);
        }}
        subtitles={[]}
      />

      <SettingsOverlay
        show={showSettings}
        onClose={() => setShowSettings(false)}
        tracks={textTracks.map(t => ({
          label: t.label,
          language: t.language ?? 'en',
          active: t.mode === 'showing',
        }))}
        audioTracks={isTorrent && metadata?.audioTracks?.length > 0 
          ? metadata.audioTracks.map((t: any, idx: number) => ({
              label: typeof t === 'string' ? t : `${t.language.toUpperCase()} (${t.codec}${t.channels ? ` ${t.channels}ch` : ''})`,
              language: typeof t === 'string' ? (t.toLowerCase().includes('eng') ? 'en' : 'unknown') : t.language,
              active: selectedAudioTrackIndex === idx || (selectedAudioTrackIndex === null && idx === 0)
            }))
          : audioTracks.map(t => ({
              label: t.label,
              language: t.language ?? 'en',
              active: t.selected,
            }))
        }
        qualities={qualities.map(q => ({
          label: q.label,
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
        onAudioTrackChange={handleAudioTrackChange}
        onQualityChange={idx => remote.changeQuality(idx)}
        onSpeedChange={v => remote.changePlaybackRate(v)}
      />

      <AnimatePresence>
        {showFileSelector && metadata && (
          <TorrentFileSelector
            metadata={metadata}
            currentIndex={selectedFileIndex ?? undefined}
            onSelect={(index) => {
              setSelectedFileIndex(index);
              setShowFileSelector(false);
            }}
            onClose={() => setShowFileSelector(false)}
          />
        )}
      </AnimatePresence>

      <CastModal
        isOpen={showCast}
        onClose={() => setShowCast(false)}
        devices={castDevices}
        onSelect={device => console.log('Casting to:', device)}
        isScanning={false}
      />
    </div>
  );
}

function AegisShieldOverlay({ status, torrentStatus, show }: { status: ShieldStatus | null, torrentStatus: any, show: boolean }) {
  if (!show && !status) return null;
  
  return (
    <div className={cn(
      "absolute top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 transition-opacity duration-500",
      show || (status && status.health !== 'optimal') ? "opacity-100" : "opacity-0"
    )}>
      {status && (
        <div className={cn(
          "flex items-center gap-3 animate-in slide-in-from-top duration-700",
          status.health === 'optimal' ? "text-emerald-400" :
          status.health === 'degraded' ? "text-amber-400" :
          "text-rose-400"
        )}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 shadow-2xl">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-[11px] font-bold text-white/90 tracking-widest uppercase">Aegis Active</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 shadow-2xl">
            <span className="text-[11px] font-bold text-white/70 tracking-widest uppercase">{status.health}</span>
          </div>
        </div>
      )}
      
      {torrentStatus && (
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md text-[9px] text-white/40 font-mono uppercase tracking-tighter">
          Seeds: {torrentStatus.numPeers} • Down: {(torrentStatus.downloadSpeed / 1024 / 1024).toFixed(1)} MB/s
        </div>
      )}
    </div>
  );
}
