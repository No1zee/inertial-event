"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { Info } from 'lucide-react';
import HLS from 'hls.js';
import { logger } from '../../utils/logger';

interface VidstackPlayerProps {
    src: string;
    type: 'hls' | 'mp4' | 'torrent';
    title?: string;
    poster?: string;
    subtitles?: Array<{ lang: string; url: string; label?: string }>;
    skipRanges?: Array<{ type: 'op' | 'ed'; start: number; end: number }>;
    initialTime?: number;
    onProgressUpdate?: (time: number, duration: number) => void;
    onEnded?: () => void;
    onError?: (err: any) => void;
}

export const VidstackPlayer: React.FC<VidstackPlayerProps> = ({
    src,
    type,
    title,
    poster,
    subtitles = [],
    skipRanges = [],
    initialTime = 0,
    onProgressUpdate,
    onEnded,
    onError
}) => {
    const playerRef = useRef<any>(null);
    const [hlsErrorCount, setHlsErrorCount] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const MAX_HLS_RECOVERIES = 5;

    const handleHlsError = (event: any, data: any) => {
        if (data.fatal) {
            logger.warn('VidstackPlayer', `[AG] Fatal HLS Error: ${data.type} - ${data.details}`, data);
            setHlsErrorCount(prev => prev + 1);

            if (hlsErrorCount < MAX_HLS_RECOVERIES) {
                switch (data.type) {
                    case 'networkError':
                        logger.info('VidstackPlayer', '[AG] Attempting to recover from network error...');
                        data.hls.startLoad();
                        break;
                    case 'mediaError':
                        logger.info('VidstackPlayer', '[AG] Attempting to recover from media error...');
                        data.hls.recoverMediaError();
                        break;
                    default:
                        logger.error('VidstackPlayer', '[AG] Unrecoverable HLS error', data);
                        onError?.(data);
                        break;
                }
            } else {
                logger.error('VidstackPlayer', '[AG] Max HLS recoveries reached', data);
                onError?.(data);
            }
        }
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group">
            <MediaPlayer
                ref={playerRef}
                title={title}
                src={src}
                className="w-full h-full"
                onTimeUpdate={(e: any) => {
                    // Vidstack 1.0 event detail structure handling
                    // Inspecting the types, it's often a CustomEvent with detail directly
                    const time = e.currentTime || e.detail?.currentTime || 0;
                    const dur = e.duration || e.detail?.duration || 0;
                    setCurrentTime(time);
                    setDuration(dur);
                    onProgressUpdate?.(time, dur);
                }}
                onEnded={onEnded}
            >
                <MediaProvider>
                    {poster && (
                        <img
                            className="vds-poster object-cover"
                            src={poster}
                            alt={title}
                            loading="eager"
                        />
                    )}
                </MediaProvider>

                <DefaultVideoLayout
                    icons={defaultLayoutIcons}
                />

                {/* Subtitle Injection */}
                {subtitles.map((sub, i) => (
                    <track
                        key={i}
                        kind="subtitles"
                        src={sub.url}
                        label={sub.label || sub.lang.toUpperCase()}
                        srcLang={sub.lang}
                        default={i === 0}
                    />
                ))}
            </MediaPlayer>

            {/* Skip Button Overlay integration */}
            <SkipButton currentTime={currentTime} skipRanges={skipRanges} onSkip={(to) => playerRef.current?.seek(to)} />

            {/* Error Overlay Fallback (SPEC-UX-TV "Total Failure" Slate) */}
            {hlsErrorCount >= MAX_HLS_RECOVERIES && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl text-white p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Info className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Transmission Interrupted</h3>
                    <p className="text-neutral-400 mb-8 max-w-sm">No healthy sources found. We've exhausted all mirrors for this signal.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-10 py-4 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                    >
                        Try Mirror Refresh
                    </button>
                </div>
            )}
        </div>
    );
};

// Sub-component for Skip Button logic
const SkipButton: React.FC<{ currentTime: number, skipRanges: any[], onSkip: (to: number) => void }> = ({ currentTime, skipRanges, onSkip }) => {
    const activeRange = skipRanges.find(range => currentTime >= range.start && currentTime <= range.end);

    if (!activeRange) return null;

    return (
        <button
            onClick={() => onSkip(activeRange.end)}
            className="absolute bottom-24 left-10 z-50 px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg backdrop-blur-md font-bold flex items-center space-x-3 transition-all animate-in slide-in-from-left-5 fade-in"
        >
            <span className="text-xs uppercase tracking-widest opacity-60">Skip</span>
            <span>{activeRange.type === 'op' ? 'Opening' : 'Ending'}</span>
        </button>
    );
};

export default VidstackPlayer;
