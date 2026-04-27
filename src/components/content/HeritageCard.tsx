'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Play, Sparkles } from 'lucide-react';
import { Content } from '@/lib/types/content';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface HeritageCardProps {
  item: Content;
  onPlay: (item: Content) => void;
  onInfo: (item: Content) => void;
}

const HeritageCard = memo(function HeritageCard({ item, onPlay, onInfo }: HeritageCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative aspect-[2/3] group perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-700"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front: Cinematic Poster */}
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <OptimizedImage
            src={item.poster}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Heritage Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/90 text-black rounded-sm backdrop-blur-md shadow-xl">
            <Sparkles size={12} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest">Heritage Selection</span>
          </div>

          <div className="absolute bottom-0 left-0 p-6 w-full">
            <h3 className="text-xl font-display font-black text-white italic tracking-tighter uppercase leading-none mb-2">
              {item.title}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
              <span>{item.releaseDate?.substring(0, 4)}</span>
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              <span>{item.heritage?.regionalOrigins?.[0] || 'African Origin'}</span>
            </div>
          </div>
        </div>

        {/* Back: Educational/Metadata */}
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden bg-[#1a1109] ring-1 ring-amber-500/30 p-8 flex flex-col justify-between rotate-y-180">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-amber-500">
              <Info size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Heritage Insight</span>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                &ldquo;Did You Know?&rdquo;
              </p>
              <p className="text-zinc-300 text-sm italic leading-relaxed font-medium">
                &ldquo;
                {item.heritage?.didYouKnow ||
                  'Discover the untold stories of African cinema history through this masterpiece.'}
                &rdquo;
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-3">
              <button
                onClick={() => onPlay(item)}
                title="Play"
                aria-label="Play"
                className="flex-1 h-12 rounded-sm bg-amber-500 text-black flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber-500/20"
              >
                <Play size={18} fill="currentColor" />
              </button>
              <button
                onClick={() => onInfo(item)}
                title="More Info"
                aria-label="More Info"
                className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
              >
                <Info size={18} />
              </button>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                Part of the ACU Verified Library
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default HeritageCard;
