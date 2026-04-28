'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useContentStore, type Content } from '../../store/contentStore';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '../ui/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiment } from '@/components/providers/ExperimentProvider';
import { logExperimentEvent } from '@/lib/experiment';
import { cn } from '@/lib/utils';
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
    }, 3000);
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
      <AnimatePresence mode="wait">
        <motion.div
          key={content?.id || content?._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // Faster transition
          className="absolute inset-0 bg-background"
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
                  src={content?.backdropUrl || content?.posterUrl}
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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(var(--background-rgb),0.5)]" />
        </motion.div>
      </AnimatePresence>

      {/* Content Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`info-${content?.id || content?._id}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute bottom-[25%] left-10 lg:left-20 max-w-3xl space-y-8 z-10"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            {variant === 'B' ? (
              <span className="px-3 py-1 bg-gradient-to-r from-primary to-accent text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-primary/30 flex items-center gap-2 animate-pulse">
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
            className="text-7xl lg:text-8xl font-black tracking-tighter text-foreground drop-shadow-sm italic"
          >
            {content?.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground line-clamp-2 font-medium max-w-xl"
          >
            {content?.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center space-x-6 pt-6"
          >
            <button
              onClick={handlePlay}
              aria-label={`Stream ${content?.title} now`}
              className={cn(
                'flex items-center space-x-3 text-primary-foreground px-10 py-5 rounded-2xl font-black transition-all active:scale-95 shadow-2xl group/play overflow-hidden relative',
                'bg-primary hover:bg-primary/90'
              )}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/play:translate-x-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center space-x-3">
                <Play fill="currentColor" size={24} />
                <span className="text-lg">STREAM NOW</span>
              </span>
            </button>

            <button
              aria-label={`View details for ${content?.title}`}
              className="flex items-center space-x-3 bg-surface-deep/60 backdrop-blur-xl text-foreground px-10 py-5 rounded-2xl font-black hover:bg-surface-deep/80 transition-all active:scale-95 border border-border shadow-2xl"
            >
              <Info size={24} />
              <span className="text-lg">DETAILS</span>
            </button>

            <button
              onClick={() =>
                isFavorited
                  ? removeFromLibrary(content?.id?.toString() || content?._id || '')
                  : addToLibrary(content?.id?.toString() || content?._id || '')
              }
              aria-label={isFavorited ? `Remove ${content?.title} from library` : `Add ${content?.title} to library`}
              className={`p-5 rounded-2xl transition-all border shadow-2xl ${
                isFavorited
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-surface-deep/60 backdrop-blur-xl border-border text-foreground hover:bg-surface-deep/80'
              }`}
            >
              {isFavorited ? <Check size={28} /> : <Plus size={28} />}
            </button>

            <button
              onClick={() => {
                const url = `${window.location.origin}/watch?id=${content?.id || content?._id}&ref=user_share`;
                if (navigator.share) {
                  navigator
                    .share({
                      title: content?.title,
                      text: `I'm exploring ${content?.title} at MaiWatch Scenery!`,
                      url: url,
                    })
                    .then(() => logExperimentEvent('viral_loop', 'A' as ExperimentGroup, 'share_success'));
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard! Share it with friends.');
                  logExperimentEvent('viral_loop', 'A' as ExperimentGroup, 'copy_link');
                }
              }}
              className="p-5 rounded-2xl bg-surface-deep/60 backdrop-blur-xl border border-border text-foreground hover:bg-surface-deep/80 transition-all active:scale-95 shadow-2xl"
              title="Share with friends"
            >
              <motion.div whileHover={{ rotate: 15 }}>
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
              </motion.div>
            </button>
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
