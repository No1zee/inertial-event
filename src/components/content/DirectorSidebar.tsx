'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Quote, Check } from 'lucide-react';
import { Content } from '@/lib/types/content';

interface DirectorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  item: Content | null;
}

const DirectorSidebar = memo(function DirectorSidebar({ isOpen, onClose, item }: DirectorSidebarProps) {
  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[350px] md:w-[450px] z-[70] bg-surface-deep/90 backdrop-blur-3xl border-l border-brand-primary/20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-8 flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close sidebar"
              aria-label="Close sidebar"
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              {/* Header Section */}
              <div className="space-y-2 pt-8">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Overview</span>
                </div>
                <h2 className="font-display text-3xl font-black text-white leading-none uppercase italic tracking-tighter">
                  {item.title}
                </h2>
                <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span>{item.releaseDate?.substring(0, 4)}</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {item.heritage?.regionalOrigins?.join(', ') || 'Pan-African'}
                  </span>
                </div>
              </div>

              {/* Director's Note Section */}
              <div className="relative p-6 rounded-sm bg-brand-primary/5 border border-brand-primary/10">
                <Quote className="absolute -top-3 -left-3 text-brand-primary opacity-20" size={40} />
                <h3 className="text-xs font-black uppercase text-brand-primary tracking-widest mb-3">
                  Editor's Note
                </h3>
                <p className="text-sm md:text-base text-amber-50/80 leading-relaxed font-medium italic">
                  &ldquo;
                  {item.heritage?.curatorNote ||
                    'This cinematic piece represents a pivotal moment in African storytelling, weaving traditional narratives with modern visual techniques.'}
                  &rdquo;
                </p>
              </div>

              {/* Cultural Context Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-brand-primary" />
                  Context & Description
                </h3>
                <div className="text-sm text-white/70 leading-relaxed space-y-4">
                  {item.heritage?.culturalContext ? (
                    item.heritage.culturalContext.split('\n').map((para, i) => <p key={i}>{para}</p>)
                  ) : (
                    <p>
                      Historical context and background information are currently being verified.
                    </p>
                  )}
                </div>
              </div>

              {/* Regional Accuracy Badge */}
              {item.heritage?.accuracyVerified && (
                <div className="flex items-center gap-3 p-4 rounded-sm bg-green-500/10 border border-green-500/20">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <Check size={18} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-green-500 uppercase tracking-widest">
                      Verified Info
                    </span>
                    <span className="text-[10px] text-white/40 font-medium">
                      Historical context cross-referenced by local experts.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-8 mt-auto flex gap-4">
              <button className="flex-1 py-4 rounded-sm bg-brand-primary text-black font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-primary/20">
                Watch Now
              </button>
              <button className="px-6 py-4 rounded-sm bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                Add to Watchlist
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default DirectorSidebar;
