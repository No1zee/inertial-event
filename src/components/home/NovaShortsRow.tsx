'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Content } from '@/lib/types/content';

export const NovaShortsRow: React.FC = () => {
  const router = useRouter();

  const { data: shorts, isLoading } = useQuery<Content[]>({
    queryKey: ['nova_shorts'],
    queryFn: () => contentApi.getShortsFeed(1),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading || !shorts || shorts.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Zap size={16} className="text-amber-500" />
          </div>
          <div>
            <PretextHeadline
              text="Nova Shorts"
              fontSize={14}
              fontWeight={900}
              letterSpacing="0.2em"
              className="text-white uppercase"
            />
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">
              Discover your next favorite in 60 seconds
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/shorts')}
          className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
        >
          View All Feed
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {shorts.map((item, idx) => (
          <ShortsCard
            key={item.id}
            item={item}
            index={idx}
            onClick={() => router.push(`/shorts?id=${item.id}`)}
          />
        ))}
      </div>
    </section>
  );
};

const ShortsCard = ({ item, index, onClick }: { item: Content; index: number; onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="relative flex-shrink-0 w-[180px] aspect-9/16 rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-amber-500/40 transition-all duration-500 cursor-pointer group"
    >
      <OptimizedImage
        src={item.poster || ''}
        alt={item.title}
        fill
        className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
      />
      
      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent p-5 flex flex-col justify-end">
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-amber-500 group-hover:text-black transition-all mb-3">
          <Play size={12} fill="currentColor" className="ml-0.5" />
        </div>
        
        <PretextHeadline
          text={item.title}
          fontSize={10}
          fontWeight={900}
          letterSpacing="-0.02em"
          className="text-white uppercase line-clamp-2"
        />
        
        {item.rating && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1 h-1 rounded-full bg-amber-500" />
            <span className="text-[8px] font-bold text-amber-500/80 uppercase tracking-widest">
              {(item.rating * 10).toFixed(0)}% Match
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

