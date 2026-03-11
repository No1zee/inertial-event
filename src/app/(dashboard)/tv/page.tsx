"use client";

import { useEffect, useState, useRef } from "react";
import { tvEngine, Channel, CurrentProgramStatus, Program } from "@/lib/services/tvEngine";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Calendar, Info, Tv } from "lucide-react";
import { useModalStore } from "@/lib/store/modalStore";
import { useRouter } from "next/navigation";

export default function TVPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [scheduleMap, setScheduleMap] = useState<Record<string, Program[]>>({});
    const [now, setNow] = useState(Date.now());
    const [currentTime, setCurrentTime] = useState("");
    const [playingChannel, setPlayingChannel] = useState<string | null>(null);
    const [programStatus, setProgramStatus] = useState<Record<string, CurrentProgramStatus>>({});
    const { openModal } = useModalStore();
    const router = useRouter();

    // 1. Init Channels
    useEffect(() => {
        setChannels(tvEngine.getChannels());
    }, []);

    // 2. Fetch Schedules & Update "Now"
    useEffect(() => {
        if (channels.length === 0) return;

        const initSchedules = async () => {
            const map: Record<string, Program[]> = {};
            for (const ch of channels) {
                map[ch.id] = await tvEngine.getChannelSchedule(ch.id);
            }
            setScheduleMap(map);
            // Selecting first channel as default "playing" if none selected
            if (!playingChannel) setPlayingChannel(channels[0].id);
        };

        initSchedules();

        // Tick every 10s to update progress bars and clock
        const interval = setInterval(() => {
            const time = Date.now();
            setNow(time);
            setCurrentTime(new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 10000); 
        
        // Initial time
        setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        return () => clearInterval(interval);
    }, [channels]);

    // 3. Calculate Current Programs
    useEffect(() => {
        const updateStatus = async () => {
            const status: Record<string, CurrentProgramStatus> = {};
            for (const ch of channels) {
                const s = await tvEngine.getCurrentProgram(ch.id);
                if (s) status[ch.id] = s;
            }
            setProgramStatus(status);
        };
        updateStatus();
    }, [now, scheduleMap]);

    if(channels.length === 0) return null;

    const activeStatus = playingChannel ? programStatus[playingChannel] : null;

    return (
        <div className="min-h-screen bg-background pb-20 pt-20 px-4 md:px-8 space-y-8">
            
            {/* TV Header / Player Placeholder */}
            {playingChannel && activeStatus ? (
                <div className="relative w-full aspect-video md:aspect-[2.4/1] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                   <div className="absolute inset-0">
                        {/* Fake "Live" Stream using Helper Image */}
                        <img 
                            src={`https://image.tmdb.org/t/p/original${activeStatus.currentProgram.content.backdrop || activeStatus.currentProgram.content.poster}`} 
                            className="w-full h-full object-cover opacity-80"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                   </div>

                   <div className="absolute bottom-0 left-0 p-8 space-y-4 w-full">
                        <div className="flex items-center justify-between">
                             <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                         <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-tighter animate-pulse">LIVE</span>
                                         <span className="text-zinc-400 font-bold text-xs tracking-widest uppercase">{channels.find(c => c.id === playingChannel)?.name}</span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-md tracking-tight">{activeStatus.currentProgram.content.title}</h2>
                                </div>
                                <p className="text-zinc-300 max-w-2xl line-clamp-2 text-lg font-medium opacity-90 leading-snug">{activeStatus.currentProgram.content.description}</p>
                             </div>
                             
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => router.push(`/watch?id=${String(activeStatus.currentProgram.content.id).replace('tmdb_', '')}&type=${activeStatus.currentProgram.content.type}`)}
                                    className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl hover:shadow-white/10"
                                >
                                    <Play size={24} fill="currentColor" /> Watch Now
                                </button>
                                <button 
                                    onClick={() => openModal(activeStatus.currentProgram.content)}
                                    className="bg-white/10 backdrop-blur-md text-white px-5 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/5"
                                >
                                    <Info size={24} />
                                </button>
                             </div>
                        </div>

                        {/* Progress */}
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                             <div 
                                className="h-full bg-red-600 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                style={{ 
                                    width: `${(activeStatus.elapsedMs / activeStatus.currentProgram.durationMs) * 100}%`,
                                    backgroundColor: channels.find(c => c.id === playingChannel)?.branding?.color || '#dc2626'
                                }}
                             />
                        </div>
                   </div>
                </div>
            ) : (
                <div className="w-full aspect-[2.4/1] bg-card rounded-2xl flex items-center justify-center animate-pulse">
                    <div className="text-muted-foreground">Tuning in...</div>
                </div>
            )}

            {/* EPG Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                        <Tv size={24} className="text-primary" />
                        <h2>Live Guide</h2>
                    </div>
                    <div className="text-2xl font-black text-white/40 tracking-tighter family-mono">
                        {currentTime}
                    </div>
                </div>

                <div className="bg-card/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                    {channels.map(ch => {
                        const status = programStatus[ch.id];
                        if (!status) return null;
                        
                        const isPlaying = playingChannel === ch.id;

                        return (
                              <div 
                                key={ch.id} 
                                onClick={() => setPlayingChannel(ch.id)}
                                className={`flex items-center p-5 hover:bg-white/5 transition-all cursor-pointer border-b border-white/5 last:border-0 relative overflow-hidden group/item ${isPlaying ? 'bg-white/5' : ''}`}
                            >
                                {isPlaying && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ backgroundColor: ch.branding?.color || '#ffffff' }} />
                                )}

                                {/* Channel Info */}
                                <div className="w-56 shrink-0 flex items-center gap-4">
                                    <div 
                                        className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover/item:scale-110"
                                        style={{ 
                                            backgroundColor: ch.branding?.color || '#333',
                                            color: ch.branding?.theme === 'light' ? '#000' : '#fff'
                                        }}
                                    >
                                        {ch.name.substring(0, 1)}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="font-black text-lg text-white tracking-tight uppercase">{ch.name}</div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{ch.genre}</div>
                                    </div>
                                </div>

                                {/* Current Program */}
                                <div className="flex-1 px-6 border-l border-white/5 flex flex-col justify-center min-w-0">
                                    <div className="flex justify-between items-end mb-2">
                                         <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Now Playing</span>
                                            <span className={`font-bold text-xl truncate transition-colors ${isPlaying ? 'text-white' : 'text-zinc-300'}`}>{status.currentProgram.content.title}</span>
                                         </div>
                                         <span className="text-xs font-mono text-zinc-500 bg-black/30 px-2 py-1 rounded">
                                            {new Date(status.currentProgram.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(status.currentProgram.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </span>
                                    </div>
                                    <div className="w-full h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ 
                                                width: `${Math.min(100, (status.elapsedMs / status.currentProgram.durationMs) * 100)}%`,
                                                backgroundColor: ch.branding?.color || '#555'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Up Next */}
                                <div className="w-64 shrink-0 px-6 border-l border-white/5 lg:block hidden">
                                    <div className="uppercase text-[9px] font-black text-zinc-600 mb-1 tracking-[0.2em]">Up Next</div>
                                    <div className="truncate text-zinc-400 font-bold">{status.nextProgram.content.title}</div>
                                    <div className="text-xs font-medium text-zinc-500 mt-0.5">Starts at {new Date(status.nextProgram.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                             </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
