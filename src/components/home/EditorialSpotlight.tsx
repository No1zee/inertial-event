'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Star } from 'lucide-react';
import { Content } from '@/lib/types/content';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface EditorialSpotlightProps {
  item: Content;
  curationReason?: string;
  className?: string;
}

export const EditorialSpotlight: React.FC<EditorialSpotlightProps> = ({
  item,
  curationReason = "Critic&apos;s Choice / Essential Cinema",
  className,
}) => {
  const router = useRouter();

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative w-full h-[450px] rounded-[3rem] overflow-hidden group/spotlight mb-16",
        "border border-white/10 shadow-2xl bg-zinc-900/20 backdrop-blur-sm",
        className
      )}
    >
      {/* Background Media */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={item.backdrop || item.backdrop_path || item.poster || ""}
          alt={item.title}
          fill
          className="object-cover opacity-60 group-hover/spotlight:scale-105 transition-transform [transition-duration:2s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-center p-12 md:p-20 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
            {curationReason}
          </span>
        </div>

        <PretextHeadline
          text={item.title}
          fontSize={48}
          fontWeight={900}
          letterSpacing="-0.03em"
          className="text-white mb-2 uppercase leading-none"
        />

        <p className="text-xs text-zinc-400 font-medium line-clamp-2 mb-8 leading-relaxed max-w-lg">
          {item.description}
        </p>

        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push(`/watch?id=${item.id}&type=${item.type || 'movie'}`)}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
          >
            <Play size={16} fill="currentColor" />
            Watch Now
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={12} className={cn("text-primary fill-primary", s > 4 && "opacity-30")} />
              ))}
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {item.rating || "8.4"} Rating
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Accents */}
      <div className="absolute top-10 right-10 flex flex-col items-end gap-2 opacity-30">
        <span className="text-[40px] font-black text-white/10 leading-none tracking-tighter uppercase">
          {item.type === 'tv' ? 'Series' : 'Feature'}
        </span>
        <div className="h-[1px] w-24 bg-white/10" />
      </div>
    </motion.div>
  );
};
