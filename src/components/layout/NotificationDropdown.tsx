"use client";

import { useState, Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Bell, Loader2 } from "lucide-react";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useUIStore } from "@/lib/store/uiStore";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
    const { history } = useHistoryStore();
    const { openModal } = useUIStore();
    const [recs, setRecs] = useState<Content[]>([]);
    const [newEpisodes, setNewEpisodes] = useState<Content[]>([]);
    const [hotDrops, setHotDrops] = useState<Content[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch smart recommendations and new episode checks
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Hot Drops (High anticipation / engagement recently)
                const [hotMovies, hotTV] = await Promise.all([
                    contentApi.getDayOneDrops('movie'),
                    contentApi.getDayOneDrops('tv')
                ]);

                const isGlobalHit = (item: Content) => {
                    const asianLangs = ['ja', 'ko', 'zh', 'cn', 'th', 'vi', 'id'];
                    if (item.language && asianLangs.includes(item.language)) {
                        // "Big in America" threshold: Very high popularity or widespread acclaim
                        // Popularity > 1500 is typically top-tier anime/kdrama
                        // Using rating as proxy for vote_average since we don't track votes in Content type
                        return (item.popularity && item.popularity > 1500) || (item.rating > 8.0); 
                    }
                    return true;
                };

                // Combine and sort by rating/popularity to find the "buzz"
                const combinedHot = [...hotMovies, ...hotTV]
                    .filter(isGlobalHit)
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3);
                setHotDrops(combinedHot);

                // 2. New Episodes check (if history exists)
                if (history.length > 0) {
                     const watchedShows = history.filter(item => item.type === 'tv' || item.type === 'anime').slice(0, 10); 
                     
                     const newEpPromises = watchedShows.map(async (show) => {
                        const typeForApi = show.type === 'anime' ? 'tv' : show.type;
                        const freshDetails = await contentApi.getDetails(show.id, typeForApi);
                         if (!freshDetails || !freshDetails.lastAirDate || !show.lastWatched) return null;
                         
                         const lastAir = new Date(freshDetails.lastAirDate);
                         const lastWatched = new Date(show.lastWatched);
                         const isRecent = (new Date().getTime() - lastAir.getTime()) < (30 * 24 * 60 * 60 * 1000);
                         
                         // Strict check: if it aired AFTER we last watched it
                         if (lastAir > lastWatched && isRecent) {
                              return freshDetails;
                         }
                         return null;
                     });
     
                     const newEpResults = (await Promise.all(newEpPromises)).filter(Boolean) as Content[];
                     // Remove duplicates
                     setNewEpisodes(newEpResults.filter(ep => !combinedHot.find(h => h.id === ep.id)));

                    // 3. "Because You Watched"
                    const lastWatched = history[0];
                    if (lastWatched) {
                        const similar = await contentApi.getSimilar(lastWatched.id, lastWatched.type);
                        setRecs(similar
                            .filter(isGlobalHit) // Apply "Prudent" filter to recommendations too
                            .filter(s => !combinedHot.find(h => h.id === s.id))
                            .slice(0, 3));
                    }
                } else {
                    // Cold start recommendations if no history, just more hot drops or trending
                    const trending = await contentApi.getTrending();
                    setRecs(trending.slice(0, 3));
                }

            } catch (err) {
                console.error("Failed to fetch notifications", err);
            } finally {
                setLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            fetchData();
        }
    }, [history]);

    const hasUnread = recs.length > 0 || newEpisodes.length > 0 || hotDrops.length > 0;

    return (
        <Menu as="div" className="relative">
            <Menu.Button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-zinc-400 hover:text-white transition-colors relative outline-none"
            >
                <Bell size={20} />
                {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-80 md:w-96 bg-[#141414] border border-white/10 rounded-xl shadow-2xl py-2 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                             <div className="p-8 flex justify-center text-zinc-500"><Loader2 className="animate-spin" /></div>
                        ) : (!hasUnread) ? (
                            <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                                All caught up!
                            </div>
                        ) : (
                            <>
                                {/* New Episodes Section */}
                                {newEpisodes.length > 0 && (
                                    <>
                                        <div className="px-4 py-1.5 bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                            New Episodes
                                        </div>
                                        {newEpisodes.map((item) => (
                                            <NotificationItem key={`new-${item.id}`} item={item} label="New Episode" />
                                        ))}
                                    </>
                                )}

                                {/* Hot Drops Section */}
                                {hotDrops.length > 0 && (
                                    <>
                                        <div className="px-4 py-1.5 bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                            Trending 🔥
                                        </div>
                                        {hotDrops.map((item) => (
                                            <NotificationItem key={`hot-${item.id}`} item={item} label="Hot Drop" />
                                        ))}
                                    </>
                                )}

                                {/* Recommendations Section */}
                                {recs.length > 0 && (
                                    <>
                                        <div className="px-4 py-1.5 bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                            For You
                                        </div>
                                        {recs.map((item) => (
                                            <NotificationItem key={`rec-${item.id}`} item={item} label="Recommended" />
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

function NotificationItem({ item, label }: { item: Content, label: string }) {
    const { openModal } = useUIStore();
    
    // Determine badge color based on label
    const getBadgeStyle = (label: string) => {
        switch(label) {
            case "New Episode": return "text-blue-400 bg-blue-400/10";
            case "Hot Drop": return "text-orange-400 bg-orange-400/10";
            default: return "text-green-400 bg-green-400/10";
        }
    };
    
    return (
        <Menu.Item>
            {({ active }) => (
                <button 
                    onClick={() => {
                        openModal(item);
                    }}
                    className={cn(
                        "flex items-start gap-4 p-4 transition-colors border-b border-white/5 last:border-0 w-full text-left",
                        active ? "bg-white/5" : ""
                    )}
                >
                    <div className="relative w-16 h-24 shrink-0 rounded overflow-hidden shadow-lg group">
                        <img 
                            src={item.poster || "/images/placeholder.png"} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                         {label === "New Episode" && (
                            <div className="absolute top-0 right-0 p-1">
                                <span className="block h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,1)]" />
                            </div>
                        )}
                        {label === "Hot Drop" && (
                             <div className="absolute top-0 right-0 p-1">
                                <span className="block h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,1)]" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-zinc-200 truncate group-hover:text-white transition-colors">{item.title}</h4>
                         <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                             <span className={cn(
                                 "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                 getBadgeStyle(label)
                             )}>
                                 {label}
                             </span>
                             <span className="text-[10px] text-zinc-600">{item.releaseDate?.substring(0,4)}</span>
                        </div>
                    </div>
                </button>
            )}
        </Menu.Item>
    );
}
