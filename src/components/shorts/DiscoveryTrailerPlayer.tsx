'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface DiscoveryTrailerPlayerProps {
  trailerKey: string;
  isActive: boolean;
  muted: boolean;
  onReady?: () => void;
}

export function DiscoveryTrailerPlayer({ trailerKey, isActive, muted, onReady }: DiscoveryTrailerPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isActive || !isReady || !iframeRef.current) return;

    const syncPlayer = () => {
      if (!iframeRef.current?.contentWindow) return;
      
      try {
        const commands = [
          { event: 'command', func: muted ? 'mute' : 'unMute', args: [] },
          { event: 'command', func: 'setVolume', args: [100] },
          { event: 'command', func: isActive ? 'playVideo' : 'pauseVideo', args: [] }
        ];

        commands.forEach(cmd => {
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
        });
      } catch (err) {
        // Silent fail for non-critical sync
      }
    };

    syncPlayer();
    const interval = setInterval(syncPlayer, 3000);
    return () => clearInterval(interval);
  }, [isActive, isReady, muted]);

  const hostOrigin = 'https://www.youtube.com';
  const src = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&mute=${muted ? 1 : 0}&enablejsapi=1&loop=1&playlist=${trailerKey}&origin=${hostOrigin}&widget_referrer=${hostOrigin}`;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <iframe
        ref={iframeRef}
        src={src}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-1000 pointer-events-none scale-[1.5]",
          isReady && isActive ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => {
          setIsReady(true);
          onReady?.();
        }}
        allow="autoplay; encrypted-media; fullscreen"
      />
      
      {/* Ambient Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
    </div>
  );
}
