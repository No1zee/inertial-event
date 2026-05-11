'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Sparkles, Cpu, Layers, GitBranch, Dna, RefreshCw, Activity, Film, PlayCircle } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Content } from '@/lib/types/content';
import { TrailerPlayer } from '@/components/player/TrailerPlayer';
import { useModalActions } from '@/lib/stores/uiStore';

export function UpcomingPreviews() {
  const router = useRouter();
  const [toggles, setToggles] = React.useState({
    av1: true,
    latency: false,
    upscaling: true
  });
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [hoveredPrototype, setHoveredPrototype] = React.useState<number | null>(null);
  const { openTrailerModal } = useModalActions();
  
  // Fetch highly anticipated content via refactored API
  const { data: upcoming, isLoading } = useQuery({
    queryKey: ['platform_upcoming_anticipated'],
    queryFn: () => contentApi.getUpcoming(1),
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const experiments = [
    { title: 'Smart Curation v4', status: 'Optimal', icon: Cpu },
    { title: 'AV1 Master Stream', status: 'Active', icon: Layers },
    { title: 'Project Genesis', status: 'Beta', icon: GitBranch },
  ];

  const handleInitialize = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 3000);
  };

  const handleWatch = (item: Content) => {
    // Priority trailer playback for anticipated previews
    if (item.trailer) {
      openTrailerModal(item.trailer, item.title);
    } else {
      // Fallback to handshake navigation if no trailer key available
      setIsSyncing(true);
      setTimeout(() => {
        router.push(`/watch?id=${item.id}&type=${item.type || 'movie'}`);
      }, 1200);
    }
  };

  return (
    <section id="upcoming-previews" className="px-10 lg:px-24 py-32 relative overflow-hidden bg-black/40">

      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05)_0%,transparent_70%)]" />
      
      {/* Global Sync Overlay */}
      {isSyncing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md"
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-12">
            <div className="mb-10 relative">
              <div className="w-32 h-32 rounded-full border border-white/10 bg-black/40 backdrop-blur-3xl flex items-center justify-center relative overflow-hidden">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                   className="absolute inset-0 border-t border-r border-white/20 rounded-full"
                 />
                 <Sparkles size={48} className="text-white transition-transform duration-700" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-black text-[8px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                Updating Library
              </div>
            </div>

            <PretextHeadline
              text="Optimizing Library"
              fontSize={48}
              fontWeight={900}
              letterSpacing="-0.04em"
              className="text-white uppercase mb-6"
            />

            <div className="max-w-md space-y-8">
              <p className="text-zinc-500 text-sm font-medium leading-relaxed uppercase tracking-widest italic">
                &quot;Curating the next generation of cinematic discovery.&quot;
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 transition-all">
                   <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Sync Status</div>
                   <div className="text-2xl font-black text-white">ACTIVE</div>
                   <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                         animate={{ x: ['-100%', '100%'] }}
                         transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                         className="h-full w-1/2 bg-white/20"
                      />
                   </div>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 transition-all">
                   <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Catalog</div>
                   <div className="text-2xl font-black text-white uppercase">Refined</div>
                   <div className="mt-2 flex gap-1 justify-center">
                      {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
                   </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button className="mt-16 group/btn relative">
               <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity" />
               <div className="relative flex items-center gap-4 px-10 h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Optimizing Experience...</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                     <RefreshCw size={14} className="text-white animate-spin" />
                  </div>
               </div>
            </button>
          </div>

          {/* Decorative Overlays */}
          <div className="absolute top-10 left-10 p-6 opacity-20">
             <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter space-y-1">
                <div>LEGACY_LOG: 0x8F2A</div>
                <div>STATUS: ACTIVE</div>
                <div>INTEGRITY: VERIFIED</div>
             </div>
          </div>

          <div className="absolute bottom-10 right-10 p-6 opacity-20">
             <div className="flex items-center gap-4">
                <div className="text-right">
                   <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Repository</div>
                   <div className="text-[10px] font-bold text-zinc-400">MEDIA_LIBRARY</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <Activity size={20} className="text-zinc-600" />
             </div>
          </div>
        </motion.div>
      )}

      <div className="relative z-10 flex flex-col gap-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] relative group overflow-hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 opacity-20 border-2 border-dashed border-primary rounded-2xl scale-75"
              />
              <Sparkles size={28} className="relative z-10" />
            </div>
            <div>
              <PretextHeadline
                text="Highly Anticipated"
                fontSize={36}
                fontWeight={900}
                letterSpacing="-0.03em"
                className="text-white uppercase leading-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <div className="flex gap-1">
                   {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/40" />)}
                </div>
                <PretextHeadline
                  text="Next-Generation Previews"
                  fontSize={11}
                  fontWeight={800}
                  letterSpacing="0.45em"
                  className="text-zinc-500 uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
          <div className="xl:col-span-2">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                     Future Masters
                   </h3>
                   <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest opacity-60">Curated specifically for your visual signature.</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                {/* Horizontal Scan Line Overlay */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-[1px] bg-red-500/20 z-20 pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                />

                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-16/11 rounded-[2rem] bg-white/5 animate-pulse" />
                  ))
                ) : upcoming?.slice(0, 6).map((item: Content, idx: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    onHoverStart={() => setHoveredPrototype(idx)}
                    onHoverEnd={() => setHoveredPrototype(null)}
                    transition={{ delay: idx * 0.15, type: 'spring', damping: 20 }}
                    className="group relative aspect-16/11 rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-2xl"
                    onClick={() => handleWatch(item)}
                  >
                    <OptimizedImage
                      src={item.backdrop || item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop || item.backdrop_path}` : ''}
                      alt={item.title || item.name || 'Upcoming Content'}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                       <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                          <PlayCircle size={32} fill="currentColor" />
                       </div>
                    </div>

                    {/* UI Corner Elements */}
                    <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                         Watch Preview
                      </div>
                      <div className="text-sm font-black text-white truncate uppercase tracking-tight group-hover:tracking-wide transition-all duration-500">
                        {item.title || item.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>

          <div className="bg-black/40 rounded-[3rem] border border-white/5 p-12 flex flex-col justify-between relative overflow-hidden backdrop-blur-3xl group">
             {/* Red Glow Corner */}
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-[80px] -mr-24 -mb-24 transition-all duration-700 group-hover:bg-red-500/10" />

             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-2 h-2 rounded-full bg-primary" />
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Playback Quality</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-10 font-medium opacity-80 uppercase tracking-widest">
                   Adaptive visual engine refinements.
                </p>
                
                <div className="space-y-4">
                   {[
                     { id: 'av1', label: 'High Quality Streaming', active: toggles.av1 },
                     { id: 'latency', label: 'Low Latency Mode', active: toggles.latency },
                     { id: 'upscaling', label: 'Video Upscaling', active: toggles.upscaling },
                   ].map((item) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center justify-between p-5 rounded-3xl transition-all duration-500 cursor-pointer border",
                          item.active ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/10 opacity-50"
                        )}
                        onClick={() => setToggles(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof toggles] }))}
                      >
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{item.label}</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{item.active ? 'Operational' : 'Idle'}</span>
                         </div>
                         <div className={cn(
                           "w-12 h-6 rounded-full transition-colors duration-500 flex items-center px-1",
                           item.active ? "bg-primary" : "bg-zinc-700"
                         )}>
                            <motion.div 
                              animate={{ x: item.active ? 24 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="w-4 h-4 rounded-full bg-white shadow-lg" 
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mt-12 relative z-10">
                <button 
                  onClick={handleInitialize}
                  disabled={isSyncing}
                  className={cn(
                    "w-full h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-3 shadow-lg",
                    isSyncing ? "bg-zinc-800 text-primary" : "bg-white text-black hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(255,255,255,0.1)]"
                  )}
                >
                   {isSyncing ? 'Updating Library...' : 'Refresh Catalog'}
                   <div className={cn("w-1.5 h-1.5 rounded-full bg-primary", isSyncing ? "animate-ping" : "animate-pulse")} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

