'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play, Pause, Maximize, Share2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface TrailerPlayerProps {
  trailerKey: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TrailerPlayer({ trailerKey, title, isOpen, onClose }: TrailerPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // NovaStream Volume Guard: Force 100% volume and Playback via YouTube API
  useEffect(() => {
    if (!isOpen || !isReady || !iframeRef.current) return;

    const enforceAudio = () => {
      if (!iframeRef.current?.contentWindow) return;
      
      try {
        // Send YouTube Player API commands
        const commands = [
          { event: 'command', func: 'unMute' },
          { event: 'command', func: 'setVolume', args: [100] },
          { event: 'command', func: 'playVideo' }
        ];

        commands.forEach(cmd => {
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
        });
      } catch (err) {
        console.warn('NovaStream: Trailer Volume Guard failed', err);
      }
    };

    // Immediate enforcement
    enforceAudio();

    // Persistent guard (every 2 seconds during trailer playback)
    const interval = setInterval(enforceAudio, 2000);
    return () => clearInterval(interval);
  }, [isOpen, isReady, isMuted, isPlaying]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Cinematic Backdrop Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,transparent_70%)] pointer-events-none" />

        {/* Branded Loading State */}
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
            <div className="w-16 h-16 border-2 border-white/10 border-t-white rounded-full animate-spin mb-6" />
            <PretextHeadline 
              text="Initializing Cinematic Preview" 
              fontSize={10} 
              fontWeight={900} 
              letterSpacing="0.4em" 
              className="text-zinc-500 uppercase"
            />
          </div>
        )}

        {/* Video Container */}
        <div className="relative w-full h-full max-w-[100vw] aspect-video">
          <iframe
            ref={iframeRef}
            title={`Trailer: ${title}`}
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&mute=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-1000",
              isReady ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsReady(true)}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />

          {/* Institutional Control Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                <Play size={18} fill="currentColor" />
              </div>
              <div>
                <PretextHeadline 
                  text="Now Playing: Trailer" 
                  fontSize={10} 
                  fontWeight={900} 
                  letterSpacing="0.3em" 
                  className="text-primary uppercase mb-1"
                />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
              </div>
            </div>

            <button 
              onClick={onClose}
              title="Close Preview"
              aria-label="Close Trailer Preview"
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          {/* Bottom Bar Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-12 flex items-end justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ 
                    event: 'command', 
                    func: isPlaying ? 'pauseVideo' : 'playVideo' 
                  }), '*');
                }}
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause Trailer" : "Play Trailer"}
                className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>

              <button 
                onClick={() => {
                  const nextMute = !isMuted;
                  setIsMuted(nextMute);
                  iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ 
                    event: 'command', 
                    func: nextMute ? 'mute' : 'unMute' 
                  }), '*');
                }}
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute Trailer" : "Mute Trailer"}
                className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Cinema Grade 4K</span>
              </div>
              
              <button 
                title="Share Trailer"
                aria-label="Share Trailer"
                className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <Share2 size={18} />
              </button>
              
              <button 
                title="Fullscreen Preview"
                aria-label="Fullscreen Preview"
                className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>

          {/* UI Scanlines Decor */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

