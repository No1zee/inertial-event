'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Settings, Zap, Monitor, Sliders, X, Gauge, Cpu } from 'lucide-react';
import { useLayoutState, useLayoutActions } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

export const DirectorialControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isRailExpanded } = useLayoutState();

  const controls = [
    { id: 'stats', label: 'Telemetry', icon: Gauge, description: 'Real-time performance metrics' },
    { id: 'atmosphere', label: 'Atmosphere', icon: Zap, description: 'Living background intensity' },
    { id: 'visuals', label: 'Post-Process', icon: Monitor, description: 'Color gamut & sharpness' },
    { id: 'engine', label: 'Neural Engine', icon: Cpu, description: 'AI recommendation weighting' },
  ];

  return (
    <>
      {/* Floating Pill Trigger */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[1000] pointer-events-auto"
      >
        <button
          onClick={() => setIsOpen(true)}
          title="Directorial Controls"
          className={cn(
            'group relative flex items-center h-16 w-3 overflow-hidden rounded-l-full bg-white/5 hover:bg-primary transition-all duration-500 border-l border-y border-white/10 hover:w-12',
            isOpen && 'opacity-0 scale-0 pointer-events-none'
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Sliders size={14} className="text-white rotate-90" />
          </div>
        </button>
      </motion.div>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-end p-6 md:p-12 pointer-events-none">
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xl pointer-events-auto"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.98 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md h-[600px] bg-zinc-950 border border-white/10 rounded-[3rem] shadow-cinematic overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="p-10 flex items-center justify-between border-b border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">System HUD</span>
                  </div>
                  <PretextHeadline
                    text="Directorial"
                    fontSize={32}
                    fontWeight={900}
                    letterSpacing="-0.04em"
                    className="text-white uppercase italic"
                  />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Controls List */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-4">
                {controls.map((control, idx) => (
                  <motion.div
                    key={control.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="group flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                      <control.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{control.label}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium truncate">{control.description}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-primary transition-colors" />
                  </motion.div>
                ))}
              </div>

              {/* Footer / Status */}
              <div className="p-10 bg-primary/5 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Environment State</span>
                    <div className="text-[10px] text-white font-bold uppercase tracking-widest">Aurelian Mode / Optimal</div>
                  </div>
                  <div className="px-3 py-1 rounded bg-black/40 border border-white/10 text-[8px] font-mono text-zinc-400">
                    MAI-V2.8.4
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
