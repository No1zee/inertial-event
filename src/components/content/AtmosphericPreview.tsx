'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentDetails } from '@/hooks/queries/useContent';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AtmosphericPreviewProps {
  id: string | number;
  type: 'movie' | 'tv' | 'anime';
  show: boolean;
  onEnded?: () => void;
}

export function AtmosphericPreview({ id, type, show }: AtmosphericPreviewProps) {
  // Use a staleTime of Infinity to ensure we don't refetch if already prefetched by ContentCard
  const { data: details, isLoading } = useContentDetails(id, type === 'anime' ? 'tv' : type);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const trailerKey = details?.trailer;

  useEffect(() => {
    if (!show) {
      setIsReady(false);
    }
  }, [show]);

  // NovaStream Volume Guard: Force 100% volume and Playback via YouTube API
  useEffect(() => {
    if (!show || !isReady || !videoRef.current) return;

    const enforceAudio = () => {
      if (!videoRef.current?.contentWindow) return;
      
      try {
        // Send YouTube Player API commands to force 100% volume and unmute
        const commands = [
          { event: 'command', func: 'unMute' },
          { event: 'command', func: 'setVolume', args: [100] },
          { event: 'command', func: 'playVideo' }
        ];

        commands.forEach(cmd => {
          videoRef.current?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
        });
      } catch (err) {
        console.warn('NovaStream: Atmospheric Volume Guard failed', err);
      }
    };

    // Immediate enforcement
    enforceAudio();

    // Persistent guard (every 2 seconds while showing)
    const interval = setInterval(enforceAudio, 2000);
    return () => clearInterval(interval);
  }, [show, isReady]);

  if (!show || !trailerKey) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-10 bg-black overflow-hidden pointer-events-none"
    >
      <div className="relative w-full h-full scale-[1.3] transform-gpu">
        <iframe
          title="Trailer"
          ref={videoRef}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=https://www.youtube.com&widget_referrer=https://www.youtube.com`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-1000",
            isReady ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsReady(true)}
          allow="autoplay; encrypted-media"
        />
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-3 right-3 z-20 flex gap-2">
         {/* Mute toggle could go here if we wanted interactive previews */}
      </div>
    </motion.div>
  );
}

