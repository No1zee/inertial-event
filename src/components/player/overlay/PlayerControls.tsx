"use client";

import React from 'react';
import { ArrowLeft, HeartHandshake, Heart, Download, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause, PictureInPicture, Zap, Maximize, Settings, Cast } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Local Helper
const formatTimeLocal = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface PlayerControlsProps {
    show: boolean;
    title: string;
    subTitle?: string;
    backUrl?: string; // Explicit back path override
    currentTime: number;
    duration: number;
    isPaused: boolean;
    volume: number;
    isMuted: boolean;
    isSaved: boolean;
    downloadUrl: string | null;
    isSeeking: boolean;
    seekValue: number;

    // Series Specific
    type: 'movie' | 'tv' | 'local' | 'torrent';
    isTorrent?: boolean;
    season: string;
    episode: string;
    seasons?: any[];

    // Actions
    onTogglePlay: () => void;
    onSeekChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSeekCommit: () => void;
    onVolumeChange: (volume: number) => void;
    onToggleMute: () => void;
    onToggleLibrary: () => void;
    onDownload: () => void;
    onToggleSettings: () => void;
    onTogglePiP: () => void;
    onToggleCast: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onSeasonChange?: (s: number) => void;
    onEpisodeChange?: (e: string) => void;
    onStartOver?: () => void;
    onToggleFullscreen: () => void;
    onBack?: () => void; // New Prop

    // Debug / State
    providerType?: string;
    tracks?: any[];
    audioTracks?: any[];
    qualities?: any[];
    skipParams?: { type: 'intro' | 'credits'; to: number } | null;
    onSkip?: (time: number) => void;
    hideBottom?: boolean;
}

export default function PlayerControls({
    show, title, subTitle, backUrl, currentTime, duration, isPaused, volume, isMuted, isSaved, downloadUrl,
    isSeeking, seekValue, type, isTorrent, season, episode, seasons,
    onTogglePlay, onSeekChange, onSeekCommit, onVolumeChange, onToggleMute,
    onToggleLibrary, onDownload, onToggleSettings, onTogglePiP, onToggleCast,
    onNext, onPrev, onSeasonChange, onEpisodeChange, onToggleFullscreen,
    hideBottom, onBack,
    ...props // Capture debug props
}: PlayerControlsProps) {

    const router = useRouter();
    const currentSeasonNum = parseInt(season);
    const currentEpisodeNum = parseInt(episode);

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const safeTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
    const displayTime = isSeeking ? seekValue : safeTime;

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backUrl) {
            router.push(backUrl);
        } else {
            router.push('/');
        }
    };

    return (
        <div className={`absolute inset-0 z-[100] flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${show ? 'opacity-100' : 'opacity-0'}`}>

            {/* --- TOP BAR --- */}
            <div className={`pointer-events-auto bg-gradient-to-b from-black via-black/90 to-transparent p-6 pb-20 flex items-center transition-transform duration-300 gap-4 ${show ? 'translate-y-0' : '-translate-y-full'}`}>
                
                {/* Back Button */}
                <button onClick={handleBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors">
                    <ArrowLeft size={24} />
                </button>

                {/* LEFT: Title */}
                <div className="flex-1">
                    <div className="flex flex-col text-shadow">
                        <span className="text-white font-bold text-lg">{title}</span>
                        {subTitle && <span className="text-white/60 text-xs font-medium">{subTitle}</span>}
                    </div>
                </div>

                {/* CENTER: Main Control Icons */}
                <div className="flex-1 flex justify-center items-center gap-3">
                    {/* Torrent Indicator Badge */}
                    {(type === 'torrent' || isTorrent) && (
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-600/30 backdrop-blur-sm rounded-full border border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse">
                            <Zap size={20} className="text-purple-300 drop-shadow-[0_0_5px_rgba(147,51,234,0.8)]" fill="currentColor" />
                        </div>
                    )}

                    <button onClick={onToggleLibrary} aria-label={isSaved ? "Remove from Library" : "Add to Library"} className={`p-2.5 rounded-full backdrop-blur-md transition-all ${isSaved ? 'bg-purple-600/80 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}>
                        {isSaved ? <HeartHandshake size={20} aria-hidden="true" /> : <Heart size={20} aria-hidden="true" />}
                    </button>
                    {/* Download Button */}
                    <button
                        disabled={!downloadUrl}
                        onClick={onDownload}
                        aria-label="Download video"
                        className={`p-2.5 rounded-full backdrop-blur-md transition-all ${downloadUrl ? 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        title={downloadUrl ? "Download" : "Waiting for stream..."}
                    >
                        <Download size={20} aria-hidden="true" />
                    </button>

                    {/* Fullscreen (Top-level utility) */}
                    <button onClick={onToggleFullscreen} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md">
                        <Maximize size={20} />
                    </button>
                </div>

                {/* RIGHT: Series Navigation - REMOVED (Duplicate) */}
                <div className="flex-1 flex justify-end">
                </div>
            </div>


            {/* --- BOTTOM CONTROLS --- */}
            {!hideBottom && (
                <div className={`pointer-events-auto bg-gradient-to-t from-black via-black/95 to-transparent pt-40 pb-8 px-6 transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}>
                    
                    {/* Skip Button (Intro/Credits) */}
                    {props.skipParams && (
                        <div className="absolute -top-12 left-6 animate-fade-in-up">
                            <button
                                onClick={() => {
                                    // Calculate seek target
                                    if (props.skipParams?.to) {
                                    // Seek to end of intro
                                    const target = props.skipParams.to + 0.5;
                                    // We need to trigger the seek via prop, but onChange handles slider event.
                                    // We can fake an event or use a new prop. For now, use onSeekCommit hacks or expose a direct seek method.
                                    // Actually, the parent handles commands. We should lift this up or use onSeekChange directly?
                                    // Better: add onSkip prop.
                                    if (props.onSkip) props.onSkip(target);
                                    }
                                }}
                                className="flex items-center gap-2 bg-white/90 hover:bg-white text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105"
                            >
                                <Zap size={16} fill="currentColor" />
                                {props.skipParams.type === 'intro' ? 'SKIP INTRO' : 'SKIP CREDITS'}
                            </button>
                        </div>
                    )}

                    {/* Progress Bar - Only functional on Electron */}
                    {!hideBottom && (
                        <div className="flex items-center gap-3 mb-4 group/progress">
                            <span className="text-xs font-medium text-white/80 w-10 text-right">{formatTimeLocal(displayTime)}</span>
                            <input
                                type="range"
                                min={0}
                                max={safeDuration || 100}
                                value={Math.min(displayTime, safeDuration || 100)}
                                step={0.1}
                                onChange={onSeekChange}
                                onMouseUp={onSeekCommit}
                                onTouchEnd={onSeekCommit} // For mobile
                                aria-label="Seek slider"
                                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                            />
                            <span className="text-xs font-medium text-white/60 w-10">{formatTimeLocal(safeDuration)}</span>
                        </div>
                    )}

                    {/* Main Button Row */}
                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-6">
                            {/* Play/Pause & Volume - Functionally restricted on Web */}
                            {!hideBottom && (
                                <>
                                    <button onClick={onTogglePlay} aria-label={isPaused ? "Play" : "Pause"} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                        {isPaused ? <Play size={32} fill="currentColor" aria-hidden="true" /> : <Pause size={32} fill="currentColor" aria-hidden="true" />}
                                    </button>
            
                                    <div className="flex items-center gap-2 group/vol">
                                        <button onClick={onToggleMute} aria-label={isMuted ? "Unmute" : "Mute"} className="text-white/80 hover:text-white">
                                            {volume === 0 ? <VolumeX size={24} aria-hidden="true" /> : <Volume2 size={24} aria-hidden="true" />}
                                        </button>
                                        <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                                            <input
                                                type="range"
                                                min={0}
                                                max={2.5}
                                                step={0.1}
                                                value={isMuted ? 0 : volume}
                                                onChange={(e) => {
                                                    const newVolume = parseFloat(e.target.value);
                                                    onVolumeChange(newVolume);
                                                    if (isMuted && newVolume > 0) {
                                                        onToggleMute();
                                                    }
                                                }}
                                                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer ml-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TV SERIES NAVIGATION */}
                            {type === 'tv' && seasons && (
                                <div className="flex items-center gap-2 ml-4">
                                    <button onClick={onPrev} aria-label="Previous episode" className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors" disabled={currentSeasonNum === 1 && currentEpisodeNum === 1}>
                                        <ChevronLeft size={20} aria-hidden="true" />
                                    </button>

                                    <div className="flex items-center gap-0 bg-white/10 rounded-md border border-white/5 overflow-hidden">
                                        <select
                                            className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer hover:bg-white/5 px-2 py-1.5 appearance-none text-center min-w-[3rem]"
                                            value={currentSeasonNum}
                                            aria-label="Select Season"
                                            onChange={(e) => onSeasonChange && onSeasonChange(Number(e.target.value))}
                                        >
                                            {seasons.filter((s: any) => s.season_number > 0).map((s: any) => (
                                                <option key={s.id} value={s.season_number} className="bg-zinc-900 text-left">S{s.season_number}</option>
                                            ))}
                                        </select>
                                        <div className="w-[1px] h-4 bg-white/10" />
                                        <select
                                            className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer hover:bg-white/5 px-2 py-1.5 appearance-none text-center min-w-[3rem]"
                                            value={currentEpisodeNum}
                                            aria-label="Select Episode"
                                            onChange={(e) => onEpisodeChange && onEpisodeChange(e.target.value)}
                                        >
                                            {(() => {
                                                const seasonData = seasons.find((s: any) => s.season_number === currentSeasonNum);
                                                const count = seasonData?.episode_count || 1;
                                                return Array.from({ length: count }, (_, i) => i + 1).map(ep => (
                                                    <option key={ep} value={ep} className="bg-zinc-900 text-left">E{ep}</option>
                                                ));
                                            })()}
                                        </select>
                                    </div>

                                    <button onClick={onNext} aria-label="Next episode" className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                                        <ChevronRight size={20} aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Side Controls (Settings, PiP & Fullscreen) */}
                        <div className="flex items-center gap-4">
                            {/* Settings Button (Languages/Quality) - Only functional on Electron */}
                            {!hideBottom && (
                                <button
                                    onClick={onToggleSettings}
                                    aria-label="Settings"
                                    className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
                                    title="Settings (Audio & Subtitles)"
                                >
                                    <Settings size={20} aria-hidden="true" />
                                </button>
                            )}

                            {/* Cast Button */}
                            <button
                                onClick={onToggleCast}
                                aria-label="Cast to TV"
                                className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
                                title="Cast to TV"
                            >
                                <Cast size={20} aria-hidden="true" />
                            </button>

                            {/* PiP Button */}
                            <button
                                onClick={onTogglePiP}
                                aria-label="Toggle Picture in Picture"
                                className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
                                title="Picture in Picture"
                            >
                                <PictureInPicture size={20} aria-hidden="true" />
                            </button>

                            {/* Fullscreen Button */}
                            <button
                                onClick={onToggleFullscreen}
                                aria-label="Toggle Fullscreen"
                                className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
                                title="Fullscreen"
                            >
                                <Maximize size={20} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
