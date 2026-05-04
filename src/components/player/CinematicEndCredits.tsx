'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { streamingOptimizer } from '@/services/streamingOptimizer';
import { X, Play } from 'lucide-react';
import { usePreferencesStore } from '@/lib/stores/preferencesStore';
import { useSimilar } from '@/hooks/queries/useContent';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { contentApi } from '@/lib/api/content';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface CinematicEndCreditsProps {
  contentId: string;
  type: 'movie' | 'tv' | 'anime';
  season: number;
  nextEpisode: number;
  hasNext: boolean;
  onNext: () => void;
  onCancel: () => void;
}

interface EpisodeInfo {
  name: string;
  still_path: string | null;
  overview: string | null;
}

export function CinematicEndCredits({
  contentId,
  type,
  season,
  nextEpisode,
  hasNext,
  onNext,
  onCancel,
}: CinematicEndCreditsProps) {
  const currentTime = usePlayerStore(state => state.currentTime);
  const storeDuration = usePlayerStore(state => state.duration);
  const audioLanguage = usePreferencesStore(state => state.audioLanguage);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null);

  const countdownSeconds = 15;
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  useSimilar(contentId, type);

  const triggeredRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchedRef = useRef(false);

  const handleAutoAdvance = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    onNext();
  }, [onNext]);

  // Fetch next episode metadata (still image + name)
  useEffect(() => {
    if (fetchedRef.current || !hasNext || type === 'movie') return;
    if (String(contentId).startsWith('mock-')) return;

    fetchedRef.current = true;
    const apiType = type === 'anime' ? 'tv' : type;

    contentApi.getSeasonDetails(contentId, season, apiType).then(data => {
      const episodes = (data as any)?.episodes || [];
      const ep = episodes.find((e: any) => e.episode_number === nextEpisode);
      if (ep) {
        setEpisodeInfo({
          name: ep.name || `Episode ${nextEpisode}`,
          still_path: ep.still_path || null,
          overview: ep.overview || null,
        });
      }
    }).catch(() => {
      // Non-critical: overlay still works without episode metadata
    });
  }, [contentId, season, nextEpisode, hasNext, type]);

  useEffect(() => {
    if (!hasNext || !Number.isFinite(storeDuration) || storeDuration <= 30) return;

    const timeRemaining = storeDuration - currentTime;
    const progress = currentTime / storeDuration;

    // Show overlay in the last 30 seconds
    if (
      Number.isFinite(timeRemaining) &&
      timeRemaining <= 30 &&
      timeRemaining > 0 &&
      progress > 0.9 &&
      !triggeredRef.current
    ) {
      if (!showOverlay) {
        setShowOverlay(true);
      }

      // Start auto-advance countdown in the last 15 seconds
      if (timeRemaining <= countdownSeconds && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              handleAutoAdvance();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else if (timeRemaining > 35 || isNaN(timeRemaining)) {
      setShowOverlay(false);
      setCountdown(countdownSeconds);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [currentTime, storeDuration, hasNext, handleAutoAdvance, countdownSeconds, showOverlay]);

  // Preload next episode sources when close to the end
  useEffect(() => {
    if (!hasNext || storeDuration <= 30 || hasPreloaded || isPreloading) return;

    const timeRemaining = storeDuration - currentTime;
    if (timeRemaining <= 45) {
      setIsPreloading(true);
      streamingOptimizer
        .preloadSources(contentId, type, season, nextEpisode, '', audioLanguage)
        .then(() => {
          setHasPreloaded(true);
          setIsPreloading(false);
        });
    }
  }, [currentTime, storeDuration, hasNext, hasPreloaded, isPreloading, contentId, type, season, nextEpisode, audioLanguage]);

  if (!showOverlay) return null;

  const stillUrl = episodeInfo?.still_path
    ? getOptimizedImageUrl(episodeInfo.still_path, 'w500')
    : null;

  const episodeName = episodeInfo?.name || `Episode ${nextEpisode}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="absolute bottom-24 right-12 z-[200] w-[420px] pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950/80 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />

          <div className="relative p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Up Next</span>
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Transitioning in {countdown}s
                </span>
              </div>
              <button
                onClick={onCancel}
                title="Cancel transition"
                aria-label="Cancel transition"
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Episode Thumbnail */}
            <div
              className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-2xl cursor-pointer group/card"
              onClick={onNext}
              role="button"
              aria-label={`Play ${episodeName}`}
            >
              {stillUrl ? (
                <OptimizedImage
                  src={stillUrl}
                  alt={episodeName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                />
              ) : (
                // Graceful fallback when no still is available
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                      <Play size={18} fill="white" className="opacity-30 ml-0.5" />
                    </div>
                    <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Preview Unavailable</p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Hover play icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-90 group-hover/card:scale-100 transition-transform">
                  <Play fill="white" size={24} className="ml-1" />
                </div>
              </div>

              {/* Episode label */}
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                  Season {season} · Episode {nextEpisode}
                </p>
                <h4 className="text-lg font-bold text-white truncate">
                  {episodeName}
                </h4>
              </div>
            </div>

            {/* Footer row: subtitle + countdown ring */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-400 leading-snug font-medium line-clamp-2 flex-1">
                {episodeInfo?.overview
                  ? episodeInfo.overview.length > 90
                    ? episodeInfo.overview.slice(0, 90) + '…'
                    : episodeInfo.overview
                  : 'Continuing your journey. Premium stream synchronized for seamless viewing.'}
              </p>

              <div
                className="relative w-14 h-14 shrink-0 cursor-pointer"
                onClick={onNext}
                role="button"
                aria-label="Auto-advance countdown"
              >
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="150.8"
                    initial={{ strokeDashoffset: 150.8 }}
                    animate={{
                      strokeDashoffset:
                        150.8 - (150.8 * (countdownSeconds - countdown)) / countdownSeconds,
                    }}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                  {countdown}
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onNext}
              className="w-full py-3.5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl"
            >
              Stream Now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
