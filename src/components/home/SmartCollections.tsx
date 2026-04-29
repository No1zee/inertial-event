'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FolderOpen, ChevronRight } from 'lucide-react';
import { getSmartCollections, SmartCollection } from '@/lib/api/collections';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PretextHeadline } from '../Common/PretextHeadline';
import { ArchiveModal } from '../ArchiveModal';

export function SmartCollections() {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<SmartCollection | null>(null);
  const watchHistory = useLocalDataStore(state => state.watchHistory);
  const activeProfile = useLocalDataStore(state => state.profiles.find(p => p.id === state.activeProfileId));

  useEffect(() => {
    // Correctly map contentIds from the watch history array
    const historyIds = Array.isArray(watchHistory) 
      ? watchHistory.map(h => h.contentId).filter(Boolean)
      : [];
      
    getSmartCollections(historyIds, activeProfile?.preferences).then(data => {
      setCollections(data);
      setIsLoading(false);
    });
  }, [watchHistory, activeProfile?.preferences]);

  if (isLoading && collections.length === 0) return null;

  return (
    <section id="the-archives" className="px-10 lg:px-24 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <PretextHeadline
              text="The Archives"
              fontSize={30}
              fontWeight={900}
              letterSpacing="-0.02em"
              className="text-white uppercase"
            />
            <div className="mt-1">
              <PretextHeadline
                text="Curated Editorial Collections"
                fontSize={10}
                fontWeight={700}
                letterSpacing="0.4em"
                className="text-zinc-500 uppercase"
              />
            </div>
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
              onClick={() => setSelectedCollection(collection)}
            >
              {/* Folder Background (Staggered Poststack) */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={16} className="text-purple-400" />
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                      Archival Cluster
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Logic Active</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-purple-400 transition-colors">
                  {collection.title}
                </h3>
                
                {/* Neural Logic Snippet (Hover) */}
                <div className="relative h-12 overflow-hidden">
                  <p className="absolute inset-0 text-sm text-zinc-400 line-clamp-2 font-medium transition-all duration-500 group-hover:-translate-y-full opacity-100 group-hover:opacity-0">
                    {collection.description}
                  </p>
                  <p className="absolute inset-0 text-[11px] text-purple-300/60 font-medium italic line-clamp-2 transition-all duration-500 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
                    "{collection.logic}"
                  </p>
                </div>
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
                  Open Archive
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ArchiveModal 
        collection={selectedCollection} 
        onClose={() => setSelectedCollection(null)} 
      />
    </section>
  );
}
