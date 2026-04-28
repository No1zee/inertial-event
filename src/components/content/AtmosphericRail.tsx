'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ContentCard } from './ContentCard';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { cn } from '@/lib/utils';
import { Content } from '@/lib/types/content';
import { getProviderById, getProviderBySlug } from '@/lib/constants/providers';

interface AtmosphericRailProps {
  title: string;
  items?: Content[];
  aspectRatio?: 'portrait' | 'landscape' | 'ultrawide' | '21:9' | '16:9' | 'poster';
  className?: string;
  providerId?: string;
  railId?: string;
}

export const AtmosphericRail = React.memo(function AtmosphericRail({
  title,
  items,
  railId,
  aspectRatio = 'portrait',
  className,
  providerId,
}: AtmosphericRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Brand detection
  const provider = providerId ? getProviderById(providerId) || getProviderBySlug(providerId) : null;
  const isSpecialProvider = !!provider;

  // Check scroll bounds for arrows
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;

    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const newCanScrollLeft = scrollLeft > 10;
      const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 10;

      setCanScrollLeft(prev => (prev !== newCanScrollLeft ? newCanScrollLeft : prev));
      setCanScrollRight(prev => (prev !== newCanScrollRight ? newCanScrollRight : prev));
    });
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const getCardWidth = () => {
    switch (aspectRatio) {
      case 'ultrawide':
      case '21:9':
        return 'w-[350px] md:w-[450px]';
      case 'landscape':
      case '16:9':
        return 'w-[280px] md:w-[350px]';
      default:
        return 'w-[160px] md:w-[200px]';
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section
      ref={containerRef}
      className={cn(
        'relative group/rail space-y-8 py-16 min-h-[300px] overflow-hidden',
        provider?.slug === 'netflix' && 'bg-gradient-to-b from-red-600/5 to-transparent',
        provider?.slug === 'hulu' && 'bg-gradient-to-b from-[#1ce783]/5 to-transparent',
        provider?.slug === 'disney' && 'bg-gradient-to-b from-[#113ccf]/10 to-transparent',
        provider?.slug === 'peacock' &&
          'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent',
        providerId === 'acu' && 'acu-glow bg-gradient-to-b from-amber-600/10 to-transparent',
        className
      )}
    >
      {/* Atmospheric Brand Glow (Floating) */}
      {isSpecialProvider && (
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[150px] pointer-events-none z-0 bg-[var(--brand-color)]"
          style={{ '--brand-color': provider.color } as React.CSSProperties}
        />
      )}

      {/* Header Area */}
      <div className="flex items-end justify-between px-10 lg:px-24 mb-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {isSpecialProvider ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-[2px] rounded-full bg-[var(--brand-color)]"
                  style={{ '--brand-color': provider.color } as React.CSSProperties}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                  {provider.name} Features
                </span>
              </div>
            ) : (
              <>
                <div className="h-[1px] w-6 bg-red-600/50" />
                <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">
                  Mai Archive / {title.split(' ')[0]}
                </h2>
              </>
            )}
          </div>
          <PretextHeadline
            text={title}
            fontSize={38}
            fontWeight={900}
            fontFamily={provider?.font || 'var(--font-outfit)'}
            lineHeight={0.85}
            letterSpacing="-0.05em"
            className={cn(
              'opacity-90 group-hover/rail:opacity-100 transition-opacity',
              provider?.slug === 'netflix' && 'text-red-50',
              provider?.slug === 'hulu' && 'text-[#1ce783]/90'
            )}
          />
        </div>

        {railId && (
          <Link
            href={`/browse/view-all?id=${railId}&title=${encodeURIComponent(title)}`}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors group/link px-4 py-2 rounded-full border border-white/5 hover:bg-white/5"
          >
            Index
            <ChevronRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Rail Container */}
      <div className="relative overflow-visible z-10">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          title="Scroll left"
          aria-label="Scroll left"
          className={cn(
            'absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-20 h-14 w-14 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-zinc-900 transition-all shadow-2xl',
            !canScrollLeft && 'opacity-0 pointer-events-none'
          )}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          title="Scroll right"
          aria-label="Scroll right"
          className={cn(
            'absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-20 h-14 w-14 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-zinc-900 transition-all shadow-2xl',
            !canScrollRight && 'opacity-0 pointer-events-none'
          )}
        >
          <ChevronRight size={24} />
        </button>

        {/* Main Scroll Area */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className={cn(
            'flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-10 lg:px-24 pb-12 pt-4 h-full'
          )}
        >
          {isVisible &&
            items.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                className={cn(
                  'snap-start snap-always shrink-0 transition-transform duration-500 hover:-translate-y-3 hover:scale-[1.02] will-change-transform',
                  getCardWidth()
                )}
              >
                <ContentCard
                  item={item}
                  aspectRatio={aspectRatio}
                  className={cn(
                    'w-full',
                    provider?.slug === 'hulu' && 'rounded-2xl overflow-hidden',
                    provider?.slug === 'netflix' && 'rounded-none'
                  )}
                  providerId={providerId}
                />
              </div>
            ))}
          {!isVisible &&
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className={cn('shrink-0 animate-pulse bg-zinc-900 rounded-[2rem] relative overflow-hidden', getCardWidth(), aspectRatio === 'poster' ? 'aspect-[2/3]' : 'aspect-video')}>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
                </div>
              ))}
          <div className="min-w-[4rem] lg:min-w-[8rem] shrink-0" />
        </div>
      </div>
    </section>
  );
});
