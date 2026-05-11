'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useContentStore } from '../../store/contentStore';
import { type Content } from '@/lib/types/content';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '../ui/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiment } from '@/components/providers/ExperimentProvider';
import { logExperimentEvent } from '@/lib/experiment';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { type ExperimentGroup } from '@/lib/experiment';

interface HeroProps {
  items: (Content & { _id?: string; trailerUrl?: string })[];
}

export const Hero: React.FC<HeroProps> = ({ items }) => {
  const router = useRouter();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useContentStore();
  const { getVariant } = useExperiment();
  const [mounted, setMounted] = useState(false);
  const variant = mounted ? getVariant('hero_layout') : 'A';

  // Defensive filtering of items to prevent null-pointer exceptions
  const safeItems = useMemo(() => items.filter(item => item && (item.id || item._id)), [items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerError, setTrailerError] = useState(false);
  const [_direction, setDirection] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (safeItems.length > 0) {
      setActiveIndex(Math.floor(Math.random() * safeItems.length));
    }
  }, [safeItems]);

  const content = useMemo(() => safeItems[activeIndex] || {}, [safeItems, activeIndex]);
  const isFavorited = isInLibrary(content?.id?.toString() || content?._id || '');

  // Auto-play trailer after delay
  useEffect(() => {
    setTrailerError(false);
    setShowTrailer(false);
    const timer = setTimeout(() => {
      if (content?.trailerUrl) setShowTrailer(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [content]);

  const handlePlay = () => {
    if (!content?.id && !content?._id) return;
    logExperimentEvent('hero_layout', variant as ExperimentGroup, 'play_click');
    router.push(`/watch?id=${content.id || content._id}&type=${content.type || 'movie'}`);
  };

  if (!safeItems.length) return null;

  return (
    <div className="relative w-full h-[85vh] min-h-[700px] overflow-hidden group/hero">
      {/* Background / Trailer Container */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={content?.id || content?._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // Faster transition
          className="absolute inset-0 bg-transparent"
        >
          {showTrailer && content?.trailerUrl && !trailerError ? (
            <div className="relative w-full h-full scale-[1.35] overflow-hidden pointer-events-none">
              <iframe
                src={`${content.trailerUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${content.trailerUrl.split('/').pop()}`}
                title={`${content?.title} trailer`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none border-none"
                allow="autoplay"
                onLoad={() => {}}
                onError={() => setTrailerError(true)}
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <motion.div
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10, ease: 'linear' }}
                className="absolute inset-0"
              >
                <OptimizedImage
                  src={getOptimizedImageUrl(content?.backdrop_path || content?.poster_path || content?.backdropUrl || content?.posterUrl, 'original')}
                  alt={content?.title}
                  fill
                  className="object-cover will-change-transform"
                  priority
                  sizes="100vw"
                />
              </motion.div>
            </div>
          )}

          {/* Advanced Multi-Stage Gradients for "Premium" look */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent z-[1]" />
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(var(--background-rgb),0.5)] z-[1]" />
          <div className="absolute inset-0 atmospheric-scrim opacity-40 z-[1]" />
        </motion.div>
      </AnimatePresence>

      {/* Content Info */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`info-${content?.id || content?._id}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute bottom-[20%] left-10 lg:left-20 max-w-4xl space-y-8 z-10"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            {variant === 'B' ? (
              <span className="px-3 py-1 bg-linear-to-r from-primary to-accent text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-primary/30 flex items-center gap-2 animate-pulse">
                <Sparkles size={12} />
                AI RECOMMENDED
              </span>
            ) : (
              <span className="px-3 py-1 bg-primary text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-primary/20 text-primary-foreground">
                {content?.type}
              </span>
            )}
            <span className="text-muted-foreground font-bold tracking-widest text-sm">{content?.year}</span>
            <div className="flex items-center space-x-1">
              <span className="text-yellow-600 font-black tracking-tighter">★ {content?.rating || '8.4'}</span>
              <span className="text-[10px] text-muted-foreground/60 font-bold">/ 10</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-7xl lg:text-9xl text-foreground drop-shadow-2xl leading-[0.8] visual-boost"
          >
            {content?.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground line-clamp-3 font-medium max-w-2xl leading-relaxed"
          >
            {content?.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center space-x-4 pt-6"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlay}
              className="group/play"
              aria-label="Play now"
            >
              <Play fill="currentColor" size={24} className="group-hover/play:scale-110 transition-transform" />
              <span>STREAM NOW</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="backdrop-blur-xl"
              aria-label="View details"
            >
              <Info size={24} />
              <span>DETAILS</span>
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={() =>
                isFavorited
                  ? removeFromLibrary(content?.id?.toString() || content?._id || '')
                  : addToLibrary(content?.id?.toString() || content?._id || '')
              }
              className={cn(
                "backdrop-blur-xl",
                isFavorited && "bg-primary border-primary text-white"
              )}
              aria-label={isFavorited ? "Remove from watchlist" : "Add to watchlist"}
            >
              {isFavorited ? <Check size={28} /> : <Plus size={28} />}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="backdrop-blur-xl"
              aria-label="Share content"
              onClick={() => {
                const url = `${window.location.origin}/watch?id=${content?.id || content?._id}&ref=user_share`;
                if (navigator.share) {
                  navigator
                    .share({
                      title: content?.title,
                      text: `I'm exploring ${content?.title} at NovaStream!`,
                      url: url,
                    })
                    .then(() => logExperimentEvent('viral_loop', 'A' as ExperimentGroup, 'share_success'));
                } else {
                  navigator.clipboard.writeText(url);
                  // Using a more subtle notification would be better than alert
                  console.log('Link copied');
                  logExperimentEvent('viral_loop', 'A' as ExperimentGroup, 'copy_link');
                }
              }}
            >
              <motion.div whileHover={{ rotate: 15 }}>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Mute/Unmute Overlay */}
      <div className="absolute bottom-20 right-10 z-20 flex items-center space-x-4">
        {showTrailer && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
            className="p-4 bg-background/20 backdrop-blur-md rounded-full text-foreground border border-border hover:bg-background/40 transition-all transform active:scale-90"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        )}

        {/* Visual indicator for rotating featured list if needed */}
        <div className="flex items-center space-x-2 bg-background/40 backdrop-blur p-2 rounded-full border border-border">
          {safeItems.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > activeIndex ? 1 : -1);
                setActiveIndex(i);
              }}
              aria-label={`Go to featured item ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeIndex ? 'w-8 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;

