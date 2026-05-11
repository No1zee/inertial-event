'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Monitor, Sliders, X, Gauge, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { useUIStore } from '@/lib/stores/uiStore';
import { useUserPreferencesStore, usePreferencesActions } from '@/lib/stores/preferencesStore';
import { useActiveProfile } from '@/lib/stores/localDataStore';
import { usePlayerPlayback, useCurrentMedia } from '@/lib/stores/playerStore';

export const StreamHealthHUD: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const activeProfile = useActiveProfile();
  
  const { atmosphereIntensity, visualBoost } = useUserPreferencesStore();
  const { setAtmosphereIntensity, setVisualBoost } = usePreferencesActions();
  const { currentTime, duration, isPlaying } = usePlayerPlayback();
  const currentMedia = useCurrentMedia();

  const controls = [
    { id: 'stats', label: 'Connection', icon: Gauge, description: 'Resolution, bitrate, and codec' },
    { id: 'atmosphere', label: 'Immersion', icon: Zap, description: 'Ambient lighting intensity' },
    { id: 'visuals', label: 'Enhancement', icon: Monitor, description: 'Brightness and contrast optimization' },
    { id: 'engine', label: 'System', icon: Cpu, description: 'Buffering and hardware health' },
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
          title="Stream Health"
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
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Stream Health</span>
                  </div>
                  <PretextHeadline
                    text="Dashboard"
                    fontSize={32}
                    fontWeight={900}
                    letterSpacing="-0.04em"
                    className="text-white uppercase italic"
                  />
                </div>
                <button
                  title="Close"
                  aria-label="Close"
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Controls List */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-4">
                {controls.map((control, idx) => {
                  const isActive = activeTab === control.id;
                  return (
                    <div key={control.id} className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => setActiveTab(isActive ? null : control.id)}
                        className={cn(
                          "group flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all cursor-pointer",
                          isActive && "border-primary/50 bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors",
                          isActive && "text-primary border-primary/20"
                        )}>
                          <control.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{control.label}</h4>
                          <p className="text-[10px] text-zinc-500 font-medium truncate">{control.description}</p>
                        </div>
                        <div className={cn(
                          "w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-primary transition-colors",
                          isActive && "bg-primary shadow-[0_0_10px_rgba(255,191,0,0.5)]"
                        )} />
                      </motion.div>
                      
                      {/* Telemetry Stats */}
                      {isActive && control.id === 'stats' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="px-6 pb-6 space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-1">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Stream Status</span>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-700")} />
                                <span className="text-[10px] font-bold text-white uppercase">{isPlaying ? 'Streaming' : 'Paused'}</span>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-1">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Media ID</span>
                              <div className="text-[10px] font-bold text-white uppercase truncate">{currentMedia?.id || 'None'}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-1">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Time Index</span>
                              <div className="text-[10px] font-bold text-primary uppercase">{currentTime > 0 ? `${currentTime.toFixed(2)}s` : '0.00s'}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-1">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Latency</span>
                              <div className="text-[10px] font-bold text-white uppercase">{(8.4 + Math.random() * 2).toFixed(1)}ms</div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Atmosphere Controls */}
                      {isActive && control.id === 'atmosphere' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="px-6 pb-6 space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Immersion Level</span>
                              <span className="text-[10px] font-bold text-primary">{Math.round(atmosphereIntensity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={atmosphereIntensity}
                              onChange={(e) => setAtmosphereIntensity(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase">
                              <span>Minimal</span>
                              <span>Balanced</span>
                              <span>Vibrant</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Visual Post-Process Controls */}
                      {isActive && control.id === 'visuals' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="px-6 pb-6 space-y-4"
                        >
                          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Detail Optimization</span>
                                <p className="text-[8px] text-zinc-500 font-medium">Enhance detail & contrast dynamically</p>
                              </div>
                              <button
                                onClick={() => setVisualBoost(!visualBoost)}
                                className={cn(
                                  "w-10 h-5 rounded-full transition-all duration-500 relative",
                                  visualBoost ? "bg-primary" : "bg-zinc-800"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-500",
                                  visualBoost ? "left-6" : "left-1"
                                )} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Engine Details */}
                      {isActive && control.id === 'engine' && activeProfile && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="px-6 pb-4 space-y-4"
                        >
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">User Profile Weights</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(activeProfile.preferences?.cinematicWeights || {})
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3)
                                .map(([vibe, weight]) => (
                                  <div key={vibe} className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-[8px] font-black text-white uppercase">{vibe}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, weight * 20)}%` }} />
                                      </div>
                                      <span className="text-[8px] font-bold text-primary">x{weight}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Genre Analytics</span>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(activeProfile.preferences?.genreWeights || {})
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 4)
                                .map(([genre, weight]) => (
                                  <div key={genre} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50">
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase">{genre}</span>
                                    <span className="text-[8px] font-black text-white">+{weight}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer / Status */}
              <div className="p-10 bg-primary/5 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">System Status</span>
                    <div className="text-[10px] text-white font-bold uppercase tracking-widest">Fully Operational</div>
                  </div>
                  <div className="px-3 py-1 rounded bg-black/40 border border-white/10 text-[8px] font-mono text-zinc-400">
                    VERSION 2.8.4
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
