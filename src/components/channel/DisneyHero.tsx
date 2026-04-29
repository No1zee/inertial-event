'use client';

import { motion } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface DisneyHeroProps {
  item: Content;
}

export function DisneyHero({ item }: DisneyHeroProps) {
  if (!item) return null;

  return (
    <section className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden bg-[#040714]">
      {/* Disney Magical Particles (Simulated) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100, x: Math.random() * 1000 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: -200,
              x: Math.random() * 1000 + (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 10,
            }}
            className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Backdrop Image */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={getOptimizedImageUrl(item.backdrop_path, 'original')}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />
        {/* Disney Blue Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-[#040714]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040714] via-[#040714]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-12 lg:px-24 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="max-w-3xl space-y-6"
        >
          {/* Brand Logo Placeholder / Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-[#f9f9f9] font-black text-xs uppercase tracking-[0.3em] bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              Disney+ Original
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-[#f9f9f9] tracking-tight leading-[0.9]">
            {item.title}
          </h1>

          <p className="text-lg md:text-xl text-zinc-300 line-clamp-3 max-w-2xl font-medium leading-relaxed">
            {item.description}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <Button className="bg-[#f9f9f9] hover:bg-white text-black font-bold h-14 px-10 rounded text-lg uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                <Play size={24} fill="currentColor" className="mr-3" />
                Watch
              </Button>
            </Link>
            <Button
              variant="outline"
              className="bg-black/30 hover:bg-black/50 border-white/20 text-[#f9f9f9] font-bold h-14 w-14 rounded-full p-0 backdrop-blur-md"
            >
              <Plus size={32} />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0063e5] shadow-[0_0_20px_#0063e5] opacity-50" />
    </section>
  );
}
