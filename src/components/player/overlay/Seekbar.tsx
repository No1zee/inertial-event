"use client";

import React, { useState, useEffect, useRef } from 'react';

interface SeekbarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    buffered?: number; // 0-1 or 0-duration, future proofing
    className?: string;
}

// Helper: Format Seconds to MM:SS
const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Seekbar({ currentTime, duration, onSeek, buffered, className = "" }: SeekbarProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [localValue, setLocalValue] = useState(0);
    
    // safe inputs
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const safeTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;

    // Sync local value with prop when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalValue(safeTime);
        }
    }, [safeTime, isDragging]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsDragging(true);
        setLocalValue(parseFloat(e.target.value));
    };

    const handleCommit = () => {
        setIsDragging(false);
        onSeek(localValue);
    };

    return (
        <div className={`flex items-center gap-3 w-full group/progress ${className}`}>
            {/* Current Time */}
            <span className="text-xs font-medium text-white/80 w-10 text-right tabular-nums">
                {formatTime(isDragging ? localValue : safeTime)}
            </span>

            {/* Slider */}
            <div className="relative flex-1 h-4 flex items-center">
                 {/* Buffer Bar (Future) */}
                 {/* <div className="absolute left-0 h-1 bg-white/20 rounded-lg w-full" /> */}

                 <input
                    type="range"
                    min={0}
                    max={safeDuration || 100}
                    step={0.1}
                    value={isDragging ? localValue : safeTime}
                    onChange={handleChange}
                    onMouseUp={handleCommit}
                    onTouchEnd={handleCommit}
                    onKeyUp={(e) => { 
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') handleCommit(); 
                    }}
                    aria-label="Seek slider"
                    className="
                        relative z-10 w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer 
                        focus:outline-none focus:bg-white/30
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                        [&::-webkit-slider-thumb]:bg-purple-500 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:transition-transform 
                        [&::-webkit-slider-thumb]:duration-150
                        hover:[&::-webkit-slider-thumb]:scale-125
                        active:[&::-webkit-slider-thumb]:scale-150
                    "
                    style={{
                        backgroundSize: `${(localValue * 100) / (safeDuration || 1)}% 100%`,
                        backgroundImage: `linear-gradient(#a855f7, #a855f7)` // Purple fill track
                    }}
                />
            </div>

            {/* Duration */}
            <span className="text-xs font-medium text-white/60 w-10 tabular-nums">
                {formatTime(safeDuration)}
            </span>
        </div>
    );
}
