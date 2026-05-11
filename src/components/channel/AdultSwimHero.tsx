'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Content } from '@/lib/types/content';
import { Play, Info, History } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { getOptimizedImageUrl } from '@/lib/utils/image';

interface AdultSwimHeroProps {
  item: Content;
}

const PHRASES = [
  'Everything you want. None of what you need.',
  "It's late. Do you know where your life went?",
  "Adult Swim. We're as confused as you are.",
  "Go to bed. Or don't. We're not your parents.",
  'JUST STARE BLANKLY.',
  'WASTE YOUR TIME WITH US.',
  'THIS IS NOT A TEST. THIS IS NONSENSE.',
  'CARTOONS FOR PEOPLE WHO FORGOT HOW TO SLEEP.',
  'STARE AT THE BRIGHT LIGHT.',
  'EYEBALLS ARE FOR WATCHING.',
];

export function AdultSwimHero({ item }: AdultSwimHeroProps) {
  const [phrase, setPhrase] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  }, []);

  if (!item) return null;

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <section
      ref={containerRef}
      className="relative h-[90vh] md:h-[100vh] w-full bg-black flex items-center justify-center overflow-hidden font-sans"
    >
      {/* Grain & Scanline Overlays */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none z-10 bg-[url('/noise.svg')] mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Background Content Layer (Optional) */}
      <motion.div
        style={{ y: y1, opacity }}
        className="absolute inset-0 z-0 flex items-center justify-center opacity-20 filter grayscale contrast-150 brightness-50"
      >
        {item.backdrop_path && (
          <OptimizedImage
            src={getOptimizedImageUrl(item.backdrop_path, 'original')}
            alt=""
            fill
            className="w-full h-full object-cover"
          />
        )}
      </motion.div>

      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl">
        {/* Console Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-6 text-white font-mono text-[10px] tracking-[0.4em] uppercase whitespace-nowrap"
        >
          <span>ID: AS-80-BUMP</span>
          <span className="w-1 h-1 bg-white rounded-full" />
          <span>TIME: {currentTime}</span>
          <span className="w-1 h-1 bg-white rounded-full" />
          <span>STATUS: BROADCASTING</span>
        </motion.div>

        {/* Iconic [adult swim] Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <motion.div
            animate={{
              opacity: [1, 0.5, 1, 0.8, 1],
              filter: ['brightness(1)', 'brightness(2)', 'brightness(1)', 'brightness(1.5)', 'brightness(1)'],
            }}
            transition={{ repeat: Infinity, duration: 4, times: [0, 0.05, 0.1, 0.15, 1] }}
            className="text-white font-black text-4xl md:text-6xl tracking-tighter border-[6px] border-white px-10 py-3 inline-block shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            [adult swim]
          </motion.div>
        </motion.div>

        {/* Sarcastic Bump Phrase */}
        <div className="h-32 md:h-48 flex items-center justify-center mb-12">
          <motion.div
            key={phrase}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5 }}
          >
            <PretextHeadline
              text={phrase}
              fontSize={52}
              fontWeight={700}
              maxWidth={800}
              className="text-white leading-tight tracking-tight opacity-90 text-center"
            />
          </motion.div>
        </div>

        {/* Current Program */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="space-y-1">
            <h2 className="text-zinc-600 text-[10px] uppercase tracking-[0.6em] font-black">Playing Tonight</h2>
            <div className="h-[1px] w-full bg-linear-to-r from-transparent via-zinc-800 to-transparent mb-4" />
            <p className="text-white text-4xl md:text-6xl font-black tracking-tighter uppercase italic drop-shadow-lg">
              {item.title}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
              <button className="group relative bg-white text-black px-12 py-6 text-2xl font-black tracking-tighter transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] active:translate-x-0 active:translate-y-0 shadow-[8px_8px_0px_rgba(255,255,255,0.2)] hover:shadow-[12px_12px_0px_rgba(255,255,255,0.3)]">
                <span className="flex items-center gap-3">
                  <Play size={24} fill="currentColor" />
                  WATCH
                </span>
              </button>
            </Link>

            <button
              title="More Info"
              aria-label="More Info"
              className="p-6 border border-white/20 hover:bg-white/5 transition-all text-white/50 hover:text-white"
            >
              <Info size={28} />
            </button>
            <button
              title="Watch History"
              aria-label="Watch History"
              className="p-6 border border-white/20 hover:bg-white/5 transition-all text-white/50 hover:text-white"
            >
              <History size={28} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Ambient Watermark Branding */}
      <div className="absolute bottom-12 left-12 text-zinc-900 font-black text-[20vw] leading-none select-none pointer-events-none opacity-20">
        [as]
      </div>

      <div className="absolute top-12 right-12 flex flex-col items-end opacity-20 pointer-events-none">
        <span className="text-white font-black text-2xl tracking-tighter underline">LATE NIGHT</span>
        <span className="text-white font-mono text-[10px] tracking-widest">EST 2001</span>
      </div>

      {/* Bottom Fade to Dashboard */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-linear-to-t from-black to-transparent z-20" />
    </section>
  );
}

