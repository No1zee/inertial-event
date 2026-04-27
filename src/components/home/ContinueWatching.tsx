'use client';

import { useContinueWatching, useWatchHistoryActions, type ContinueWatchingItem } from '@/lib/stores/localDataStore';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
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
      <div className="relative aspect-video rounded-sm overflow-hidden bg-zinc-900 border border-white/[0.03] transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {item.poster || item.backdrop || item.poster_path || item.backdrop_path ? (
          <OptimizedImage
            src={item.poster || item.backdrop || item.poster_path || item.backdrop_path || ''}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80"
            sizes="(max-width: 768px) 320px, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 uppercase tracking-widest text-[9px]">
            No Visual Data
          </div>
        )}

        {/* Technical Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-5 flex flex-col justify-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-sm bg-white/10 text-[8px] font-bold text-white/50 uppercase tracking-wider">
                {item.type}
              </span>
              {item.type === 'tv' && (
                <span className="text-red-500/80 font-bold text-[10px]">
                  S{item.season}:E{item.episode}
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-lg tracking-tight truncate">{item.title}</h3>
          </div>
        </div>

        {/* Session Active Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">Active Session</span>
        </div>

        {/* Progress Bar (Institutional HUD Style) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div
            ref={progressRef}
            className="h-full bg-red-600 relative overflow-hidden transition-all duration-1000 dynamic-width"
          >
            <div
              ref={shimmerRef}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            />
          </div>
        </div>

        {/* Remove Trigger */}
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 border border-white/10 text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
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
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">System / Queue Priority</h2>
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
