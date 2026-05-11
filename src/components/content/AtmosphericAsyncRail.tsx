'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Content } from '@/lib/types/content';
import { AtmosphericRail } from './AtmosphericRail';
import { getProviderById, getProviderBySlug } from '@/lib/constants/providers';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface RailConfig {
  id: string;
  title: string;
  fetcher: () => Promise<Content[]>;
  aspectRatio?: 'poster' | '16:9' | '21:9' | 'landscape' | 'ultrawide';
  providerId?: string;
  playTrailerOnClick?: boolean;
}

interface AtmosphericAsyncRailProps {
  config: RailConfig;
  type?: string; // e.g. 'movie', 'tv', 'anime' for query key uniqueness
  salt?: number | string;
}

export function AtmosphericAsyncRail({ config, type = 'global', salt }: AtmosphericAsyncRailProps) {
  const hydrated = useHydrated();
  const { data, isLoading, isError } = useQuery<Content[]>({
    queryKey: ['rail', type, config.id, salt],
    queryFn: () => config.fetcher(),
    staleTime: 60 * 60 * 1000, // 1 hour (Data is stable, background SWR handles updates)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours persistence
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    placeholderData: (previousData) => previousData,
  });

  const provider = config.providerId
    ? getProviderById(config.providerId) || getProviderBySlug(config.providerId)
    : null;

  if (isLoading) {
    return (
      <div className="px-10 lg:px-24 space-y-8 animate-pulse relative overflow-hidden min-h-[400px]">
        {provider && (
          <motion.div
            className="absolute top-0 right-0 w-[400px] h-[400px] opacity-5 blur-[100px] pointer-events-none"
            initial={false}
            animate={{ backgroundColor: provider.color }}
          />
        )}
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-6 bg-zinc-800" />
          <div className="h-4 w-48 bg-zinc-900/50 rounded-full" />
        </div>
        <div className="flex gap-6 overflow-hidden pt-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={cn(
                'glass-card border-white/5 rounded-2xl relative overflow-hidden shrink-0',
                config.aspectRatio === '21:9' || config.aspectRatio === 'ultrawide'
                  ? 'w-[350px] md:w-[420px] aspect-21/9'
                  : config.aspectRatio === '16:9' || config.aspectRatio === 'landscape'
                    ? 'w-[280px] md:w-[350px] aspect-video'
                    : 'w-[160px] md:w-[200px] aspect-2/3'
              )}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-10 lg:px-24 py-12 text-center border border-white/5 rounded-[3rem] mx-10 lg:mx-24 bg-zinc-900/20">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Failed to load {config.title}
        </p>
      </div>
    );
  }

  // If not hydrated yet, show skeleton to prevent flash
  if (!hydrated) {
    return (
      <div className="px-10 lg:px-24 space-y-8 min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-6 bg-zinc-800" />
          <div className="h-4 w-48 bg-zinc-900/20 rounded-full" />
        </div>
      </div>
    );
  }

  // Still return an inductee placeholder if data is empty to prevent layout collapse
  if (!data || data.length === 0) {
    return (
      <div className="px-10 lg:px-24 py-16 group relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-zinc-900/5 via-transparent to-zinc-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-8 bg-zinc-800 group-hover:w-12 transition-all duration-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 group-hover:text-zinc-400 transition-colors">
              {config.title}
            </h2>
          </div>
          <div className="flex items-center gap-4 px-12 py-10 rounded-[2rem] border border-dashed border-white/5 bg-zinc-900/10">
            <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse" />
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
              No content available
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AtmosphericRail
      title={config.title}
      items={data}
      railId={config.id}
      aspectRatio={config.aspectRatio}
      providerId={config.providerId}
      playTrailerOnClick={config.playTrailerOnClick}
    />
  );
}

