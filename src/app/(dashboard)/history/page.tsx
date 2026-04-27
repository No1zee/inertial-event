'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useWatchHistory, useWatchHistoryActions } from '@/lib/stores/localDataStore';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Trash2, Play, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryPage() {
  const history = useWatchHistory();
  const { removeFromWatchHistory, clearWatchHistory } = useWatchHistoryActions();

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-10 lg:px-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            Your <span className="text-red-600">Archive</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">
            {history.length} items discovered in your timeline
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear your entire watch history?')) {
                clearWatchHistory();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
          >
            <Trash2 size={14} />
            Clear Archive
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-40">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
            <Clock size={32} />
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em]">No history found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative flex gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-300"
            >
              <div className="relative aspect-video w-32 md:w-40 shrink-0 rounded-lg overflow-hidden border border-white/5">
                <OptimizedImage
                  src={item.backdrop || item.poster || item.backdrop_path || item.poster_path}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                    <Play size={16} fill="currentColor" className="ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full bg-red-600" style={{ width: `${item.progress}%` }} />
                </div>
              </div>

              <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                <div className="space-y-1">
                  <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    {item.type === 'tv' ? (
                      <span className="text-zinc-400">
                        S{item.season} E{item.episode}
                      </span>
                    ) : (
                      <span className="text-zinc-400">Movie</span>
                    )}
                    <span className="opacity-30">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDistanceToNow(item.lastWatched, { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeFromWatchHistory(item.id);
                  }}
                  className="self-end p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
