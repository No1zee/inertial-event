'use client';

import { useWatchHistory, useWatchHistoryActions, type WatchHistoryItem } from '@/lib/stores/localDataStore';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Trash2, Play } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface RecentlyWatchedCardProps {
  item: WatchHistoryItem;
  onClick: () => void;
  onRemove: () => void;
}

const RecentlyWatchedCard = React.forwardRef<HTMLDivElement, RecentlyWatchedCardProps>(
  ({ item, onClick, onRemove }, ref) => {
    const timeSince = (date: number) => {
      const seconds = Math.floor((Date.now() - date) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative flex-shrink-0 w-[240px] md:w-[300px] group cursor-pointer"
      >
        <div
          className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.03] transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          onClick={onClick}
        >
          {item.backdrop || item.poster || item.backdrop_path || item.poster_path ? (
            <OptimizedImage
              src={item.backdrop || item.poster || item.backdrop_path || item.poster_path || ''}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-100"
              sizes="(max-width: 768px) 240px, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10 uppercase tracking-widest text-[9px]">
              No Visual Data
            </div>
          )}

          {/* Technical Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-sm bg-white/10 text-[8px] font-bold text-white/50 uppercase tracking-wider">
                  {item.type}
                </span>
                {item.providerId && (
                  <div
                    className={cn(
                      'flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider',
                      item.providerId === 'acu'
                        ? 'acu-badge bg-gradient-to-r from-amber-200 to-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : item.providerId === 'netflix'
                          ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                          : item.providerId === 'hulu'
                            ? 'bg-[#1ce783] text-black shadow-[0_0_10px_rgba(28,231,131,0.5)]'
                            : 'bg-zinc-800 text-white/70 border border-white/10'
                    )}
                  >
                    {item.providerId === 'acu' ? 'ACU Heritage' : item.providerId}
                  </div>
                )}
                {item.type === 'tv' && item.season && (
                  <span className="text-red-500 font-bold text-[10px]">
                    S{item.season}:E{item.episode}
                  </span>
                )}
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter ml-auto">
                  {timeSince(item.lastWatched)}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm tracking-tight truncate">{item.title}</h3>
            </div>
          </div>

          {/* Hover Play Button (Resume Style) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/40 backdrop-blur-[4px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500">
                <Play fill="currentColor" size={20} className="ml-1" />
              </div>
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] animate-pulse">
                Resume Session
              </span>
            </div>
          </div>

          {/* Progress Mini Bar */}
          {item.progress > 0 && !item.completed && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <motion.div
                className="h-full bg-red-600 relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          )}

          {item.completed && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-green-500/20 border border-green-500/30 backdrop-blur-md text-[8px] font-bold text-green-400 uppercase tracking-widest">
              Watched
            </div>
          )}
        </div>

        {/* Remove Trigger */}
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 border border-white/10 text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white z-20"
          title="Remove from history"
        >
          <Trash2 size={10} />
        </button>
      </motion.div>
    );
  }
);
RecentlyWatchedCard.displayName = 'RecentlyWatchedCard';

export default function RecentlyWatched() {
  const watchHistory = useWatchHistory();
  const { removeFromWatchHistory } = useWatchHistoryActions();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const distinctHistory = useMemo(() => {
    const contentMap = new Map<string, WatchHistoryItem>();

    watchHistory
      .filter(item => item.poster || item.backdrop || item.poster_path || item.backdrop_path)
      .forEach(item => {
        if (!contentMap.has(item.contentId) || contentMap.get(item.contentId)!.lastWatched < item.lastWatched) {
          contentMap.set(item.contentId, item);
        }
      });

    return Array.from(contentMap.values())
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 15);
  }, [watchHistory]);

  if (!mounted || distinctHistory.length === 0) return null;

  const handleClick = (item: WatchHistoryItem) => {
    const providerQuery = item.providerId ? `&provider=${item.providerId}` : '';
    const url =
      item.type === 'movie'
        ? `/watch?id=${item.contentId}&type=movie${providerQuery}`
        : `/watch?id=${item.contentId}&type=tv&season=${item.season || 1}&episode=${item.episode || 1}${providerQuery}`;

    router.push(url);
  };

  return (
    <section className="mb-20 px-10 lg:px-24">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-6 bg-red-600/50" />
            <PretextHeadline
              text="System / Activity Log"
              fontSize={10}
              fontWeight={700}
              letterSpacing="0.4em"
              className="text-zinc-500 uppercase"
            />
          </div>
          <PretextHeadline
            text="Recently Watched"
            fontSize={32}
            fontWeight={900}
            className="opacity-90 tracking-tighter"
          />
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {distinctHistory.map(item => (
            <RecentlyWatchedCard
              key={item.id}
              item={item}
              onClick={() => handleClick(item)}
              onRemove={() => removeFromWatchHistory(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
