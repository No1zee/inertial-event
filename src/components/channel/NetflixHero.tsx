'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Plus, Check, Info } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { useState, useRef } from 'react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface NetflixHeroProps {
  item: Content;
}

export function NetflixHero({ item }: NetflixHeroProps) {
  const [isAdded, setIsAdded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]);

  if (!item) return null;

  return (
    <section ref={containerRef} className="relative h-[90vh] md:h-[100vh] w-full overflow-hidden bg-black">
      {/* Cinematic Backdrop */}
      <motion.div style={{ y: y1, scale, opacity }} className="absolute inset-0 z-0">
        <OptimizedImage
          src={getOptimizedImageUrl(item.backdrop_path, 'original')}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />

        {/* Netflix Iconic Scrims */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/30" />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/40 to-transparent" />

        {/* Netflix Red Glow */}
        <div className="absolute inset-0 bg-[#E50914]/5 mix-blend-color" />

        {/* Film Grain */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none mix-blend-overlay bg-[url('https://res.cloudinary.com/dff797v9p/image/upload/v1678611181/grain_f0b9d9.png')]" />
      </motion.div>

      {/* Content Layer */}
      <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="max-w-4xl space-y-6"
        >
          {/* Identity Reveal */}
          <div className="flex items-center space-x-3 mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-8 h-12 bg-[#E50914] flex items-center justify-center font-black text-white text-2xl rounded-sm shadow-[0_0_20px_rgba(229,9,20,0.5)]"
            >
              N
            </motion.div>
            <span className="text-white/80 font-black text-xs md:text-sm tracking-[0.5em] uppercase">
              Original Series
            </span>
          </div>

          {/* High-Fidelity Title */}
          <div className="mb-6">
            <PretextHeadline
              text={item.title}
              fontSize={100}
              fontWeight={900}
              maxWidth={1000}
              className="text-white leading-[0.85] tracking-tighter mb-4 filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Dynamic Stats Row */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded border border-white/10">
              <div className="bg-[#E50914] text-white font-black px-1.5 py-0.5 rounded-sm text-[10px] italic">
                TOP 10
              </div>
              <span className="text-white font-black text-xs">#1 in Movies Today</span>
            </div>
            <span className="text-green-500 font-black text-sm">98% Match</span>
            <span className="text-zinc-400 font-bold text-sm">2024</span>
            <span className="px-1.5 py-0.5 border border-zinc-500 text-zinc-400 text-[10px] font-black rounded">
              18+
            </span>
            <span className="text-zinc-400 font-bold text-sm">{item.type === 'tv' ? 'Seasons' : '2h 14m'}</span>
          </div>

          <p className="text-lg md:text-xl text-white font-medium line-clamp-3 max-w-2xl leading-relaxed drop-shadow-lg">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <button className="flex items-center gap-3 bg-white hover:bg-white/90 text-black font-black h-14 px-10 rounded-md text-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl">
                <Play size={28} fill="currentColor" />
                Play
              </button>
            </Link>

            <button
              onClick={() => setIsAdded(!isAdded)}
              className="flex items-center gap-3 bg-zinc-500/40 hover:bg-zinc-500/60 text-white font-black h-14 px-8 rounded-md text-xl backdrop-blur-md transition-all border border-white/10"
            >
              {isAdded ? <Check size={28} /> : <Plus size={28} />}
              My List
            </button>

            <button
              title="More Info"
              aria-label="More Info"
              className="p-4 rounded-md bg-zinc-500/40 hover:bg-zinc-500/60 text-white backdrop-blur-md transition-all border border-white/10"
            >
              <Info size={24} />
            </button>
          </div>

          {/* Metadata Tags */}
          <div className="flex items-center space-x-3 text-white/40 font-bold text-xs uppercase tracking-widest pt-4">
            <span>Gritty</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Suspenseful</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Action Masterpiece</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-linear-to-t from-black via-black/60 to-transparent z-10" />
    </section>
  );
}

