'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import imageLoader from '@/lib/utils/imageLoader';

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
  unoptimized,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Determine if we have a valid source
  const hasValidSrc = src && src !== '' && !error;
  const finalSrc = hasValidSrc ? src : (fallbackSrc || '');

  // Local assets should be unoptimized and NOT use the custom loader
  const isLocalAsset = 
    finalSrc.startsWith('/') && 
    !finalSrc.startsWith('/t/p/') &&
    (finalSrc.startsWith('/_next/') || 
     finalSrc.startsWith('/images/') || 
     finalSrc.startsWith('/icons/') || 
     finalSrc.startsWith('/providers/') || 
     finalSrc.startsWith('/brand/') ||
     finalSrc.startsWith('/avatars/') ||
     finalSrc.includes('placeholder'));

  const isAlreadyProxied = finalSrc.includes('wsrv.nl');
  const isUnoptimized = isLocalAsset || (unoptimized && isAlreadyProxied);

  // Use a hash-based color for the error gradient to make it feel more "intended"
  const getBrandGradient = () => {
    const gradients = [
      'from-zinc-900 via-zinc-950 to-black',
      'from-slate-900 via-zinc-950 to-black',
      'from-neutral-900 via-zinc-950 to-black',
      'from-stone-900 via-zinc-950 to-black',
      'from-red-950/20 via-zinc-950 to-black', // Subtle Nova Red accent
      'from-blue-950/20 via-zinc-950 to-black',
    ];
    // Use alt text as a seed for stable variety
    const seed = (alt || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[seed % gradients.length];
  };

  // Determine if we should use fill mode
  const isFillMode = fill || (!props.width && !props.height);
  const finalSizes = isFillMode ? (props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw') : props.sizes;

  return (
    <div
      className={cn(
        'overflow-hidden bg-[#0a0a0a] relative group/img',
        isFillMode ? 'absolute inset-0' : 'w-full h-full',
        containerClassName
      )}
    >
      {/* Background Layer: Gradient Fallback (always present but hidden by image) */}
      <div className={cn(
        "absolute inset-0 z-0 bg-gradient-to-br transition-opacity duration-1000",
        getBrandGradient(),
        isLoaded && hasValidSrc ? "opacity-0" : "opacity-100"
      )}>
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        
        {(!hasValidSrc || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
             <div className="w-12 h-[1px] bg-white/10 mb-4 scale-x-0 group-hover/img:scale-x-100 transition-transform duration-700" />
             <span className="text-[10px] font-black tracking-[0.5em] text-white/5 uppercase select-none group-hover/img:text-white/10 transition-colors duration-500">
               NovaStream
             </span>
             <div className="w-12 h-[1px] bg-white/10 mt-4 scale-x-0 group-hover/img:scale-x-100 transition-transform duration-700" />
          </div>
        )}
      </div>

      {hasValidSrc && (
        <Image
          src={finalSrc}
          alt={alt || 'Media asset'}
          priority={priority}
          fill={isFillMode}
          unoptimized={isUnoptimized}
          loader={isUnoptimized ? undefined : imageLoader}
          onLoad={e => {
            setIsLoaded(true);
            onLoad?.(e);
          }}
          onError={() => {
            if (!error) {
              console.error(`[OptimizedImage] Failed to load: ${finalSrc} (Alt: ${alt})`);
              setError(true);
            }
          }}
          className={cn(
            'transition-all duration-1000 ease-[cubic-bezier(0.23, 1, 0.32, 1)] z-10',
            isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl',
            error ? 'opacity-0' : '',
            className
          )}
          sizes={finalSizes}
          {...props}
        />
      )}

      {/* Cinematic Shimmer Placeholder (while loading) */}
      {!isLoaded && hasValidSrc && !error && (
        <div className="absolute inset-0 z-20 bg-transparent flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}
    </div>
  );
};
