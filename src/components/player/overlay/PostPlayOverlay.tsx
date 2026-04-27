'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface TMDBItem {
  id: string | number;
  title?: string;
  name?: string;
  overview?: string;
  backdrop_path?: string;
  still_path?: string;
  nextEpisodeParams?: { season: number; episode: number };
}

interface PostPlayOverlayProps {
  show: boolean;
  onClose: () => void;
  currentId: string;
  type: 'movie' | 'tv' | 'anime';
  onPlay: (id: string, type: 'movie' | 'tv' | 'anime', season?: number, episode?: number) => void;
  nextEpisode?: { season: number; episode: number } | null;
}

export default function PostPlayOverlay({ show, onClose, currentId, type, onPlay, nextEpisode }: PostPlayOverlayProps) {
  const [recommendations, setRecommendations] = useState<TMDBItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TMDBItem | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(10);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const cancelAutoPlay = useCallback(() => {
    clearTimers();
    setTimer(0);
  }, [clearTimers]);

  const selectItem = useCallback(
    async (item: TMDBItem) => {
      cancelAutoPlay();
      setSelectedItem(item);
      setTrailerUrl(null);

      try {
        const res = await fetch(`/tmdb-api/${type === 'movie' ? 'movie' : 'tv'}/${item.id}/videos`);
        const data = await res.json();
        const clips = data.results || [];
        const trailer =
          clips.find((v: { type: string; site: string }) => v.type === 'Trailer' && v.site === 'YouTube') ||
          clips.find((v: { site: string }) => v.site === 'YouTube');

        if (trailer) {
          setTimeout(() => {
            setTrailerUrl(
              `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailer.key}`
            );
          }, 800);
        }
      } catch {}
    },
    [cancelAutoPlay, type]
  );

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch(`/tmdb-api/${type}/${currentId}/recommendations`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const valid: TMDBItem[] = data.results.filter((m: TMDBItem) => m.backdrop_path).slice(0, 4);
        setRecommendations(valid);
        if (valid.length > 0) selectItem(valid[0]);
      }
    } catch {}
  }, [currentId, type, selectItem]);

  const startCountdown = useCallback(
    (_item: TMDBItem) => {
      setTimer(10);
      clearTimers();
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            onPlay(currentId, type, nextEpisode?.season, nextEpisode?.episode);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [currentId, nextEpisode, onPlay, type, clearTimers]
  );

  const fetchNextEpisode = useCallback(async () => {
    if (!nextEpisode) return;
    try {
      const res = await fetch(`/tmdb-api/tv/${currentId}/season/${nextEpisode.season}/episode/${nextEpisode.episode}`);
      const data = await res.json();

      if (data) {
        const epData = {
          ...data,
          title: data.name || `Episode ${nextEpisode.episode}`,
          backdrop_path: data.still_path || data.backdrop_path,
          nextEpisodeParams: nextEpisode,
        };
        setSelectedItem(epData);
        startCountdown(epData);
      }
    } catch {
      fetchRecommendations();
    }
  }, [currentId, nextEpisode, startCountdown, fetchRecommendations]);

  useEffect(() => {
    if (show) {
      if (nextEpisode) {
        fetchNextEpisode();
      } else {
        fetchRecommendations();
      }
    } else {
      setSelectedItem(null);
      setTrailerUrl(null);
      clearTimers();
    }
    return () => clearTimers();
  }, [show, fetchNextEpisode, fetchRecommendations, nextEpisode, clearTimers]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-[1000] bg-black/95 flex flex-col"
    >
      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {trailerUrl ? (
            <motion.div
              key="trailer"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.3, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <iframe
                src={trailerUrl}
                title="Trailers and Teasers"
                className="w-[120%] h-[120%] -ml-[10%] -mt-[10%] pointer-events-none grayscale opacity-60"
                allow="autoplay; encrypted-media"
              />
            </motion.div>
          ) : (
            selectedItem && (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.25, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <OptimizedImage
                  src={getOptimizedImageUrl(selectedItem.backdrop_path || selectedItem.still_path, 'original')}
                  alt={selectedItem.title || selectedItem.name || 'Recommendation'}
                  fill
                  className="object-cover blur-sm"
                  priority
                />
              </motion.div>
            )
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
      </div>

      {/* CONTENT CANVAS */}
      <div className="relative z-10 flex flex-col h-full p-16 pt-24 text-white">
        <Button
          onClick={onClose}
          variant="ghost"
          aria-label="Close overlay"
          className="absolute top-12 right-12 h-14 w-14 rounded-full bg-[hsl(var(--brand-primary))]/10 border border-[hsl(var(--brand-primary))]/20 hover:bg-[hsl(var(--brand-primary))] hover:text-white transition-all shadow-[0_0_30px_rgba(var(--brand-primary),0.2)]"
        >
          <X size={24} />
        </Button>

        <div className="mt-auto mb-16 max-w-3xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <span className="text-[hsl(var(--brand-leaf))] font-bold tracking-[0.4em] text-[10px] uppercase">
              {nextEpisode ? (timer > 0 ? `Sanctuary Transitioning in ${timer}s` : 'Up Next') : 'Directorial Picks'}
            </span>
            {timer > 0 && nextEpisode && (
              <div
                className="w-6 h-6 relative"
                role="img"
                aria-label={`Auto-play countdown: ${timer} seconds remaining`}
              >
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="opacity-10"
                  />
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="62.8"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 62.8 }}
                    transition={{ duration: 10, ease: 'linear' }}
                    className="text-[hsl(var(--brand-primary))]"
                  />
                </svg>
              </div>
            )}
          </motion.div>

          {selectedItem && (
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <PretextHeadline
                  text={selectedItem.title || selectedItem.name || ''}
                  className="text-6xl md:text-7xl font-bold tracking-tighter"
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/60 font-medium text-lg max-w-xl leading-relaxed line-clamp-3"
              >
                {selectedItem.overview}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex gap-6 items-center"
              >
                <Button
                  aria-label={timer > 0 && nextEpisode ? 'Commence Play' : 'Stream Now'}
                  onClick={() => {
                    if (selectedItem.nextEpisodeParams) {
                      onPlay(
                        String(currentId),
                        type,
                        selectedItem.nextEpisodeParams.season,
                        selectedItem.nextEpisodeParams.episode
                      );
                    } else {
                      onPlay(String(selectedItem.id), type);
                    }
                  }}
                  className="h-16 px-12 rounded-2xl bg-[hsl(var(--brand-primary))] text-white text-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[hsl(var(--brand-leaf))]/30"
                >
                  <Play fill="white" className="mr-3" />
                  {timer > 0 && nextEpisode ? 'Commence Play' : 'Stream Now'}
                </Button>

                {!nextEpisode ? (
                  <Button
                    onClick={() => router.push(`/${type}/${selectedItem.id}`)}
                    variant="outline"
                    className="h-16 px-10 rounded-2xl border-white/10 hover:bg-white/10 text-lg transition-all"
                  >
                    Details
                  </Button>
                ) : (
                  <Button
                    onClick={cancelAutoPlay}
                    variant="ghost"
                    className="h-16 px-10 rounded-2xl text-white/40 hover:text-white transition-all"
                  >
                    Hold Transmission
                  </Button>
                )}
              </motion.div>
            </div>
          )}
        </div>

        {/* VISUAL CAROUSEL */}
        {!nextEpisode && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex gap-8 overflow-hidden py-4"
          >
            {recommendations.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectItem(item)}
                role="button"
                aria-label={`Select recommendation: ${item.title || item.name}`}
                className={`
                                    relative flex-shrink-0 w-72 aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 group/card
                                    ${selectedItem?.id === item.id ? 'ring-2 ring-primary bg-primary/20' : 'opacity-40 hover:opacity-100'}
                                `}
              >
                <OptimizedImage
                  src={getOptimizedImageUrl(item.backdrop_path, 'w500')}
                  alt={`Recommendation: ${item.title || item.name}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <p className="text-sm font-bold truncate tracking-tight">{item.title || item.name}</p>
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-4 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
