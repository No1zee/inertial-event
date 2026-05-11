'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Snowflake, Play, Info } from 'lucide-react';
import { SmartCollection } from '@/lib/api/collections';
import { OptimizedImage } from './ui/OptimizedImage';
import { PretextHeadline } from './Common/PretextHeadline';
import { useLocalDataStore } from '@/lib/stores/localDataStore';

interface ArchiveModalProps {
  collection: SmartCollection | null;
  onClose: () => void;
}

export function ArchiveModal({ collection, onClose }: ArchiveModalProps) {
  const createCollection = useLocalDataStore(state => state.createCollection);

  if (!collection) return null;

  const handleFreeze = () => {
    // Create a permanent collection from this smart archive
    createCollection({
      name: collection.title,
      description: collection.description,
      poster: collection.items[0]?.poster || '',
      isDefault: false,
      isPublic: false,
      pinned: false,
    });
    
    // We need to wait for the ID or use a different strategy.
    // For now, let's just alert the user.
    alert('Collection Saved: Added to your library.');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-hidden"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-zinc-900/50 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="p-12 pb-6 flex items-start justify-between shrink-0">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                  Curated Collection: {collection.matchScore}% Match
                </div>
              </div>
              <PretextHeadline
                text={collection.title}
                fontSize={48}
                fontWeight={900}
                letterSpacing="-0.04em"
                className="text-white uppercase"
              />
              <p className="text-zinc-400 max-w-2xl text-lg font-medium leading-relaxed">
                {collection.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleFreeze}
                className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 hover:border-amber-500/30 transition-all"
              >
                <Snowflake size={18} className="text-amber-500" />
                Save Collection
              </button>
              <button
                title="Close"
                aria-label="Close"
                onClick={onClose}
                className="h-14 w-14 rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white flex items-center justify-center transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Logic Bar (Director's Cut) */}
          <div className="px-12 py-6 bg-purple-500/5 border-y border-purple-500/10 shrink-0">
            <div className="flex items-start gap-4">
              <Info size={20} className="text-purple-400 shrink-0 mt-1" />
              <p className="text-purple-200/60 font-medium italic text-lg leading-snug">
                &quot;{collection.logic}&quot;
              </p>
            </div>
          </div>

          {/* Grid of Items */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {collection.items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative aspect-2/3 rounded-2xl overflow-hidden bg-zinc-800 border border-white/5 cursor-pointer"
                >
                  <OptimizedImage src={item.poster} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <div className="space-y-1">
                      <p className="text-white font-black text-xs uppercase tracking-tighter truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2">
                         <Play size={10} className="text-amber-500 fill-amber-500" />
                         <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Watch Now</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

