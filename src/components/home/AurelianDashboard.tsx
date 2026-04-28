'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveProfile, useContinueWatching, useWatchHistoryActions, type ContinueWatchingItem } from '@/lib/stores/localDataStore';
import { Play, TrendingUp, History, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';
import { cn } from '@/lib/utils';

export const AurelianDashboard: React.FC = () => {
  const activeProfile = useActiveProfile();
  const continueWatching = useContinueWatching();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: trending } = useQuery<Content[]>({
    queryKey: ['trending_pulse', activeProfile?.preferences],
    queryFn: async () => {
      const baseTrending = await contentApi.getTrending(1);
      if (activeProfile?.preferences?.genres?.length || activeProfile?.preferences?.vibes?.length) {
        return contentApi.getPersonalizedMix(baseTrending, activeProfile.preferences);
      }
      return baseTrending;
    },
    staleTime: 1000 * 60 * 30,
  });

  const greeting = useMemo(() => {
    if (!mounted) return 'Welcome';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, [mounted]);

  if (!mounted || !activeProfile) return null;

  return (
    <section className="relative px-10 lg:px-24 pt-32 pb-12">
      {/* 1. S-Class Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[1px] w-8 bg-amber-500/50" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/70">
            Aurelian Control / {greeting}
          </span>
        </div>
        <PretextHeadline
          text={activeProfile.name}
          fontSize={64}
          fontWeight={900}
          letterSpacing="-0.04em"
          className="text-white"
          shadow={{
            color: 'rgba(255, 191, 0, 0.2)',
            blur: 40,
            offsetX: 0,
            offsetY: 10
          }}
        />
      </motion.div>

      {/* 2. The Command Panel (Aurelian Glass) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
        
        {/* Left Wing: Your Pipeline (Resume) */}
        <div className="relative group/pipeline">
          <div className="flex items-center gap-3 mb-6">
            <History size={16} className="text-zinc-500" />
            <PretextHeadline
              text="Continue Watching"
              fontSize={12}
              fontWeight={700}
              letterSpacing="0.2em"
              className="text-zinc-500 uppercase"
            />
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <AnimatePresence mode="wait">
              {continueWatching
                .filter(item => item && item.id)
                .slice(0, 5)
                .map((item, idx) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => {
                      const providerQuery = item.providerId ? `&provider=${item.providerId}` : '';
                      const url =
                        item.type === 'movie'
                          ? `/watch?id=${item.id}&type=movie${providerQuery}`
                          : `/watch?id=${item.id}&type=tv&season=${item.season || 1}&episode=${
                              item.episode || 1
                            }${providerQuery}`;
                      router.push(url);
                    }}
                  />
                ))}
              {continueWatching.length === 0 && (
                <div className="w-full h-32 rounded-[2rem] bg-zinc-900/20 border border-white/5 flex items-center justify-center border-dashed">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Pipeline Empty</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Wing: The Pulse (Trending) */}
        <div className="relative group/pulse">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={16} className="text-amber-500/70" />
            <PretextHeadline
              text="Trending"
              fontSize={12}
              fontWeight={700}
              letterSpacing="0.2em"
              className="text-amber-500/70 uppercase"
            />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {trending
              ?.filter(item => item && item.id)
              .slice(0, 5)
              .map((item, idx) => (
                <PulseCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => router.push(`/watch?id=${item.id}&type=${item.type || 'movie'}`)}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const PipelineCard = ({ item, index, onClick }: { item: ContinueWatchingItem; index: number; onClick: () => void }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={isNavigating ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1], x: 0 } : { opacity: 1, x: 0 }}
      transition={isNavigating ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : { delay: index * 0.1, duration: 0.8 }}
      onClick={() => {
        setIsNavigating(true);
        onClick();
      }}
      className="relative flex-shrink-0 w-[280px] aspect-[21/9] rounded-[1.5rem] overflow-hidden bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-all duration-500 cursor-pointer group/card"
    >
    <OptimizedImage
      src={item.backdrop || item.poster || ''}
      alt={item.title || 'Untitled'}
      fill
      className="object-cover opacity-40 group-hover/card:opacity-80 transition-all duration-700 group-hover/card:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-5 flex flex-col justify-end">
      <div className="flex items-center justify-between">
        <div className="max-w-[70%]">
          <PretextHeadline
            text={item.title}
            fontSize={12}
            fontWeight={900}
            letterSpacing="-0.02em"
            className="text-white uppercase truncate mb-1"
          />
          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
            {item?.type === 'tv' ? `S${item.season} E${item.episode}` : 'Feature Film'}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover/card:bg-amber-500 group-hover/card:text-black transition-all">
          <Play size={12} fill="currentColor" className="ml-0.5" />
        </div>
      </div>
    </div>
    
    {/* Progress Bar */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
      <motion.div
        className="h-full bg-amber-500"
        initial={{ width: 0 }}
        animate={{ width: `${item.progress}%` }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </div>
  </motion.div>
  );
};

const PulseCard = ({ item, index, onClick }: { item: Content; index: number; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
    onClick={onClick}
    className="relative flex-shrink-0 w-[220px] aspect-[16/9] rounded-[1.5rem] overflow-hidden bg-zinc-900/40 border border-white/5 hover:border-red-500/30 transition-all duration-500 cursor-pointer group/card"
  >
    <OptimizedImage
      src={item.backdrop_path || item.poster_path || ''}
      alt={item.title || ''}
      fill
      className="object-cover opacity-50 group-hover/card:opacity-90 transition-all duration-700 group-hover/card:scale-110"
    />
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[8px] font-black text-white uppercase tracking-tighter">Live Pulse</span>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent p-5 flex flex-col justify-end">
      <PretextHeadline
        text={item.title || ''}
        fontSize={10}
        fontWeight={900}
        letterSpacing="-0.02em"
        className="text-white uppercase truncate"
      />
    </div>
  </motion.div>
);
