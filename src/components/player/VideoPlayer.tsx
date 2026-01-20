"use client";

import { useEffect, useRef } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import type { MediaPlayerInstance } from '@vidstack/react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import { usePlayerStore } from '@/lib/store/playerStore';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    subtitles?: { kind: string; src: string; label: string; language: string; default?: boolean }[];
    onEnded?: () => void;
}

export function VideoPlayer({ src, poster, title, subtitles, onEnded }: VideoPlayerProps) {
    const player = useRef<MediaPlayerInstance>(null);
    const {
        setPlaying,
        setDuration,
        setCurrentTime,
        setVolume,
        setMuted,
        setFullscreen
    } = usePlayerStore();

    console.log('[VideoPlayer] Mounting with src:', src);

    useEffect(() => {
        // Sync state with store
        const instance = player.current;
        if (!instance) return;

        return instance.subscribe((state) => {
            setPlaying(state.playing);
            setDuration(state.duration);
            setCurrentTime(state.currentTime);
            setVolume(state.volume);
            setMuted(state.muted);
            setFullscreen(state.fullscreen);

            // Guard against immediate end (transcode failure/boot loop)
            // Only end if we've actually played something (e.g. > 30s or > 5% of duration?)
            // Using 15s to be safe for shorter testing clips.
            if (state.ended && state.currentTime > 15) {
                onEnded?.();
            }
        });
    }, [src, onEnded, setPlaying, setDuration, setCurrentTime, setVolume, setMuted, setFullscreen]);

    // Key Logging for Debugging
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('[VideoPlayer KeyLog] Time:', Date.now(), '| Pressed:', e.key, '| Code:', e.code, '| Ctrl:', e.ctrlKey, '| Shift:', e.shiftKey);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
            <MediaPlayer
                ref={player}
                title={title}
                src={src}
                className="w-full h-full"
                aspectRatio="16/9"
                load="eager"
                poster={poster}
                crossOrigin="anonymous" // Helpful for local servers
                onCanPlay={() => console.log('[VideoPlayer] Event: can-play')}
                onWaiting={() => console.log('[VideoPlayer] Event: waiting')}
                onLoadStart={() => console.log('[VideoPlayer] Event: load-start', src)}
                onError={(e) => {
                     console.error('[VideoPlayer] Event: error', e);
                     if (window.electron && window.electron.ipcRenderer.log) {
                         window.electron.ipcRenderer.log(`[VideoPlayer Error] ${JSON.stringify(e)}`);
                     }
                }}
            >
                <MediaProvider>
                    <Poster className="vds-poster" />
                    {subtitles?.map((track, i) => (
                        <Track 
                            key={String(i)} 
                            src={track.src} 
                            kind={track.kind as any} 
                            label={track.label} 
                            language={track.language} 
                            default={track.default} 
                        />
                    ))}
                </MediaProvider>

                {/* 
                  Using Default Layout for now. 
                  In Phase 4 (Custom Controls), we can replace this with our own UI 
                  using Radix/manual controls if desired, but Vidstack's default is very premium customization friendly.
                */}
                <DefaultVideoLayout icons={defaultLayoutIcons} />
            </MediaPlayer>
        </div>
    );
}
