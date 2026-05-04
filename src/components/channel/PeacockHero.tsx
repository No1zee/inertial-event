'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Info, Share2, Plus } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { useRef } from 'react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface PeacockHeroProps {
  item: Content;
}

export function PeacockHero({ item }: PeacockHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.15]);

  if (!item) return null;

  const peacockColors = [
    '#00BEFF', // Blue
    '#FFEA00', // Yellow
    '#FF6A00', // Orange
    '#FF2D55', // Pink/Red
    '#A855F7', // Purple
    '#22C55E', // Green
  ];

  return (
    <section ref={containerRef} className="relative h-[90vh] md:h-[100vh] w-full overflow-hidden bg-black">
      {/* Peacock Chromatic Aberration / Glows */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {peacockColors.map((color, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.05, 0.15, 0.05],
              x: [0, 20, 0],
              y: [0, 10, 0],
              backgroundColor: color,
            }}
            initial={{
              width: '40vw',
              height: '40vw',
              top: `${i * 15 - 20}%`,
              right: `${(5 - i) * 10 - 20}%`,
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            className="absolute rounded-full blur-[120px]"
          />
        ))}
      </div>

      {/* Cinematic Backdrop */}
      <motion.div style={{ y: y1, scale, opacity }} className="absolute inset-0 z-0">
        <OptimizedImage
          src={getOptimizedImageUrl(item.backdrop_path, 'original')}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />

        {/* Advanced Scrim Architecture */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />

        {/* Subtle Prism Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
      </motion.div>

      {/* Content Layer */}
      <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-12 lg:px-24 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl space-y-6"
        >
          {/* Brand Identity */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex space-x-1">
              {peacockColors.map((color, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, backgroundColor: color }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                />
              ))}
            </div>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.5em]">Exclusive Original</span>
          </div>

          {/* High-Fidelity Title */}
          <div className="mb-6">
            <PretextHeadline
              text={item.title}
              fontSize={90}
              fontWeight={900}
              maxWidth={1000}
              className="text-white leading-[0.85] tracking-tighter mb-4 filter drop-shadow-2xl"
            />
          </div>

          {/* Metadata Strip */}
          <div className="flex items-center gap-6 text-sm font-bold text-white/50 mb-8">
            <span className="text-[#00BEFF] uppercase tracking-widest font-black">Streaming Now</span>
            <div className="w-[1px] h-4 bg-white/10" />
            <span>TV-14</span>
            <div className="w-[1px] h-4 bg-white/10" />
            <span>Drama • 2024</span>
            <div className="w-[1px] h-4 bg-white/10" />
            <span className="px-1.5 py-0.5 border border-white/20 rounded-sm text-[10px] uppercase font-black">
              4K Ultra HD
            </span>
          </div>

          <p className="text-lg md:text-xl text-zinc-300 line-clamp-3 max-w-2xl font-medium leading-relaxed drop-shadow-lg">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-8">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <button className="flex items-center gap-3 bg-white text-black font-black h-14 px-10 rounded-full text-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]">
                <Play size={24} fill="currentColor" />
                Stream Now
              </button>
            </Link>

            <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white font-black h-14 px-8 rounded-full border border-white/20 backdrop-blur-xl transition-all">
              <Plus size={24} />
              Watchlist
            </button>

            <div className="flex gap-3 ml-2">
              <button
                title="More Info"
                aria-label="More Info"
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all border border-white/20 backdrop-blur-xl"
              >
                <Info size={22} />
              </button>
              <button
                title="Share Content"
                aria-label="Share Content"
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all border border-white/20 backdrop-blur-xl"
              >
                <Share2 size={22} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Chromatic Band */}
      <div className="absolute bottom-0 left-0 w-full h-[6px] z-30 flex">
        {peacockColors.map((color, i) => (
          <motion.div key={i} className="flex-1 h-full" initial={false} animate={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Side Branding */}
      <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-[0.02] select-none hidden lg:block">
        <span className="text-[12vw] font-black tracking-[-0.05em] text-white rotate-90 inline-block translate-x-1/2">
          PEACOCK
        </span>
      </div>
    </section>
  );
}
