'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FolderOpen, ChevronRight } from 'lucide-react';
import { getSmartCollectionsServer, SmartCollection } from '@/lib/actions/collections';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { OptimizedImage } from '../ui/OptimizedImage';

export function SmartCollections() {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const watchHistory = useLocalDataStore(state => state.watchHistory);

  useEffect(() => {
    const historyIds = Object.keys(watchHistory);
    getSmartCollectionsServer(historyIds).then(data => {
      setCollections(data);
      setIsLoading(false);
    });
  }, [watchHistory]);

  if (isLoading && collections.length === 0) return null;

  return (
    <section className="px-10 lg:px-24 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">AI Dynamic Vaults</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">
              Neural Synthesis Curated Archives
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {collections.map((collection, idx) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative h-[300px] rounded-[2.5rem] bg-zinc-900/30 border border-white/5 hover:border-purple-500/30 transition-all overflow-hidden cursor-pointer"
            >
              {/* Folder Background (Staggered Poststack) */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
                <div className="flex items-center gap-3 mb-2">
                  <FolderOpen size={16} className="text-purple-400" />
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                    Neural Cluster
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-purple-400 transition-colors">
                  {collection.title}
                </h3>
                <p className="text-sm text-zinc-400 line-clamp-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {collection.description}
                </p>
              </div>

              {/* Stacked Images Effect */}
              <div className="absolute top-12 right-12 w-32 h-44 z-10">
                {collection.items.slice(0, 3).map((item, i) => (
                  <div
                    key={item.id}
                    className="absolute inset-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 group-hover:scale-110"
                    style={{
                      transform: `rotate(${i * 10 - 5}deg) translate(${i * 20}px, ${i * -10}px)`,
                      zIndex: 3 - i,
                      opacity: 1 - i * 0.2,
                    }}
                  >
                    <OptimizedImage src={item.poster} alt={item.title} fill className="object-cover" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

              {/* Hover Reveal Items */}
              <div className="absolute inset-x-8 bottom-8 flex justify-end transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30">
                <button className="h-12 px-6 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  Open Vault
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
