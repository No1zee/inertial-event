"use client";

import { useEffect, useRef, useState } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track, useMediaState } from '@vidstack/react';
import type { MediaPlayerInstance } from '@vidstack/react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { usePlayerStore } from '@/lib/store/playerStore';
import PlayerControls from './overlay/PlayerControls';
import SettingsOverlay from './overlay/SettingsOverlay';
import { useSettingsStore } from '@/lib/store/settingsStore';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    type?: 'movie' | 'tv' | 'local' | 'torrent';
    subtitles?: { kind: string; src: string; label: string; language: string; default?: boolean }[];
    onEnded?: () => void;
}

export function VideoPlayer({ src, poster, title, type = 'movie', subtitles, onEnded }: VideoPlayerProps) {
    const player = useRef<MediaPlayerInstance>(null);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const settings = useSettingsStore();

    const {
        setPlaying,
        setDuration,
        setCurrentTime,
        setVolume,
        setMuted,
        setFullscreen
    } = usePlayerStore();

    // Use Vidstack hooks for granular state if needed, or stick to instance subscription
    const currentTime = useMediaState('currentTime', player);
    const duration = useMediaState('duration', player);
    const isPaused = useMediaState('paused', player);
    const volume = useMediaState('volume', player);
    const isMuted = useMediaState('muted', player);
    const isFullscreen = useMediaState('fullscreen', player);

    useEffect(() => {
        const instance = player.current;
        if (!instance) return;

        return instance.subscribe((state) => {
            setPlaying(state.playing);
            setDuration(state.duration);
            setCurrentTime(state.currentTime);
            setVolume(state.volume);
            setMuted(state.muted);
            setFullscreen(state.fullscreen);

            if (state.ended && state.currentTime > 15) {
                onEnded?.();
            }
        });
    }, [src, onEnded, setPlaying, setDuration, setCurrentTime, setVolume, setMuted, setFullscreen]);

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (!isPaused) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 5000);
        }
    };

    const handleToggleFullscreen = () => {
        if (!player.current) return;
        if (isFullscreen) {
            player.current.exitFullscreen();
        } else {
            player.current.enterFullscreen();
        }
    };

    // Track Selection Logic
    const [activeTrackIndex, setActiveTrackIndex] = useState(-1);
    
    const handleTrackChange = (index: number) => {
        if (!player.current) return;
        const tracks = player.current.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track) {
                track.mode = i === index ? 'showing' : 'disabled';
            }
        }
        setActiveTrackIndex(index);
    };

    return (
        <div 
            className="relative w-full h-full bg-black overflow-hidden group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => !isPaused && setShowControls(false)}
        >
            <MediaPlayer
                ref={player}
                title={title}
                src={src}
                className="w-full h-full"
                load="eager"
                poster={poster}
                crossOrigin="anonymous"
                onCanPlay={() => {
                    handleMouseMove();
                    // Apply initial volume
                    if (player.current) player.current.volume = settings.volume;
                }}
            >
                <MediaProvider>
                    <Poster className="vds-poster" />
                    {subtitles?.map((track, i) => (
                        <Track key={`${track.src}-${i}`} {...track} kind={track.kind as any} />
                    ))}
                </MediaProvider>

                {/* NO DEFAULT LAYOUT - Using Custom Overlay */}
            </MediaPlayer>

            {/* Premium Overlay */}
            <PlayerControls
                show={showControls}
                title={title || "Now Playing"}
                currentTime={currentTime}
                duration={duration}
                isPaused={isPaused}
                volume={volume}
                isMuted={isMuted}
                isSaved={false}
                downloadUrl={null}
                type={type}
                season="1"
                episode="1"
                onTogglePlay={() => isPaused ? player.current?.play() : player.current?.pause()}
                onSeek={(time) => {
                    if (player.current) player.current.currentTime = time;
                }}
                onVolumeChange={(v) => {
                    if (player.current) player.current.volume = v;
                    settings.setVolume(v);
                }}
                onToggleMute={() => {
                    if (player.current) player.current.muted = !isMuted;
                }}
                onToggleLibrary={() => {}}
                onDownload={() => {}}
                onToggleSettings={() => setShowSettings(!showSettings)}
                onTogglePiP={() => {
                    if (player.current) {
                        if (document.pictureInPictureElement) {
                            document.exitPictureInPicture();
                        } else {
                            // Try to access the HTML media element for Picture-in-Picture
                            const mediaEl = player.current.el?.querySelector('video, audio') as HTMLVideoElement;
                            mediaEl?.requestPictureInPicture?.();
                        }
                    }
                }}
                onToggleCast={() => {}}
                onToggleFullscreen={handleToggleFullscreen}
            />

            <SettingsOverlay
                show={showSettings}
                onClose={() => setShowSettings(false)}
                tracks={subtitles?.map((s, i) => ({ label: s.label, language: s.language, active: i === activeTrackIndex })) || []}
                audioTracks={[]} // Native HLS audio tracks could be mapped here if needed
                qualities={[]}
                playbackSpeed={1}
                onTrackChange={handleTrackChange}
                onAudioTrackChange={() => {}}
                onQualityChange={() => {}}
                onSpeedChange={(s) => {
                    if (player.current) player.current.playbackRate = s;
                }}
            />
        </div>
    );
}
