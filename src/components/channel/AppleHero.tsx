'use client';

import { motion } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface AppleHeroProps {
  item: Content;
}

export function AppleHero({ item }: AppleHeroProps) {
  if (!item) return null;

  return (
    <section className="relative h-[85vh] md:h-[100vh] w-full overflow-hidden bg-black font-sans">
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={getOptimizedImageUrl(item.backdrop_path, 'original')}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />
        {/* Ultra-subtle Apple Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Content - Apple-style center-bottom alignment or left-aligned with extreme whitespace */}
      <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-12 lg:px-24 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl space-y-6"
        >
          <div className="flex items-center space-x-2">
            <span className="text-white text-[10px] font-bold uppercase tracking-[0.5em] opacity-60">
              Apple Original
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[100px] font-semibold text-white tracking-tight leading-[1] max-w-2xl">
            {item.title}
          </h1>

          <div className="flex items-center space-x-3 text-white/70 font-medium text-sm">
            <span>Drama</span>
            <span className="opacity-30">•</span>
            <span>4K</span>
            <span className="opacity-30">•</span>
            <span>Dolby Vision</span>
            <span className="opacity-30">•</span>
            <span>Atmos</span>
          </div>

          <p className="text-lg md:text-xl text-white/80 line-clamp-2 max-w-2xl font-light leading-snug">
            {item.description}
          </p>

          <div className="flex items-center gap-4 pt-6">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <Button className="bg-white hover:bg-white/90 text-black font-semibold h-14 px-12 rounded-lg text-lg transition-all active:scale-[0.98]">
                <Play size={20} fill="currentColor" className="mr-2" />
                Stream Now
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold h-14 px-8 rounded-lg text-lg backdrop-blur-2xl border border-white/5 transition-all"
            >
              <Plus size={24} className="mr-2" />
              Add to Up Next
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Apple "Glass" Bottom Bar Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
