'use client';

import { useRouter } from 'next/navigation';
import { memo, useRef, useState } from 'react';
import { Play, Plus, Check, Clock } from 'lucide-react';
import { Content } from '@/lib/types/content';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/lib/stores/uiStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { motion } from 'framer-motion';
import { useLocalDataStore, useLibraryActions } from '@/lib/stores/localDataStore';
import { contentApi } from '@/lib/api/content';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { getProviderById, getProviderBySlug } from '@/lib/constants/providers';
import { useUISounds } from '@/hooks/useUISounds';
import { usePreferencesStore } from '@/lib/stores/preferencesStore';

interface ContentCardProps {
  item: Content;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | '21:9' | '16:9' | 'poster' | 'ultrawide' | 'fill';
  showDetails?: boolean;
  className?: string;
  priority?: boolean;
  providerId?: string;
}

const ContentCard = memo(function ContentCard({
  item,
  aspectRatio = 'portrait',
  className,
  priority = false,
  providerId,
}: ContentCardProps) {
  if (!item || !item.id) return null;

  const router = useRouter();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryActions();
  const openContentModal = useUIStore(state => state.openContentModal);
  const queryClient = useQueryClient();
  const isHydrated = useHydrated();
  const getResumeData = useLocalDataStore(state => state.getResumeData);
  const { playSound } = useUISounds();
  const autoPlayPreviews = usePreferencesStore(state => state.autoPlay);

  const [showPreview, setShowPreview] = useState(false);

  const inLibrary = isInLibrary(String(item.id));
  const contentType = item.type || (item.seasonsList && item.seasonsList.length > 0 ? 'tv' : 'movie');

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inLibrary) {
      removeFromLibrary(String(item.id));
    } else {
      addToLibrary({
        contentId: String(item.id),
        type: contentType as 'movie' | 'tv' | 'anime',
        title: item.title,
        poster: item.poster || item.poster_path || '',
        backdrop: item.backdrop || item.backdrop_path || '',
        favorite: false,
      });
    }
  };

  const handleClick = () => {
    console.log(`[ContentCard] Triggering modal for ${item.title} (${item.id})`);
    playSound('click');
    openContentModal(item, providerId);
  };

  const prefetchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    playSound('hover');
    if (prefetchTimeout.current) clearTimeout(prefetchTimeout.current);

    prefetchTimeout.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['content', 'details', item.id, contentType],
        queryFn: () => {
          const apiType = contentType === 'anime' ? 'tv' : contentType;
          return contentApi.getDetails(item.id, apiType as 'movie' | 'tv');
        },
      });
      router.prefetch(`/watch?id=${item.id}&type=${contentType}`);
    }, 200);


  };

  const runOnMouseLeave = () => {
    if (prefetchTimeout.current) clearTimeout(prefetchTimeout.current);
    setShowPreview(false);
  };

  const getBadge = () => {
    if (item.customBadge) return item.customBadge;
    if (!isHydrated) return null;
    const now = new Date();

    const matchScore = Math.min(Math.round((item.rating || 0) * 10), 100);
    if (matchScore >= 98) {
      return { label: 'Award Winning', color: 'bg-amber-500 text-black font-black border-none ring-4 ring-amber-500/10' };
    }
    if (matchScore >= 95) {
      return { label: 'Top Pick', color: 'bg-white text-black font-black border-none ring-4 ring-white/10' };
    }

    if (item.popularity && item.popularity > 2000) {
      return { label: 'Trending', color: 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse' };
    }

    if (item.lastAirDate) {
      const lastAir = new Date(item.lastAirDate);
      const diffDaysAir = (now.getTime() - lastAir.getTime()) / (1000 * 3600 * 24);
      if (diffDaysAir >= 0 && diffDaysAir < 7) {
        return { label: 'New Episode', color: 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)]' };
      }
    }

    if (!item.releaseDate) return null;
    const release = new Date(item.releaseDate);
    const diffDays = (now.getTime() - release.getTime()) / (1000 * 3600 * 24);
    if (release > now) return { label: 'Coming Soon', color: 'bg-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' };
    if (diffDays >= 0 && diffDays < 14)
      return {
        label: 'Just Released',
        color: 'bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] border border-white/20',
      };
    if (diffDays >= 0 && diffDays < 30) return { label: 'New Arrival', color: 'bg-zinc-100 text-black font-black' };
    
    // Leaving Soon heuristic (randomly or via metadata if exists)
    if (item.leavingDate) {
       return { label: 'Leaving Soon', color: 'bg-zinc-800 text-white border border-white/10' };
    }
    
    return null;
  };

  const badge = getBadge();
  const matchScore = Math.min(Math.round((item.rating || 0) * 10), 100);

  const [isNavigating, setIsNavigating] = useState(false);
  const provider = providerId ? getProviderById(providerId) || getProviderBySlug(providerId) : null;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNavigating) return;
    setIsNavigating(true);

    const resumeData = getResumeData(String(item.id));
    const providerQuery = providerId ? `&provider=${providerId}` : '';

    if (resumeData) {
      const { season, episode, currentTime, completed } = resumeData;
      if (!completed) {
        router.push(
          `/watch?id=${item.id}&type=${contentType}${season ? `&season=${season}` : ''}${episode ? `&episode=${episode}` : ''}&progress=${currentTime}${providerQuery}`
        );
      } else {
        // Find next episode, potentially jumping seasons
        let nextS = season ?? 1;
        let nextE = (episode ?? 1) + 1;
        
        // Use available metadata to check for season jump
        const currentSeasonMeta = item.seasonsList?.find(s => s.season_number === nextS);
        if (currentSeasonMeta && nextE > currentSeasonMeta.episode_count) {
           const totalSeasons = item.seasons || item.seasonsList?.length || 0;
           if (nextS < totalSeasons) {
              nextS += 1;
              nextE = 1;
              console.log(`[ContentCard] Completion jump: S${season}:E${episode} -> S${nextS}:E${nextE}`);
           }
        }
        
        router.push(`/watch?id=${item.id}&type=${contentType}&season=${nextS}&episode=${nextE}${providerQuery}`);
      }
    } else {
      router.push(`/watch?id=${item.id}&type=${contentType}${providerQuery}`);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      animate={isNavigating ? { scale: [1, 1.02, 1], opacity: [1, 0.8, 1] } : {}}
      transition={isNavigating ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : { duration: 0.2 }}
      tabIndex={0}
      data-testid="content-card"
      className={cn(
        'relative rounded-sm overflow-hidden bg-zinc-900/50 cursor-pointer group shrink-0 border border-white/5 outline-none transition-all duration-300',
        'hover:z-30',
        provider?.slug === 'netflix'
          ? 'hover:border-red-600 hover:shadow-[0_0_20px_rgba(229,9,20,0.3)]'
          : provider?.slug === 'hulu'
            ? 'hover:border-[#1ce783] hover:shadow-[0_0_20px_rgba(28,231,131,0.2)] rounded-xl'
            : provider?.slug === 'disney'
              ? 'hover:border-[#113ccf] hover:shadow-[0_0_20px_rgba(17,60,207,0.3)] rounded-lg'
              : 'hover:border-white/20',
        'focus:border-red-600 focus:ring-4 focus:ring-red-600/20',
        (aspectRatio === 'portrait' || aspectRatio === 'poster') && 'aspect-[2/3] w-[160px] md:w-[200px]',
        (aspectRatio === 'landscape' || aspectRatio === '16:9') && 'aspect-video w-[280px] md:w-[350px]',
        (aspectRatio === '21:9' || aspectRatio === 'ultrawide') && 'aspect-[21/9] w-[350px] md:w-[420px]',
        aspectRatio === 'square' && 'aspect-square w-[160px] md:w-[200px]',
        aspectRatio === 'fill' && 'w-full h-full',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={runOnMouseLeave}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleClick();
        }
      }}
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Shimmer Background Layer */}
        <div className="absolute inset-0 bg-zinc-900">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
        </div>

        {(() => {
          const isLandscape =
            aspectRatio === 'landscape' ||
            aspectRatio === '16:9' ||
            aspectRatio === '21:9' ||
            aspectRatio === 'ultrawide';
            
          const rawSource = isLandscape 
            ? item.backdrop || item.poster || item.backdrop_path || item.poster_path
            : item.poster || item.poster_path || item.backdrop || item.backdrop_path;
            
          const sourceUrl = getOptimizedImageUrl(rawSource, isLandscape ? 'w780' : 'w500');

          return (
            <OptimizedImage
              src={sourceUrl}
              alt={item.title}
              fill
              priority={priority}
              className="object-cover transition-all duration-700 ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
              sizes={isLandscape ? '(max-width: 768px) 350px, 420px' : '(max-width: 768px) 200px, 250px'}
            />
          );
        })()}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {badge && !providerId && (
          <div
            className={cn(
              'absolute top-3 left-3 z-20 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-[0.2em] shadow-2xl',
              badge.color
            )}
          >
            {badge.label}
          </div>
        )}

        {providerId && (
          <div
            className={cn(
              'absolute top-3 right-3 z-30 px-2.5 py-1.5 rounded-md backdrop-blur-md flex items-center justify-center border transition-all duration-300',
              providerId === 'acu'
                ? 'bg-amber-600/20 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                : `bg-black/60 border-white/10 group-hover:bg-black/80 group-hover:border-white/20`
            )}
          >
            {provider?.logo ? (
              <img 
                src={provider.logo} 
                alt={provider.name} 
                className={cn(
                  "h-3 w-auto object-contain",
                  provider.slug === 'netflix' && "h-3.5",
                  provider.slug === 'apple' && "invert brightness-0"
                )} 
              />
            ) : (
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/90">
                {provider?.name || providerId}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Resume Overlay */}
      {(() => {
        const resumeData = isHydrated ? getResumeData(String(item.id)) : null;
        if (!resumeData || resumeData.currentTime < 30) return null;

        return (
          <div className="absolute inset-0 z-25 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <button
              onClick={handlePlay}
              className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform',
                  provider?.slug === 'hulu'
                    ? 'bg-[#1ce783] text-black shadow-[#1ce783]/40'
                    : provider?.slug === 'netflix'
                      ? 'bg-red-600 text-white shadow-red-600/40'
                      : 'bg-white text-black shadow-white/20'
                )}
              >
                <Play size={20} fill="currentColor" className="ml-1" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-lg">
                Resume at {Math.floor(resumeData.currentTime / 60)}:
                {(resumeData.currentTime % 60).toString().padStart(2, '0')}
              </span>
            </button>
          </div>
        );
      })()}

      <div data-testid="content-overlay" className="absolute inset-x-4 bottom-4 z-20 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
        <div className="flex gap-2">
          <button
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center transition-all shadow-2xl active:scale-95',
              provider?.slug === 'hulu'
                ? 'bg-[#1ce783] text-black hover:bg-[#15b364]'
                : provider?.slug === 'netflix'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-white text-black hover:bg-neutral-200'
            )}
            aria-label="Play"
            title="Play"
            onClick={handlePlay}
            data-testid="play-button"
          >
            <Play size={16} fill="currentColor" />
          </button>
          <button
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center glass-card border border-white/10 shadow-2xl active:scale-95 transition-all text-white',
              inLibrary ? provider?.color || 'bg-red-600 border-red-500' : 'bg-black/60'
            )}
            aria-label={inLibrary ? 'Remove from library' : 'Add to library'}
            title={inLibrary ? 'Remove from library' : 'Add to library'}
            onClick={toggleWatchlist}
            data-testid="watchlist-button"
          >
            {inLibrary ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-white text-sm md:text-base tracking-tight leading-tight drop-shadow-2xl truncate">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
            {matchScore >= 55 && (
              <span className={cn(matchScore >= 95 ? 'text-white' : 'text-red-500/80')}>{matchScore}% Match</span>
            )}
            {matchScore >= 55 && <span className="opacity-30">•</span>}
            <span>{item.releaseDate?.substring(0, 4) || 'Archived'}</span>
          </div>
        </div>
      </div>

      <CardProgressBar item={item} providerColor={provider?.color} />
    </motion.div>
  );
});

export { ContentCard };
export default ContentCard;

function CardProgressBar({ item, providerColor }: { item: Content; providerColor?: string }) {
  const isHydrated = useHydrated();
  const contentState = useLocalDataStore(state => state.contentState[String(item.id)]);
  const getResumeData = useLocalDataStore(state => state.getResumeData);

  if (!isHydrated || !contentState || contentState.isCompleted) return null;

  const resumeData = getResumeData(String(item.id));
  const progress = (contentState.lastWatchedTime / (contentState.lastWatchedDuration || 1)) * 100;
  if (progress <= 0 || progress >= 100) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 z-30">
        <motion.div
          className="h-full relative overflow-hidden"
          style={{ backgroundColor: providerColor || '#E50914' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]" />
        </motion.div>
      </div>
      {resumeData && resumeData.currentTime > 30 && (
        <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
            <Clock size={10} style={{ color: providerColor || '#E50914' }} />
            <span className="text-[9px] font-bold text-white tabular-nums">{formatTime(resumeData.currentTime)}</span>
          </div>
          {resumeData.season && (
            <div className="px-1.5 py-0.5 bg-zinc-800/90 backdrop-blur-md rounded-sm border border-white/5 text-[8px] font-black text-zinc-100 uppercase tracking-wider">
              S{resumeData.season} • E{resumeData.episode}
            </div>
          )}
        </div>
      )}
    </>
  );
}
