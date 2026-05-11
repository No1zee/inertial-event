'use client';

import { motion } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Plus, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface PrimeHeroProps {
  item: Content;
}

export function PrimeHero({ item }: PrimeHeroProps) {
  if (!item) return null;

  return (
    <section className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden bg-[#0F171E]">
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={getOptimizedImageUrl(item.backdrop_path, 'original')}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />
        {/* Prime Deep Blue Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0F171E] via-[#0F171E]/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0F171E] via-[#0F171E]/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-12 lg:px-24 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-3xl space-y-6"
        >
          {/* Prime Badge */}
          <div className="flex items-center space-x-2">
            <div className="bg-[#00A8E1] text-white font-bold text-[10px] px-2 py-0.5 rounded-sm">prime</div>
            <span className="text-white/80 font-bold text-sm tracking-widest uppercase">Amazon Original</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tight leading-[0.95]">
            {item.title}
          </h1>

          <div className="flex items-center space-x-4 text-white font-bold text-sm md:text-base">
            <span className="text-[#00A8E1]">Included with Prime</span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <span>{item.releaseDate?.split('-')[0]}</span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <span className="px-1.5 py-0.5 border border-white/40 rounded text-xs">16+</span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <span>4K UHD</span>
          </div>

          <p className="text-lg md:text-xl text-zinc-300 line-clamp-3 max-w-2xl font-medium leading-relaxed">
            {item.description}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <Button className="bg-[#00A8E1] hover:bg-[#0092c4] text-white font-bold h-14 px-10 rounded-sm text-lg transition-all shadow-[0_4px_15px_rgba(0,168,225,0.3)]">
                <Play size={24} fill="currentColor" className="mr-3" />
                Watch Now
              </Button>
            </Link>
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold h-14 px-8 rounded-sm text-lg backdrop-blur-md"
            >
              <Plus size={24} className="mr-2" />
              Add to Watchlist
            </Button>
            <Button
              variant="ghost"
              className="bg-white/5 hover:bg-white/10 text-white font-bold h-14 w-14 rounded-full p-0"
            >
              <Info size={28} />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Subtle Top "Smile" Glow (Prime Brand Mark) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#00A8E1] opacity-30 blur-[2px] z-30" />
    </section>
  );
}

