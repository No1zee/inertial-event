'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore, usePlayerActions } from '@/lib/stores/playerStore';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { cn } from '@/lib/utils';

interface YouTubePlayerProps {
  src: string;
  tmdbId: string;
  initialTime?: number;
  title?: string;
  onEnded?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

// Global YouTube API Loading State
let apiLoaded = false;
let apiLoading = false;
const pendingPlayers: (() => void)[] = [];

const loadYouTubeAPI = () => {
  if (apiLoaded) return Promise.resolve();
  if (apiLoading) {
    return new Promise<void>((resolve) => pendingPlayers.push(resolve));
  }

  apiLoading = true;
  return new Promise<void>((resolve) => {
    // Register global callback
    (window as any).onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiLoading = false;
      resolve();
      pendingPlayers.forEach((p) => p());
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  });
};

const extractVideoId = (url: string) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : url;
};

export default function YouTubePlayer({
  src,
  tmdbId,
  initialTime = 0,
  title = 'YouTube Content',
  onEnded,
  onProgress,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isPlaying, volume, muted, playbackRate } = usePlayerStore();
  const { setPlaying, setCurrentTime, setDuration, setBuffered, setLoading, setError: setStoreError } = usePlayerActions();

  // Initialize Player
  useEffect(() => {
    let mounted = true;
    const videoId = extractVideoId(src);

    const initPlayer = async () => {
      await loadYouTubeAPI();
      if (!mounted || !containerRef.current) return;

      // Clean up previous instance if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('NovaStream: Failed to destroy previous YT instance', e);
        }
      }

      const playerElement = document.createElement('div');
      playerElement.id = `yt-player-${tmdbId}`;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerElement);

      playerRef.current = new (window as any).YT.Player(playerElement.id, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          start: Math.floor(initialTime),
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (!mounted) return;
            setIsReady(true);
            setLoading(false);
            
            // Sync initial state
            event.target.setVolume(muted ? 0 : volume * 100);
            if (muted) event.target.mute(); else event.target.unMute();
            event.target.setPlaybackRate(playbackRate);
            setDuration(event.target.getDuration());
            
            if (isPlaying) event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (!mounted) return;
            const YT_STATE = (window as any).YT.PlayerState;
            
            switch (event.data) {
              case YT_STATE.PLAYING:
                setPlaying(true);
                setLoading(false);
                break;
              case YT_STATE.PAUSED:
                setPlaying(false);
                break;
              case YT_STATE.BUFFERING:
                setLoading(true);
                break;
              case YT_STATE.ENDED:
                onEnded?.();
                break;
            }
          },
          onError: (event: any) => {
            const errorCodes: Record<number, string> = {
              2: 'Invalid Video ID',
              5: 'HTML5 Player Error',
              100: 'Video Not Found',
              101: 'Embedding Disabled',
              150: 'Embedding Disabled (Restricted)'
            };
            const msg = errorCodes[event.data] || 'Unknown YouTube Error';
            setError(msg);
            setStoreError(msg);
          }
        }
      });
    };

    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [src, tmdbId]); // Re-init if source changes

  // Store Sync - External Commands -> YouTube Player
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const state = playerRef.current.getPlayerState();
      const YT_STATE = (window as any).YT.PlayerState;

      if (isPlaying && state !== YT_STATE.PLAYING) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === YT_STATE.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying, isReady]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      playerRef.current.setVolume(muted ? 0 : volume * 100);
      if (muted) playerRef.current.mute(); else playerRef.current.unMute();
    } catch (e) {}
  }, [volume, muted, isReady]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(playbackRate);
    } catch (e) {}
  }, [playbackRate, isReady]);

  // Command listener for seeking
  useEffect(() => {
    const handleCommand = (e: CustomEvent) => {
      if (!isReady || !playerRef.current) return;
      const { action, value } = e.detail;
      
      try {
        if (action === 'seek') {
          playerRef.current.seekTo(value, true);
        } else if (action === 'play') {
          playerRef.current.playVideo();
        } else if (action === 'pause') {
          playerRef.current.pauseVideo();
        } else if (action === 'volume') {
          playerRef.current.setVolume(value * 100);
        } else if (action === 'mute') {
          if (value) playerRef.current.mute(); else playerRef.current.unMute();
        }
      } catch (e) {}
    };

    window.addEventListener('AG_PLAYER_COMMAND' as any, handleCommand);
    return () => window.removeEventListener('AG_PLAYER_COMMAND' as any, handleCommand);
  }, [isReady]);

  // Progress Polling
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const loaded = playerRef.current.getVideoLoadedFraction();
        
        setCurrentTime(time);
        setBuffered(loaded * 100);
        if (duration > 0) setDuration(duration);
        
        onProgress?.(time, duration);
      } catch (e) {}
    }, 500);

    return () => clearInterval(interval);
  }, [isReady, setCurrentTime, setBuffered, setDuration, onProgress]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {/* YouTube IFrame Placeholder */}
      <div 
        ref={containerRef} 
        className={cn(
          "w-full h-full transition-opacity duration-1000",
          isReady ? "opacity-100" : "opacity-0"
        )} 
      />

      {/* Branded Loading / Error States */}
      <AnimatePresence>
        {(!isReady || error) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
          >
            {error ? (
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mb-6 animate-pulse" />
                <PretextHeadline text="YOUTUBE ACCESS FAILURE" fontSize={10} fontWeight={900} letterSpacing="0.4em" className="text-red-500/60 mb-4" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{error}</h3>
                <p className="mt-4 text-zinc-500 text-sm max-w-xs text-center">YouTube restrictions may prevent this content from playing in-app.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                  <Loader2 className="w-12 h-12 text-primary animate-spin opacity-40" />
                  <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                </div>
                <PretextHeadline 
                  text="INITIALIZING YOUTUBE ARCHIVE" 
                  fontSize={10} 
                  fontWeight={900} 
                  letterSpacing="0.4em" 
                  className="text-zinc-500/60 uppercase" 
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Scanlines Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
      
      {/* Liquid Glass Overlay Backdrop for controls */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none z-0" />
    </div>
  );
}
