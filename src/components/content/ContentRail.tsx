'use client';

import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { ContentCard } from './ContentCard';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { cn } from '@/lib/utils';
import { Content } from '@/lib/types/content';

interface ContentRailProps {
  title: string;
  items?: Content[];
  railId?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
}

export function ContentRail({ title, items, railId, aspectRatio = 'portrait' }: ContentRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const isLoading = items === undefined;
  const isEmpty = items !== undefined && items.length === 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // if (isEmpty) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    // Scroll by roughly 2-3 items or 80% of width
    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft =
      direction === 'right' ? container.scrollLeft + scrollAmount : container.scrollLeft - scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });

    if (direction === 'right') setShowLeftArrow(true);
    if (newScrollLeft <= 0 && direction === 'left') setShowLeftArrow(false);
  };

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between group/header">
        <div className="flex items-center gap-3">
          <PretextHeadline
            text={title}
            fontSize={24}
            fontWeight={800}
            letterSpacing="-0.02em"
            className="text-zinc-100 hover:text-white transition-colors cursor-pointer"
          />
          {railId && (
            <Link
              href={`/browse/view-all?id=${railId}&title=${encodeURIComponent(title)}`}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-primary transition-all opacity-0 group-hover/header:opacity-100 flex items-center"
            >
              Archive Index <ChevronRight size={10} className="ml-1" />
            </Link>
          )}
        </div>
      </div>

      <div className="relative group/scroll">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          title="Scroll left"
          aria-label="Scroll left"
          className={cn(
            'absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 disabled:opacity-0',
            !showLeftArrow && 'hidden'
          )}
        >
          <ChevronLeft className="text-white hover:scale-125" size={32} />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x px-4 sm:px-8 md:px-12 lg:px-16 scroll-smooth"
          onScroll={e => setShowLeftArrow(e.currentTarget.scrollLeft > 0)}
        >
          {isLoading ? (
            <div className="w-full h-40 flex items-center justify-center gap-2 text-zinc-500">
              {/* Simple text or skeleton */}
              <div className="animate-pulse flex items-center gap-2">
                <span className="text-sm font-medium tracking-wide">Loading...</span>
              </div>
            </div>
          ) : isVisible ? (
            items
              .filter(item => item && item.id)
              .map(item => (
                <div
                  key={`${item.type || 'movie'}-${item.id}`}
                  className="transition-transform duration-300 hover:scale-[1.03] will-change-transform"
                >
                  <ContentCard item={item} aspectRatio={aspectRatio} />
                </div>
              ))
          ) : (
            Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'shrink-0 animate-pulse bg-zinc-900/50 rounded-lg',
                    aspectRatio === 'portrait' ? 'w-[200px] aspect-[2/3]' : 'w-[350px] aspect-video'
                  )}
                />
              ))
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          title="Scroll right"
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/scroll:opacity-100"
        >
          <ChevronRight className="text-white hover:scale-125" size={32} />
        </button>
      </div>
    </div>
  );
}
