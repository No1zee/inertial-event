'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Plus, Info, Share2 } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { useRef } from 'react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface HuluHeroProps {
  item: Content;
}

export function HuluHero({ item }: HuluHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1.05, 1.2]);

  if (!item) return null;

  return (
    <section ref={containerRef} className="relative h-[90vh] md:h-[100vh] w-full overflow-hidden bg-[#0b0c0f]">
      {/* Hulu Green Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <motion.div
          animate={{
            opacity: [0.05, 0.1, 0.05],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#1CE783] blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            opacity: [0.03, 0.08, 0.03],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[#1CE783] blur-[120px] rounded-full"
        />
      </div>

      {/* Cinematic Backdrop */}
      <motion.div style={{ y: y1, scale, opacity }} className="absolute inset-0 z-0">
        <OptimizedImage
          src={getOptimizedImageUrl(item.backdrop_path, 'original')}
          alt={item.title}
          fill
          className="object-cover opacity-70"
          priority
        />

        {/* Hulu Gradient Architecture */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0b0c0f] via-[#0b0c0f]/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0b0c0f] via-[#0b0c0f]/20 to-transparent" />

        {/* Animayhem Texture (Optional/Simulated) */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </motion.div>

      {/* Content Layer */}
      <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-12 lg:px-24 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="max-w-4xl space-y-6"
        >
          {/* Brand Tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center space-x-2 px-4 py-1 bg-[#1CE783] rounded-full shadow-[0_0_20px_rgba(28,231,131,0.3)]"
          >
            <span className="text-[#0b0c0f] text-[10px] font-black uppercase tracking-[0.3em]">Hulu Original</span>
          </motion.div>

          {/* High-Fidelity Typography */}
          <div className="mb-4">
            <PretextHeadline
              text={item.title}
              fontSize={90}
              fontWeight={900}
              maxWidth={1000}
              className="text-white leading-[0.85] tracking-tighter mb-4 filter drop-shadow-2xl"
            />
          </div>

          {/* Hulu Style Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-white/60 mb-6">
            <span className="text-[#1CE783] uppercase tracking-widest">New Episode</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>TV-MA</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Series (2024)</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] uppercase tracking-tighter">
              HD • 5.1
            </span>
          </div>

          <p className="text-lg md:text-xl text-zinc-300 line-clamp-3 max-w-2xl font-medium leading-relaxed border-l-4 border-[#1CE783]/40 pl-6">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-8">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <button className="flex items-center gap-3 bg-[#1CE783] hover:bg-[#15b364] text-[#0b0c0f] font-black h-14 px-10 rounded-full text-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_15px_35px_rgba(28,231,131,0.25)]">
                <Play size={24} fill="currentColor" />
                Start Watching
              </button>
            </Link>

            <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white font-black h-14 px-8 rounded-full border border-white/10 backdrop-blur-xl transition-all">
              <Plus size={24} />
              Add to My Stuff
            </button>

            <div className="flex gap-3 ml-2">
              <button
                title="More Info"
                aria-label="More Info"
                className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10 backdrop-blur-xl"
              >
                <Info size={22} />
              </button>
              <button
                title="Share Content"
                aria-label="Share Content"
                className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10 backdrop-blur-xl"
              >
                <Share2 size={22} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cinematic Side Branding (Hulu Green Vertical) */}
      <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none hidden lg:block">
        <span className="text-9xl font-black tracking-[0.5em] text-[#1CE783] rotate-90 inline-block translate-x-1/2">
          ANIMAYHEM
        </span>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-[#0b0c0f] to-transparent z-10" />
    </section>
  );
}

