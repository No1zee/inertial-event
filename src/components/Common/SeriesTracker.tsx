'use client';

import React, { useEffect } from 'react';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { contentApi } from '@/lib/api/content';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUISounds } from '@/hooks/useUISounds';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Play, Sparkles } from 'lucide-react';

export const SeriesTracker: React.FC = () => {
  const contentState = useLocalDataStore(state => state.contentState);
  const router = useRouter();
  const { playSound } = useUISounds();

  useEffect(() => {
    const checkNewReleases = async () => {
      const activeIds = Object.keys(contentState);
      const now = Date.now();
      const newDiscoveries: { id: string; type: string; title: string; poster: string; label: string; backdrop: string }[] = [];

      for (const id of activeIds) {
        const state = contentState[id];
        if (!state) continue;

        try {
          const lastUpdated = state.updatedAt || 0;
          if (now - lastUpdated < 24 * 60 * 60 * 1000) continue;

          const isMovie = state.type === 'movie';
          const details = await contentApi.getDetails(Number(id), isMovie ? 'movie' : 'tv');

          let isRecentRelease = false;
          let labelText = 'New Release';

          if (isMovie && details?.releaseDate) {
            const release = new Date(details.releaseDate);
            const diffDays = (now - release.getTime()) / (1000 * 3600 * 24);
            if (diffDays >= 0 && diffDays < 7) {
              isRecentRelease = true;
              labelText = 'New Movie';
            }
          } else if (!isMovie && details?.lastAirDate) {
            const lastAir = new Date(details.lastAirDate);
            const diffDays = (now - lastAir.getTime()) / (1000 * 3600 * 24);
            if (diffDays >= 0 && diffDays < 7) {
              isRecentRelease = true;
              labelText = 'New Episode';
            }
          }

          if (isRecentRelease) {
            newDiscoveries.push({
              id,
              type: state.type,
              title: state.title,
              poster: details.poster || state.poster || '',
              backdrop: details.backdrop || state.backdrop || '',
              label: labelText
            });
          }
        } catch (err) {
          console.error(`Failed to check updates for content ${id}:`, err);
        }
      }

      if (newDiscoveries.length > 0) {
        playSound('pop');

        // If only one, show specific toast. If many, show aggregate.
        if (newDiscoveries.length === 1) {
          const discovery = newDiscoveries[0];
          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-3xl w-[380px] bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex cursor-pointer group"
              onClick={() => {
                toast.dismiss(t);
                router.push(`/watch?id=${discovery.id}&type=${discovery.type}`);
              }}
            >
              <div className="absolute inset-0 z-0">
                <OptimizedImage src={discovery.backdrop} alt="" fill className="object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
              </div>

              <div className="relative z-10 w-20 h-28 m-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <OptimizedImage src={discovery.poster} alt={discovery.title} fill className="object-cover" />
              </div>
              
              <div className="relative z-10 flex-1 py-4 pr-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">{discovery.label}</span>
                </div>
                <PretextHeadline
                  text={discovery.title}
                  fontSize={18}
                  fontWeight={900}
                  letterSpacing="-0.02em"
                  className="text-white truncate"
                />
                <p className="text-[10px] font-medium text-zinc-500 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                  Ready in your Pipeline <Sparkles size={10} className="text-amber-500/50" />
                </p>
              </div>

              <div className="relative z-10 w-14 flex items-center justify-center bg-white/[0.03] border-l border-white/5 group-hover:bg-amber-500 group-hover:text-black transition-all">
                <Play size={16} fill="currentColor" />
              </div>
            </motion.div>
          ), { duration: 8000, position: 'bottom-right' });
        } else {
          // Aggregate Intelligence Report
          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-3xl w-[380px] bg-amber-500/90 text-black shadow-[0_30px_60px_rgba(245,158,11,0.3)] flex flex-col p-6 cursor-pointer"
              onClick={() => {
                toast.dismiss(t);
                router.push('/browse'); // Go to library
              }}
            >
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Report</span>
                 <Sparkles size={16} />
              </div>
              <PretextHeadline
                text={`${newDiscoveries.length} New Drops Found`}
                fontSize={24}
                fontWeight={900}
                letterSpacing="-0.02em"
                className="text-black mb-2"
              />
              <p className="text-xs font-bold opacity-70 leading-relaxed">
                Your tracked series have fresh episodes waiting in the archives.
              </p>
              <div className="mt-4 flex gap-2">
                {newDiscoveries.slice(0, 4).map((d) => (
                  <div key={d.id} className="w-10 h-14 rounded-lg overflow-hidden border border-black/20 shadow-lg">
                    <OptimizedImage src={d.poster} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>
          ), { duration: 10000, position: 'bottom-right' });
        }
      }
    };

    // Initial check with delay to let page stabilize
    const timeout = setTimeout(checkNewReleases, 5000);
    const interval = setInterval(checkNewReleases, 4 * 3600 * 1000); // Check every 4 hours
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [contentState, playSound, router]);

  return null;
};
