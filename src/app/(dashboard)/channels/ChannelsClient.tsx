'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { BroadcastState } from '@/lib/api/broadcast';
import NativePlayer from '@/components/player/NativePlayer';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ChannelsClientProps {
  initialBroadcasts: BroadcastState[];
}

export default function ChannelsClient({ initialBroadcasts }: ChannelsClientProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastState[]>(initialBroadcasts);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialBroadcasts[0]?.channel.id);

  const activeBroadcast = useMemo(
    () => broadcasts.find(b => b.channel.id === activeChannelId),
    [broadcasts, activeChannelId]
  );

  // Sync elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setBroadcasts(prev =>
        prev.map(b => ({
          ...b,
          elapsed: Date.now() - b.startTime,
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!activeBroadcast) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-black overflow-hidden relative">
      {/* Background Ambiance */}
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src={activeBroadcast.currentContent.backdrop || activeBroadcast.currentContent.poster}
          alt=""
          fill
          className="object-cover opacity-20 blur-[100px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 relative z-10 overflow-hidden">
        {/* Main Player Area */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl group/player bg-zinc-900">
            <NativePlayer
              src="" 
              type="tv"
              tmdbId={activeBroadcast.currentContent.id}
              poster={activeBroadcast.currentContent.poster ?? undefined}
              title={activeBroadcast.currentContent.title}
              subTitle={activeBroadcast.channel.name}
              initialTime={activeBroadcast.elapsed / 1000}
              onProgress={() => {}}
            />
            
            {/* Live Indicator */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1 bg-red-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              Live
            </div>
          </div>

          {/* Broadcast Details */}
          <div className="flex flex-col gap-4 px-4">
             <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                <Activity size={12} className="text-primary" />
                <span>Now Broadcasting</span>
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                {activeBroadcast.currentContent.title}
             </h1>
             <p className="text-zinc-400 text-lg max-w-2xl font-medium leading-relaxed">
                {activeBroadcast.currentContent.description}
             </p>
          </div>
        </div>

        {/* Channel Sidebar */}
        <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar pb-12">
          <div className="flex items-center justify-between px-2">
             <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Live Grid</span>
             <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">5 CHANNELS</span>
          </div>

          {broadcasts.map(b => (
            <button
              key={b.channel.id}
              onClick={() => setActiveChannelId(b.channel.id)}
              className={cn(
                "relative flex flex-col gap-3 p-4 rounded-2xl transition-all border text-left group",
                activeChannelId === b.channel.id 
                  ? "bg-white/10 border-white/20 shadow-xl" 
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between">
                                <motion.span
                  className="text-[10px] font-black uppercase tracking-widest"
                  initial={false}
                  animate={{ color: b.channel.color }}
                >
                  {b.channel.name}
                </motion.span>
                {activeChannelId === b.channel.id && (
                  <motion.div layoutId="playing" className="flex items-end gap-0.5 h-3">
                    <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-primary" />
                    <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-0.5 bg-primary" />
                    <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-0.5 bg-primary" />
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                  <OptimizedImage
                    src={b.currentContent.poster}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate">{b.currentContent.title}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-primary"
                         initial={false}
                         animate={{ width: `${(b.elapsed / b.duration) * 100}%` }}
                       />
                    </div>
                    <span className="text-[9px] font-medium text-zinc-500 whitespace-nowrap">
                       {Math.floor((b.duration - b.elapsed) / 60000)}m left
                    </span>
                  </div>
                </div>
              </div>

              {/* Up Next Preview */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                 <div className="flex items-center gap-2">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Up Next</span>
                 </div>
                 <span className="text-[9px] font-medium truncate max-w-[100px] text-right">
                    {b.nextContent.title}
                 </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
