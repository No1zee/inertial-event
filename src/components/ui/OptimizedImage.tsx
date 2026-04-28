'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
  containerClassName?: string;
}

/**
 * Institutional Optimized Image Component (v2)
 *
 * Performance Wins:
 * 1. Uses Next.js native Image loader (custom wsrv.nl integration)
 * 2. Zero-useEffect architecture for hydration stability.
 * 3. Atomic state management for reveal transitions.
 * 4. Explicit aspect ratio enforcement via parent containers.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  containerClassName,
  className,
  onLoad,
  priority = false,
  fill,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If no src, use fallback immediately
  const finalSrc = !src || src === '' || error ? fallbackSrc : src;

  return (
    <div
      className={cn(
        'overflow-hidden bg-zinc-900/40 relative',
        fill ? 'absolute inset-0' : 'w-full h-full',
        containerClassName
      )}
    >
      <Image
        src={finalSrc}
        alt={alt || 'Media asset'}
        priority={priority}
        fill={fill}
        unoptimized={finalSrc.startsWith('/') && !finalSrc.startsWith('/t/p/') && !(/^\/[a-zA-Z0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(finalSrc))}
        onLoad={e => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={() => {
          setError(true);
        }}
        className={cn(
          'transition-all duration-[0.8s] cubic-bezier(0.4, 0, 0.2, 1)',
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md',
          className
        )}
        // The loader is globally defined in next.config.js
        {...props}
      />

      {/* Cinematic Shimmer Placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 z-10 bg-zinc-900 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
        </div>
      )}
    </div>
  );
};
