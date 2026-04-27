'use client';

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
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Seekbar({ currentTime, duration, onSeek, buffered: _buffered, className = '' }: SeekbarProps) {
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

  const seekbarRef = useRef<HTMLInputElement>(null);

  // Sync CSS variables for custom progress track
  useEffect(() => {
    if (seekbarRef.current) {
      const percent = (localValue * 100) / (safeDuration || 1);
      seekbarRef.current.style.setProperty('--bg-size', `${percent}% 100%`);
      seekbarRef.current.style.setProperty(
        '--bg-image',
        `linear-gradient(hsl(var(--brand-primary)), hsl(var(--brand-primary)))`
      );
    }
  }, [localValue, safeDuration]);

  return (
    <div className={`flex items-center gap-3 w-full group/progress ${className}`}>
      {/* Current Time */}
      <span className="text-xs font-medium text-white/80 w-10 text-right tabular-nums">
        {formatTime(isDragging ? localValue : safeTime)}
      </span>

      {/* Slider */}
      <div className="relative flex-1 h-4 flex items-center">
        <input
          ref={seekbarRef}
          type="range"
          min={0}
          max={safeDuration || 100}
          step={0.1}
          value={isDragging ? localValue : safeTime}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className={`
                        absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-runnable-track]:h-full
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:h-full
                        [&::-webkit-slider-thumb]:w-0.5
                        [&::-webkit-slider-thumb]:bg-[hsl(var(--brand-leaf))]
                        [&::-webkit-slider-thumb]:shadow-[-1px_0_10px_hsla(var(--brand-primary),0.8)]
                        group-hover:[&::-webkit-slider-thumb]:w-3
                        group-hover:[&::-webkit-slider-thumb]:h-3
                        group-hover:[&::-webkit-slider-thumb]:-translate-y-1/3
                        group-hover:[&::-webkit-slider-thumb]:rounded-full
                        group-hover:[&::-webkit-slider-thumb]:bg-white
                        group-hover:[&::-webkit-slider-thumb]:border-2
                        group-hover:[&::-webkit-slider-thumb]:border-[hsl(var(--brand-primary))]
                        transition-all duration-200
                        dynamic-bg-size
                        dynamic-bg-image
                    `}
        />
      </div>

      {/* Duration */}
      <span className="text-xs font-medium text-white/60 w-10 tabular-nums">{formatTime(safeDuration)}</span>
    </div>
  );
}
