"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/lib/types/content";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/lib/api/content";
import { useSeriesTrackingStore } from "@/lib/store/seriesTrackingStore";
import { useModalStore } from "@/lib/store/modalStore";
import { useHydrated } from "@/hooks/useHydrated";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface ContentCardProps {
    item: Content;
    aspectRatio?: "portrait" | "landscape" | "square";
    showDetails?: boolean;
    className?: string;
}

export function ContentCard({ item, aspectRatio = "portrait", className }: ContentCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const { openModal } = useModalStore();
    const isHydrated = useHydrated();
    const { trackedSeries, trackSeries, markAsSeen } = useSeriesTrackingStore();

    const inWatchlist = isInWatchlist(String(item.id));
    const contentType = item.type || ((item as any).seasonsList?.length > 0 ? 'tv' : 'movie');

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const toggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inWatchlist) {
            removeFromWatchlist(String(item.id));
        } else {
            addToWatchlist(item);
        }
    };

    const handleClick = () => {
        if (contentType === 'tv' || contentType === 'anime') {
            markAsSeen(String(item.id));
        }
        openModal(item);
    };

    const handleMouseEnter = () => {
        queryClient.prefetchQuery({
            queryKey: ['content', 'details', item.id, contentType],
            queryFn: () => {
                const apiType = contentType === 'anime' ? 'tv' : contentType;
                return contentApi.getDetails(item.id, apiType as 'movie' | 'tv');
            },
            staleTime: 10 * 60 * 1000
        });
        router.prefetch(`/watch?id=${item.id}&type=${contentType}`);
    };

    const getBadge = () => {
        if (!isHydrated) return null;
        const now = new Date();
        const tracked = trackedSeries[String(item.id)];
        
        // Priority 1: Tracking Store "New Episode"
        if (tracked?.hasNewEpisode) {
            return { label: 'New Episode', color: 'bg-primary animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.6)]' };
        }

        // Priority 2: TMDB Recent Air Date (fallback)
        // Only show if we're NOT tracking this series, OR if tracking says it's NOT seen yet (implicitly)
        // If we ARE tracking and hasNewEpisode is false, user has already acknowledged it.
        if (item.lastAirDate && !tracked) {
            const lastAir = new Date(item.lastAirDate);
            const diffDaysAir = (now.getTime() - lastAir.getTime()) / (1000 * 3600 * 24);
            if (diffDaysAir >= 0 && diffDaysAir < 7) {
                return { label: 'New Episode', color: 'bg-primary/90' };
            }
        }
        
        if (!item.releaseDate) return null;
        const release = new Date(item.releaseDate);
        const diffDays = (now.getTime() - release.getTime()) / (1000 * 3600 * 24);
        if (release > now) return { label: 'Coming Soon', color: 'bg-amber-500' };
        if (diffDays >= 0 && diffDays < 30) return { label: 'New', color: 'bg-primary' };
        return null;
    };
    const badge = getBadge();

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            tabIndex={0}
            className={cn(
                "relative rounded-2xl overflow-hidden bg-zinc-900/50 cursor-pointer group shrink-0 border border-white/10 outline-none transition-all duration-300 backdrop-blur-md",
                "hover:z-30 hover:border-white/20 cinematic-shadow",
                "focus:border-primary focus:ring-4 focus:ring-primary/20",
                aspectRatio === "portrait" && "aspect-[2/3] w-[160px] md:w-[200px]",
                aspectRatio === "landscape" && "aspect-video w-[280px] md:w-[350px]",
                aspectRatio === "square" && "aspect-square w-[160px] md:w-[200px]",
                className
            )}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); e.stopPropagation(); handleClick();
                }
            }}
        >
            <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ transform: "translateZ(0)" }}>
                <img
                    src={item.poster || "/images/placeholder.png"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                {badge && (
                    <div className={cn(
                        "absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-[0.15em] shadow-2xl",
                        badge.color
                    )}>
                        {badge.label}
                    </div>
                )}
            </div>

            <div 
                className="absolute inset-x-4 bottom-4 z-20 flex flex-col space-y-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                style={{ transform: "translateZ(40px)" }}
            >
                <div className="flex gap-2">
                    <button
                        className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-neutral-200 shadow-2xl active:scale-95 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            const contentType = item.type || ((item as any).seasonsList?.length > 0 ? 'tv' : 'movie');
                            
                            // Track series for future episode updates
                            if (contentType === 'tv' || contentType === 'anime') {
                                markAsSeen(String(item.id));
                                const tracked = trackedSeries[String(item.id)];
                                if (tracked) {
                                    router.push(`/watch?id=${item.id}&type=${contentType}&season=${tracked.lastWatchedSeason}&episode=${tracked.lastWatchedEpisode}`);
                                } else {
                                    trackSeries(item, 1, 1);
                                    router.push(`/watch?id=${item.id}&type=${contentType}&season=1&episode=1`);
                                }
                            } else {
                                router.push(`/watch?id=${item.id}&type=${contentType}`);
                            }
                        }}
                    >
                        <Play size={18} fill="currentColor" />
                    </button>
                    <button
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center glass-card border-none shadow-2xl active:scale-95 transition-all text-white",
                            inWatchlist ? "bg-primary" : "bg-black/40"
                        )}
                        onClick={toggleWatchlist}
                    >
                        {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                </div>

                <div className="space-y-1">
                    <h3 className="font-black text-white text-sm md:text-base leading-tight drop-shadow-2xl">
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                        <span className="text-primary font-black">{Math.min(Math.round((item.rating || 0) * 10), 100)}% MATCH</span>
                        <span className="opacity-30">•</span>
                        <span>{item.releaseDate?.substring(0, 4) || "N/A"}</span>
                    </div>
                </div>
            </div>

            {item.progress && item.duration && (item.duration > 0 || item.progress > 0) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                    <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(225,29,72,1)]"
                        style={{ width: `${Math.min((item.progress / (item.duration || item.progress * 1.1)) * 100, 100)}%` }}
                    />
                </div>
            )}
        </motion.div>
    );
}
