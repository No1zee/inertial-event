'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Info, Share2, History } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Content } from '@/lib/types/content';
import { useRef } from 'react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface AcuHeroProps {
  item?: Content;
}

export function AcuHero({ item }: AcuHeroProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Parallax & Fade Effects
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1.05, 1.2]);

  if (!item) return null;

  const handleWatch = () => {
    router.push(`/watch?id=${item.id}&type=${item.type}&provider=acu`);
  };

  return (
    <section ref={containerRef} className="relative h-[90vh] md:h-[100vh] w-full overflow-hidden bg-[#0a0a0a]">
      {/* 1. Cinematic Background Layer */}
      <motion.div style={{ y: y1, scale, opacity }} className="absolute inset-0 z-0">
        {item.backdrop && (
          <OptimizedImage src={item.backdrop} alt={item.title} fill className="object-cover" priority sizes="100vw" />
        )}

        {/* Advanced Scrim Architecture */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

        {/* Color Grading: ACU Deep Amber & Obsidian */}
        <div className="absolute inset-0 bg-[#ea580c]/5 mix-blend-color" />

        {/* Film Grain Texture */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay bg-[url('https://res.cloudinary.com/dff797v9p/image/upload/v1678611181/grain_f0b9d9.png')]" />
      </motion.div>

      {/* 2. Heritage Ribbon (Top) */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 right-0 z-30 pt-32 px-6 md:px-12 pointer-events-none"
      >
        <div className="flex items-center gap-6 overflow-hidden">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-amber-500" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.6em] whitespace-nowrap">
            Preserving The Narrative Heritage
          </span>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-amber-500 to-transparent opacity-20" />
        </div>
      </motion.div>

      {/* 3. Main Content Layer */}
      <div className="relative z-20 h-full flex items-center px-6 md:px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-4xl"
        >
          {/* ACU Identity Reveal */}
          <div className="flex flex-col gap-1 mb-10">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12">
                <OptimizedImage
                  src="/providers/acu.svg"
                  alt="ACU"
                  fill
                  className="object-contain filter brightness-125 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.4em]">Cinema Africa</span>
                <span className="text-sm font-black text-white/90 tracking-tighter uppercase italic">
                  African Cinematic Universe
                </span>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <PretextHeadline
                text={item.title}
                fontSize={96}
                fontWeight={900}
                maxWidth={1000}
                className="text-white leading-[0.85] tracking-tighter mb-4 filter drop-shadow-2xl"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.8 }}
              className="text-zinc-400 text-lg md:text-xl max-w-xl leading-relaxed font-medium border-l-2 border-amber-600/30 pl-6"
            >
              {item.description ||
                "A journey through the soul of African storytelling. Experience the breadth of our continent's most powerful visual narratives."}
            </motion.p>
          </div>

          {/* Action Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap items-center gap-6"
          >
            <button
              onClick={handleWatch}
              className="group relative px-10 py-4 overflow-hidden rounded-full bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(245,158,11,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Play fill="currentColor" size={16} />
                Begin Experience
              </span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out opacity-20" />
            </button>

            <button className="flex items-center gap-3 px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
              <Info size={16} />
              Log Details
            </button>

            <div className="flex gap-4 ml-2">
              <button
                title="View History"
                aria-label="View History"
                className="p-4 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <History size={18} />
              </button>
              <button
                title="Share Content"
                aria-label="Share Content"
                className="p-4 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <Share2 size={18} />
              </button>
            </div>
          </motion.div>

          {/* Technical Tagging */}
          <div className="mt-12 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Heritage Status</span>
              <span className="text-sm text-yellow-500/80 font-bold uppercase">Masterclass Rank</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Region</span>
              <span className="text-sm text-white font-bold uppercase">Pan-African</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Heritage Pattern Reveal (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5" />

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
        >
          <div className="w-[1px] h-10 bg-gradient-to-b from-amber-500 to-transparent" />
          <span className="text-[8px] font-bold text-amber-500 uppercase tracking-[0.4em]">Scroll</span>
        </motion.div>
      </div>
    </section>
  );
}
