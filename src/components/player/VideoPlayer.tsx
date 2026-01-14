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

            if (state.ended) onEnded?.();
        });
    }, [src, onEnded, setPlaying, setDuration, setCurrentTime, setVolume, setMuted, setFullscreen]);

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
            >
                <MediaProvider>
                    <Poster className="vds-poster" />
                    {subtitles?.map((track, i) => (
                        <Track key={i} {...track} kind="subtitles" />
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
