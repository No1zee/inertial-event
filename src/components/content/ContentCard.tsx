"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/lib/types/content";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/lib/api/content";

interface ContentCardProps {
    item: Content;
    aspectRatio?: "portrait" | "landscape" | "square";
    showDetails?: boolean;
    className?: string;
}

import { useModalStore } from "@/lib/store/modalStore";

// ...

export function ContentCard({ item, aspectRatio = "portrait", className }: ContentCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isPortrait = aspectRatio === "portrait";
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const { openModal } = useModalStore();

    const inWatchlist = isInWatchlist(String(item.id));
    const contentType = item.type || ((item as any).seasonsList?.length > 0 ? 'tv' : 'movie');

    const toggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inWatchlist) {
            removeFromWatchlist(String(item.id));
        } else {
            addToWatchlist(item);
        }
    };

    const handleClick = () => {
        openModal(item);
    };

    const handleMouseEnter = () => {
        // Prefetch content details data
        queryClient.prefetchQuery({
            queryKey: ['content', 'details', item.id, contentType],
            queryFn: () => {
                const apiType = contentType === 'anime' ? 'tv' : contentType;
                return contentApi.getDetails(item.id, apiType as 'movie' | 'tv');
            },
            staleTime: 10 * 60 * 1000 // Match the staleTime in useContentDetails
        });
        
        // Prefetch the route
        router.prefetch(`/watch?id=${item.id}&type=${contentType}`);
    };

    // Badge Logic
    const getBadge = () => {
        if (!item.releaseDate) return null;
        const release = new Date(item.releaseDate);
        const now = new Date();
        const diffDays = (now.getTime() - release.getTime()) / (1000 * 3600 * 24);

        if (release > now) return { label: 'Coming Soon', color: 'bg-amber-500/90' };
        if (diffDays >= 0 && diffDays < 30) return { label: 'New', color: 'bg-red-600/90' };
        return null;
    };
    const badge = getBadge();

    return (
        <div
            tabIndex={0}
            className={cn(
                "relative rounded-xl overflow-hidden bg-zinc-900 cursor-pointer group shrink-0 border border-white/5 outline-none",
                "hover:border-red-600/50 focus:border-red-600",
                "hover:border-red-600/50 focus:border-red-600",
                aspectRatio === "portrait" && "aspect-[2/3] w-[160px] md:w-[200px]",
                aspectRatio === "landscape" && "aspect-video w-[280px] md:w-[350px]",
                aspectRatio === "square" && "aspect-square w-[160px] md:w-[200px]",
                className
            )}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    // Prevent any parent handlers or default d-pad 'center' behaviors
                    e.preventDefault();
                    e.stopPropagation();
                    handleClick();
                }
            }}
        >
            {/* Poster Image */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                    src={item.poster || "/images/placeholder.png"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        console.error("Image Failed:", item.poster);
                        const el = document.getElementById('ag-debug-log');
                        if (el) el.innerHTML += `<div style="color:orange; border-bottom:1px solid #333">IMG FAIL: ${item.poster?.substring(0, 30)}...</div>`;
                        e.currentTarget.style.display = 'none'; // Hide broken image
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90" />

                {/* Badge Overlay */}
                {badge && (
                    <div className={cn(
                        "absolute top-2 left-2 z-20 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-md",
                        badge.color
                    )}>
                        {badge.label}
                    </div>
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 group-focus:opacity-100">
                <div className="space-y-2">
                    {/* Play/Add Buttons */}
                    <div className="flex gap-2 pb-2">
                        <button
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 shadow-xl"
                            aria-label="Play Now"
                            onClick={(e) => {
                                e.stopPropagation();
                                const contentType = item.type || ((item as any).seasonsList?.length > 0 ? 'tv' : 'movie');
                                router.push(`/watch?id=${item.id}&type=${contentType}`);
                            }}
                        >
                            <Play size={20} fill="currentColor" className="ml-0.5" />
                        </button>

                        <button
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border border-white/10",
                                inWatchlist
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-black/40 text-white hover:bg-white/20"
                            )}
                            aria-label={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                            onClick={toggleWatchlist}
                        >
                            {inWatchlist ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                    </div>

                    {/* Text Metadata */}
                    <div>
                        <h3 className="font-bold text-white text-base leading-tight line-clamp-2 drop-shadow-md">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs font-medium text-zinc-300">
                            <span className="text-green-400 font-bold">{Math.min(Math.round((item.rating || 0) * 10), 100)}% Match</span>
                            <span>•</span>
                            <span>{item.releaseDate?.substring(0, 4) || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {
                item.progress && item.duration && (item.duration > 0 || item.progress > 0) && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-20 rounded-b-xl overflow-hidden">
                        <div
                            className="h-full bg-red-600"
                            style={{ width: `${Math.min((item.progress / (item.duration || item.progress * 1.1)) * 100, 100)}%` }}
                        />
                    </div>
                )
            }
        </div>
    );
}
