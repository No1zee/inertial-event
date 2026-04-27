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
  const { data: details, isLoading } = useContentDetails(id, type === 'anime' ? 'tv' : type);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const trailerKey = details?.trailer;

  useEffect(() => {
    if (!show) {
      setIsReady(false);
    }
  }, [show]);

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
          src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-1000",
            isReady ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsReady(true)}
          allow="autoplay; encrypted-media"
        />
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
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
