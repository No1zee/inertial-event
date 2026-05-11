'use client';

import { motion } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Info, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface MaxHeroProps {
  item: Content;
}

export function MaxHero({ item }: MaxHeroProps) {
  if (!item) return null;

  return (
    <section className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden bg-[#000510]">
      {/* Ambient Max Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[70%] bg-[#002AFF]/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-[#002AFF]/10 blur-[120px] rounded-full" />
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
        {/* Max Signature Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-[#000510] via-[#000510]/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-[#000510] via-[#000510]/60 to-transparent" />

        {/* Vertical Stripe Pattern (Subtle) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:40px_100%]" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-12 lg:px-24 pb-20 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-4xl space-y-8"
        >
          {/* Max Premium Badge */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#002AFF] p-1.5 rounded-sm">
              <Crown size={16} className="text-white fill-current" />
            </div>
            <span className="text-white font-bold text-sm tracking-[0.2em] uppercase">Max Original | HBO</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white tracking-tighter leading-[0.85] italic">
            {item.title}
          </h1>

          <div className="flex items-center space-x-4 text-white/80 font-semibold text-sm md:text-base">
            <span>{item.releaseDate?.split('-')[0]}</span>
            <span className="w-1 h-1 bg-white/40 rounded-full" />
            <span className="px-2 py-0.5 border border-white/20 rounded text-xs uppercase tracking-wider">TV-MA</span>
            <span className="w-1 h-1 bg-white/40 rounded-full" />
            <span>HD | 5.1</span>
          </div>

          <p className="text-lg md:text-xl text-zinc-300 line-clamp-3 max-w-2xl font-normal leading-relaxed">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <Button className="bg-white hover:bg-[#002AFF] hover:text-white text-black font-black h-16 px-10 rounded-full text-xl transition-all duration-300 hover:scale-105 active:scale-95 group">
                <Play size={28} fill="currentColor" className="mr-3 transition-colors" />
                WATCH NOW
              </Button>
            </Link>
            <Button
              variant="outline"
              className="bg-[#002AFF]/10 hover:bg-[#002AFF]/20 border-white/10 hover:border-[#002AFF]/40 text-white font-bold h-16 px-10 rounded-full text-xl backdrop-blur-xl transition-all"
            >
              <Info size={28} className="mr-3" />
              DETAILS
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Animated Bottom Glow */}
      <motion.div
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-0 left-0 w-full h-[2px] bg-[#002AFF] shadow-[0_0_20px_#002AFF] z-30"
      />
    </section>
  );
}

