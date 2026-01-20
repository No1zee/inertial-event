"use client";

import { useEffect, useState, useRef } from "react";
import { tvEngine, Channel, CurrentProgramStatus, Program } from "@/lib/services/tvEngine";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Calendar, Info, Tv } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";
import { useRouter } from "next/navigation";

export default function TVPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [scheduleMap, setScheduleMap] = useState<Record<string, Program[]>>({});
    const [now, setNow] = useState(Date.now());
    const [playingChannel, setPlayingChannel] = useState<string | null>(null);
    const [programStatus, setProgramStatus] = useState<Record<string, CurrentProgramStatus>>({});
    const { openModal } = useUIStore();
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

        // Tick every 30s to update progress bars
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 10000); 

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
                             <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
                                    <h2 className="text-3xl font-bold text-white drop-shadow-md">{activeStatus.currentProgram.content.title}</h2>
                                </div>
                                <p className="text-zinc-300 max-w-2xl line-clamp-2 md:line-clamp-1">{activeStatus.currentProgram.content.description}</p>
                             </div>
                             
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => router.push(`/watch?id=${activeStatus.currentProgram.content.id}&type=${activeStatus.currentProgram.content.type}`)}
                                    className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Play size={20} fill="currentColor" /> Watch Now
                                </button>
                                <button 
                                    onClick={() => openModal(activeStatus.currentProgram.content)}
                                    className="bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
                                >
                                    <Info size={20} />
                                </button>
                             </div>
                        </div>

                        {/* Progress */}
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-red-600 transition-all duration-1000 ease-linear"
                                style={{ width: `${(activeStatus.elapsedMs / activeStatus.currentProgram.durationMs) * 100}%` }}
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
                <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <Tv size={24} className="text-primary" />
                    <h2>Live Guide</h2>
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
                                className={`flex items-center p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 ${isPlaying ? 'bg-white/5' : ''}`}
                            >
                                {/* Channel Info */}
                                <div className="w-48 shrink-0 space-y-1">
                                    <div className="font-bold text-lg text-white">{ch.name}</div>
                                    <div className="text-xs text-muted-foreground">{ch.genre}</div>
                                </div>

                                {/* Current Program */}
                                <div className="flex-1 px-4 border-l border-white/5 flex flex-col justify-center min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                         <span className="font-semibold text-zinc-200 truncate">{status.currentProgram.content.title}</span>
                                         <span className="text-xs text-zinc-500 whitespace-nowrap">
                                            {new Date(status.currentProgram.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(status.currentProgram.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </span>
                                    </div>
                                    <div className="w-1/2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-zinc-500 rounded-full"
                                            style={{ width: `${Math.min(100, (status.elapsedMs / status.currentProgram.durationMs) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Up Next */}
                                <div className="w-1/3 shrink-0 px-4 border-l border-white/5 sm:block hidden text-sm text-zinc-500">
                                    <div className="uppercase text-[10px] font-bold mb-1">Up Next</div>
                                    <div className="truncate text-zinc-400">{status.nextProgram.content.title}</div>
                                    <div className="text-xs">{new Date(status.nextProgram.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                             </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
