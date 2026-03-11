"use client";

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useModalStore } from '@/lib/store/modalStore';
import { Play, Plus, Check, X, Star, Clock, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useRouter } from 'next/navigation';
import { useWatchlistStore } from '@/lib/store/watchlistStore';
import { cn } from '@/lib/utils';
import { contentApi } from '@/lib/api/content';
import { useSeriesTrackingStore } from '@/lib/store/seriesTrackingStore';
import { useHistoryStore } from '@/lib/store/historyStore';
import { useHydrated } from '@/hooks/useHydrated';

export default function ContentModal() {
    const { isOpen, content, closeModal } = useModalStore();
    const router = useRouter();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const [detailedContent, setDetailedContent] = useState<any>(null);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
    
    const isHydrated = useHydrated();
    const { trackedSeries } = useSeriesTrackingStore();
    const { history } = useHistoryStore();

    const inWatchlist = content ? isInWatchlist(String(content.id)) : false;

    // Reset and Fetch
    useEffect(() => {
        if (isHydrated && isOpen && content) {
            setDetailedContent(content); 
            
            const type = content.type || ((content as any).seasonsList?.length > 0 ? 'tv' : 'movie');
            const apiType = type === 'anime' ? 'tv' : type;

            contentApi.getDetails(content.id, apiType as 'movie' | 'tv').then(details => {
                 if (details) {
                    setDetailedContent(details);
                    if (details.seasonsList && details.seasonsList.length > 0) {
                        const tracked = trackedSeries[String(content.id)];
                        if (tracked) {
                            setSelectedSeason(tracked.lastWatchedSeason);
                        } else {
                            setSelectedSeason(details.seasonsList[0].season_number);
                        }
                    }
                 }
            });
        }
    }, [isOpen, content]);

    // Episodes fetch
    useEffect(() => {
        if (isOpen && content && (content.type === 'tv' || content.type === 'anime')) {
            setIsLoadingEpisodes(true);
            contentApi.getSeasonDetails(content.id, selectedSeason).then(data => {
                if (data && data.episodes) {
                    setEpisodes(data.episodes);
                }
                setIsLoadingEpisodes(false);
            });
        }
    }, [isOpen, content, selectedSeason]);

    if (!isHydrated || !content) return null;

    const handlePlay = () => {
        closeModal();
        const type = content.type || ((content as any).seasonsList?.length > 0 ? 'tv' : 'movie');
        const tracked = trackedSeries[String(content.id)];
        if (tracked) {
            router.push(`/watch?id=${content.id}&type=${type}&season=${tracked.lastWatchedSeason}&episode=${tracked.lastWatchedEpisode}`);
        } else {
            router.push(`/watch?id=${content.id}&type=${type}`);
        }
    };

    const toggleWatchlist = () => {
        if (inWatchlist) {
            removeFromWatchlist(String(content.id));
        } else {
            addToWatchlist(content);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={closeModal} className="relative z-50">
                {/* Backdrop with darker tint and blur */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto w-screen p-0 sm:p-4 md:p-12 lg:p-20 flex items-start justify-center pt-8">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-400"
                        enterFrom="opacity-0 translate-y-24 scale-[0.9]"
                        enterTo="opacity-100 translate-y-0 scale-100"
                        leave="ease-in duration-300"
                        leaveFrom="opacity-100 translate-y-0 scale-100"
                        leaveTo="opacity-0 translate-y-24 scale-[0.9]"
                    >
                        <Dialog.Panel className="w-full max-w-6xl bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative">
                            {/* Close Button - More subtle */}
                            <button 
                                onClick={closeModal}
                                className="absolute top-6 right-6 z-[60] p-2.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-white/70 hover:text-white transition-all ring-1 ring-white/10"
                            >
                                <X size={20} />
                            </button>

                            {/* Hero Image Section */}
                            <div className="relative aspect-[21/9] w-full group">
                                <img 
                                    src={content.backdrop || content.poster} 
                                    alt={content.title}
                                    className="w-full h-full object-cover brightness-[0.85]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
                                
                                <div className="absolute bottom-0 left-0 p-8 sm:p-14 w-full">
                                    <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 drop-shadow-2xl tracking-tight max-w-3xl">
                                        {content.title}
                                    </h2>

                                    <div className="flex items-center gap-6">
                                        <Button 
                                            size="lg" 
                                            onClick={handlePlay}
                                            className="bg-white text-black hover:bg-zinc-200 font-bold px-10 h-14 text-xl rounded-xl shadow-2xl transition-all"
                                        >
                                            <Play size={24} fill="currentColor" className="mr-3" />
                                            Play
                                        </Button>

                                        <button
                                            onClick={toggleWatchlist}
                                            className="w-14 h-14 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition-all bg-black/40 backdrop-blur-xl"
                                        >
                                            {inWatchlist ? <Check size={28} /> : <Plus size={28} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Info */}
                            <div className="px-8 sm:px-14 py-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                                <div className="lg:col-span-3 space-y-10">
                                    <div className="flex items-center gap-5 text-zinc-400 font-medium">
                                        <span className="text-emerald-400 font-bold tracking-tight">
                                            {Math.round((content.rating || 0) * 10)}% Recommended
                                        </span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span>{content.releaseDate?.substring(0, 4)}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span className="border border-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-zinc-300">
                                            {content.type === 'tv' ? 'Series' : 'Movie'}
                                        </span>
                                        {detailedContent?.duration && (
                                            <>
                                                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                <span className="flex items-center gap-1.5"><Clock size={14} /> {detailedContent.duration}m</span>
                                            </>
                                        )}
                                    </div>

                                    <p className="text-xl text-zinc-300 leading-relaxed font-light max-w-4xl">
                                        {content.description || "No description available."}
                                    </p>

                                    {detailedContent?.cast && detailedContent.cast.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-zinc-500 text-xs uppercase font-black tracking-[0.2em]">Starring</h4>
                                            <div className="flex flex-wrap gap-2.5">
                                                {detailedContent.cast.slice(0, 6).map((c: any) => (
                                                    <div key={c.id} className="text-zinc-300 text-sm bg-zinc-900/80 border border-white/5 px-4 py-1.5 rounded-full">
                                                        {c.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-12">
                                    <div>
                                        <h4 className="text-zinc-500 text-xs uppercase font-black tracking-[0.2em] mb-4">Genres</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {content.genres?.map((g: string) => (
                                                <span key={g} className="text-xs text-zinc-400 border border-white/10 px-3 py-1 rounded-md bg-white/5">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-zinc-500 text-xs uppercase font-black tracking-[0.2em]">Details</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-1 border-b border-white/5">
                                                <span className="text-zinc-500">Language</span>
                                                <span className="text-zinc-300">English</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-white/5">
                                                <span className="text-zinc-500">Status</span>
                                                <span className="text-emerald-500 font-medium capitalize">{content.status || 'Released'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Episode List Section */}
                            {(content.type === 'tv' || content.type === 'anime') && detailedContent?.seasonsList && (
                                <div className="px-8 sm:px-14 pb-20 pt-16 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-12">
                                        <div>
                                            <h3 className="text-3xl font-black text-white tracking-tight mb-2">Episodes</h3>
                                            <p className="text-zinc-500 text-sm font-medium">Standard Release • Atmos Audio</p>
                                        </div>

                                        <div className="relative group">
                                            <select 
                                                value={selectedSeason}
                                                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                                className="bg-zinc-900 text-white pl-6 pr-12 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-zinc-600 appearance-none cursor-pointer hover:bg-zinc-800 transition-all font-bold min-w-[160px]"
                                            >
                                                {detailedContent.seasonsList.map((s: any) => (
                                                    <option key={s.id} value={s.season_number}>
                                                        {s.name || `Season ${s.season_number}`}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-white transition-colors" size={20} />
                                        </div>
                                    </div>

                                    {isLoadingEpisodes ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                                            <Loader2 className="animate-spin text-zinc-600" size={48} />
                                            <span className="text-zinc-500 text-sm font-medium animate-pulse">Fetching episodes...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {episodes.map((ep: any) => {
                                                const airDate = ep.air_date ? new Date(ep.air_date) : null;
                                                const isAired = airDate ? airDate <= new Date() : true;
                                                const historyItem = history.find(h => h.id === String(content.id) && h.season === selectedSeason && h.episode === ep.episode_number);
                                                const progressPercent = historyItem?.progress && historyItem?.duration ? (historyItem.progress / historyItem.duration) * 100 : 0;

                                                return (
                                                    <div 
                                                        key={ep.id}
                                                        className={cn(
                                                            "group/ep flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl transition-all border border-transparent hover:border-white/5 active:scale-[0.98]",
                                                            isAired ? "hover:bg-white/5 cursor-pointer" : "opacity-40 cursor-not-allowed grayscale-[0.5]"
                                                        )}
                                                        onClick={() => {
                                                            if (!isAired) return;
                                                            closeModal();
                                                            router.push(`/watch?id=${content.id}&type=${content.type}&season=${selectedSeason}&episode=${ep.episode_number}`);
                                                        }}
                                                    >
                                                        <div className="text-xl font-bold text-zinc-600 w-8 text-center group-hover/ep:text-zinc-300">
                                                            {ep.episode_number}
                                                        </div>
                                                        
                                                        <div className="relative aspect-video w-full sm:w-64 shrink-0 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                                            <img 
                                                                src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : content.backdrop} 
                                                                alt={ep.name}
                                                                className="w-full h-full object-cover group-hover/ep:scale-110 transition-transform duration-700"
                                                            />
                                                            {isAired && (
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/ep:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl transition-transform group-hover/ep:scale-110">
                                                                        <Play size={24} fill="white" className="ml-1" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {!isAired && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/60">Coming {ep.air_date}</span>
                                                                </div>
                                                            )}

                                                            {progressPercent > 0 && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                                                    <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                                                                </div>
                                                            )}

                                                            {ep.runtime && (
                                                                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-black text-white backdrop-blur-md border border-white/5">
                                                                    {ep.runtime}m
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0 py-1">
                                                            <h4 className={cn(
                                                                "font-bold text-xl mb-3 transition-colors",
                                                                isAired ? "text-white group-hover/ep:text-zinc-300" : "text-zinc-500"
                                                            )}>
                                                                {ep.name}
                                                            </h4>
                                                            <p className="text-zinc-400 text-sm line-clamp-2 sm:line-clamp-3 font-light leading-relaxed">
                                                                {ep.overview || "No description available for this episode."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
