"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export const StatsOverlay: React.FC = () => {
    const [fps, setFps] = useState(0);
    const [memory, setMemory] = useState<any>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const frames = useRef(0);
    const lastTime = useRef(performance.now());
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show in development
        if (process.env.NODE_ENV === 'production') return;

        // Toggle visibility with Shift+D
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'D') {
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        const handleSourceUpdate = (e: any) => {
            setSourceUrl(e.detail);
        };
        window.addEventListener('ag-player-source', handleSourceUpdate);

        const updateStats = () => {
            const now = performance.now();
            frames.current++;

            if (now >= lastTime.current + 1000) {
                setFps(Math.round((frames.current * 1000) / (now - lastTime.current)));
                frames.current = 0;
                lastTime.current = now;

                // Memory is non-standard but available in Chrome/Electron
                if ((performance as any).memory) {
                    const mem = (performance as any).memory;
                    setMemory({
                        used: Math.round(mem.usedJSHeapSize / 1048576),
                        total: Math.round(mem.totalJSHeapSize / 1048576),
                        limit: Math.round(mem.jsHeapSizeLimit / 1048576)
                    });
                }
            }

            if (isVisible) {
                requestAnimationFrame(updateStats);
            }
        };

        if (isVisible) {
            requestAnimationFrame(updateStats);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('ag-player-source', handleSourceUpdate);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 min-w-[140px] animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
                    <Activity size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">System Performance</span>
                </div>
                
                <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded-md">
                    <span className="text-xs text-zinc-500">FPS</span>
                    <span className={`text-xs font-mono font-bold ${fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {fps}
                    </span>
                </div>

                {memory && (
                    <div className="flex flex-col gap-1.5 bg-white/5 px-2 py-2 rounded-md">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                            <span>JS HEAP</span>
                            <span className="text-zinc-300 font-mono">{memory.used}MB / {memory.total}MB</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ width: `${(memory.used / memory.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
                
                {sourceUrl && (
                    <div className="flex flex-col gap-1 bg-white/5 px-2 py-2 rounded-md overflow-hidden">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">Active Source</span>
                        <div className="text-[10px] text-zinc-300 font-mono break-all line-clamp-2 select-all cursor-pointer hover:text-emerald-400 transition-colors" 
                             onClick={() => {
                                navigator.clipboard.writeText(sourceUrl);
                             }}
                             title="Click to copy source URL"
                        >
                            {sourceUrl}
                        </div>
                    </div>
                )}
                
                <div className="text-[9px] text-zinc-600 text-center mt-1 italic">
                    Press Shift+D to hide
                </div>
            </div>
        </div>
    );
};
