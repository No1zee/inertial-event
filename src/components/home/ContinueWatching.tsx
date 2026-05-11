'use client';

import { useContinueWatching, useWatchHistoryActions, type ContinueWatchingItem } from '@/lib/stores/localDataStore';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '../Common/PretextHeadline';
import { X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  onClick: () => void;
  onRemove: () => void;
}

function ContinueWatchingCard({ item, onClick, onRemove }: ContinueWatchingCardProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.setProperty('--dynamic-width', `${item.progress}%`);
    }
  }, [item.progress]);

  return (
    <div className="relative flex-shrink-0 w-[320px] md:w-[400px] group cursor-pointer master-reveal" onClick={onClick}>
      {/* Backdrop Container */}
      <div className="relative aspect-video rounded-sm overflow-hidden bg-muted/20 border border-border transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[var(--shadow-cinematic)]">
        {item.poster || item.backdrop || item.poster_path || item.backdrop_path ? (
          <OptimizedImage
            src={item.poster || item.backdrop || item.poster_path || item.backdrop_path || ''}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80"
            sizes="(max-width: 768px) 320px, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 uppercase tracking-widest text-[9px]">
            No Visual Data
          </div>
        )}

        {/* Technical Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent p-5 flex flex-col justify-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-sm bg-surface-elevated/40 text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                {item.type}
              </span>
              {item.type === 'tv' && (
                <span className="text-primary font-bold text-[10px]">
                  S{item.season}:E{item.episode}
                </span>
              )}
            </div>
            <h3 className="font-bold text-foreground text-lg tracking-tight truncate">{item.title}</h3>
          </div>
        </div>

        {/* Session Active Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 rounded-md bg-background/60 backdrop-blur-md border border-border opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active Session</span>
        </div>

        {/* Progress Bar (Institutional HUD Style) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20">
          <div
            ref={progressRef}
            className="h-full bg-primary relative overflow-hidden transition-all duration-1000 dynamic-width"
          >
            <div
              ref={shimmerRef}
              className="absolute inset-0 bg-linear-to-r from-transparent via-background/30 to-transparent animate-shimmer"
            />
          </div>
        </div>

        {/* Remove Trigger */}
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-surface-deep/60 backdrop-blur-md border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
          title="De-prioritize"
          aria-label="Remove from continue watching"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export default function ContinueWatching() {
  const continueWatching = useContinueWatching();
  const { removeFromWatchHistory } = useWatchHistoryActions();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validItems = continueWatching.filter(
    item => item.poster || item.backdrop || item.poster_path || item.backdrop_path
  );

  if (!mounted || validItems.length === 0) return null;

  const handleClick = (item: ContinueWatchingItem) => {
    const url =
      item.type === 'movie'
        ? `/watch?id=${item.contentId}&type=movie`
        : `/watch?id=${item.contentId}&type=tv&season=${item.season || 1}&episode=${item.episode || 1}`;

    router.push(url);
  };

  return (
    <section className="mb-16 px-10 lg:px-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-[1px] w-6 bg-red-600/50" />
        <PretextHeadline
          text="System / Queue Priority"
          fontSize={10}
          fontWeight={700}
          letterSpacing="0.4em"
          className="text-muted-foreground uppercase"
        />
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
        {validItems.map(item => (
          <ContinueWatchingCard
            key={item.id}
            item={item}
            onClick={() => handleClick(item)}
            onRemove={() => removeFromWatchHistory(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

