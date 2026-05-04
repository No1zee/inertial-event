'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveProfile, useContinueWatching, type ContinueWatchingItem } from '@/lib/stores/localDataStore';
import { Play, TrendingUp, History, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';
import { EditorialSpotlight } from './EditorialSpotlight';
import { AfricanCinematicUniverse } from './AfricanCinematicUniverse';

export const HomeDashboard: React.FC = () => {
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
      const baseTrending = await contentApi.getTrending(Math.floor(Math.random() * 3) + 1);
      if (activeProfile?.preferences?.genres?.length || activeProfile?.preferences?.vibes?.length) {
        return contentApi.getPersonalizedMix(baseTrending, activeProfile.preferences);
      }
      return [...baseTrending].sort(() => Math.random() - 0.5);
    },
    staleTime: 0,
    refetchOnMount: true,
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
      {/* 1. Dashboard Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12"
      >
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
              {greeting}
            </span>
          </div>
          <PretextHeadline
            text={activeProfile.name}
            fontSize={64}
            fontWeight={900}
            letterSpacing="-0.04em"
            className="text-white uppercase"
          />
        </div>

        <div className="flex items-center gap-8 pb-1">
          <button 
            onClick={() => router.push('/profile')}
            className="h-12 px-8 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
          >
            Refine Profile
          </button>
        </div>
      </motion.div>

      {/* 2. Quick Access (Resume + Trending) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
        
        {/* Left Wing: Continue Watching */}
        <div className="relative group/continue-watching">
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
            <AnimatePresence mode="popLayout" initial={false}>
              {continueWatching.length > 0 ? (
                <motion.div 
                  key="continue-list"
                  className="flex gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {continueWatching
                    .slice(0, 5)
                    .map((item, idx) => (
                      <ContinueWatchingCard
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
                </motion.div>
              ) : (
                <motion.div 
                  key="continue-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-32 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-1 group/empty hover:bg-white/[0.04] transition-all duration-700"
                >
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em] opacity-40 group-hover/empty:opacity-60 transition-opacity">Your list is empty</span>
                  <span className="text-[7px] text-zinc-800 uppercase tracking-widest opacity-20">Start watching something to see it here</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Wing: Trending */}
        <div className="relative group/trending">
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
              ?.slice(0, 5)
              .map((item, idx) => (
                <TrendingCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => router.push(`/watch?id=${item.id}&type=${item.type || 'movie'}`)}
                />
              ))}
          </div>
        </div>
      </div>

      {/* 3. The Masterpiece (Editorial Spotlight) */}
      <AnimatePresence>
        {trending && trending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20"
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Recommended for You</span>
              <div className="h-[1px] w-24 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>
            <EditorialSpotlight 
              item={trending[0]} 
              curationReason={trending[0].editorialReason || "HANDPICKED FOR YOUR PROFILE"}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. The ACU Advance (African Cinematic Universe) */}
      <AfricanCinematicUniverse />
    </section>
  );
};

const ContinueWatchingCard = ({ item, index, onClick }: { item: ContinueWatchingItem; index: number; onClick: () => void }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={isNavigating ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1], x: 0 } : { opacity: 1, x: 0 }}
      transition={isNavigating ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : { delay: index * 0.1, duration: 0.8 }}
      onMouseEnter={() => {
        const providerQuery = item.providerId ? `&provider=${item.providerId}` : '';
        const url = item.type === 'movie'
          ? `/watch?id=${item.id}&type=movie${providerQuery}`
          : `/watch?id=${item.id}&type=tv&season=${item.season || 1}&episode=${item.episode || 1}${providerQuery}`;
        router.prefetch(url);
      }}
      onClick={() => {
        setIsNavigating(true);
        onClick();
      }}
      className="relative flex-shrink-0 w-[280px] aspect-[21/9] rounded-[1.5rem] overflow-hidden bg-black/40 border border-white/5 hover:border-amber-500/30 transition-all duration-500 cursor-pointer group/card"
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

const TrendingCard = ({ item, index, onClick }: { item: Content; index: number; onClick: () => void }) => {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
      onMouseEnter={() => router.prefetch(`/watch?id=${item.id}&type=${item.type || 'movie'}`)}
      onClick={onClick}
      className="relative flex-shrink-0 w-[220px] aspect-[16/9] rounded-[1.5rem] overflow-hidden bg-black/40 border border-white/5 hover:border-red-500/30 transition-all duration-500 cursor-pointer group/card"
    >
    <OptimizedImage
      src={item.backdrop_path || item.poster_path || ''}
      alt={item.title || ''}
      fill
      className="object-cover opacity-50 group-hover/card:opacity-90 transition-all duration-700 group-hover/card:scale-110"
    />
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[8px] font-black text-white uppercase tracking-tighter">Hot Now</span>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent p-5 flex flex-col justify-end">
      <PretextHeadline
        text={item.title || ''}
        fontSize={10}
        fontWeight={900}
        letterSpacing="-0.02em"
        className="text-white uppercase truncate mb-1"
      />
      {item.editorialReason && (
        <span className="text-[7px] font-medium text-zinc-400 line-clamp-1 italic">
          {item.editorialReason}
        </span>
      )}
    </div>
    </motion.div>
  );
};

