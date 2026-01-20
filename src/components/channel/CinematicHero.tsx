"use client";

import { useEffect, useState } from "react";
import { Play, Info, Plus, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/UI/button";
import { Content } from "@/lib/types/content";
import { contentApi } from "@/lib/api/content";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchlistStore } from "@/lib/store/watchlistStore";

interface CinematicHeroProps {
    item: Content;
}

export function CinematicHero({ item }: CinematicHeroProps) {
    const queryClient = useQueryClient();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const inWatchlist = isInWatchlist(String(item.id));

    // Get color based on item? Or just use white/brand color.

    const toggleWatchlist = () => {
        if (inWatchlist) removeFromWatchlist(String(item.id));
        else addToWatchlist(item);
    };

    if (!item) return null;

    return (
        <section className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden group">
            {/* Background Layer */}
            <div className="absolute inset-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.backdrop || item.poster})` }}
                />
                
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-32" />
            </div>

            {/* Content Content - Left Aligned "Billboard" */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-16 pt-20">
                <div className="max-w-2xl space-y-6 animate-in slide-in-from-left duration-1000 fade-in">
                    
                    {/* Logo Treatment (If we had logo images, we'd use them here. For now, big text) */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                        {item.title}
                    </h1>

                    {/* Metadata Line */}
                    <div className="flex items-center gap-3 text-sm md:text-base font-semibold text-zinc-300">
                        <span className="text-green-400">{Math.round((item.rating || 0) * 10)}% Match</span>
                        <span>{item.releaseDate?.substring(0, 4)}</span>
                        {/* @ts-ignore: adult might be missing from interface but present in API */}
                        <span className="border border-white/30 px-1.5 rounded text-xs">{(item as any).adult ? '18+' : 'PG-13'}</span>
                        {item.type === 'tv' && <span>Series</span>}
                    </div>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-zinc-200 line-clamp-3 drop-shadow-lg max-w-xl font-medium">
                        {item.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4">
                        <Link 
                            href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}
                            onMouseEnter={() => {
                                const apiType = item.type === 'anime' ? 'tv' : item.type;
                                queryClient.prefetchQuery({
                                    queryKey: ['content', 'details', String(item.id), item.type],
                                    queryFn: () => contentApi.getDetails(item.id, apiType as 'movie' | 'tv'),
                                    staleTime: 10 * 60 * 1000
                                });
                            }}
                        >
                            <Button size="lg" className="h-12 md:h-14 px-8 text-lg font-bold bg-white text-black hover:bg-white/90 rounded-md transition-transform hover:scale-105 active:scale-95">
                                <Play size={24} fill="currentColor" className="mr-2" />
                                Play
                            </Button>
                        </Link>

                        <Button 
                            variant="secondary" 
                            size="lg" 
                            className="h-12 md:h-14 px-8 text-lg font-bold bg-white/20 text-white hover:bg-white/30 backdrop-blur-md rounded-md transition-transform hover:scale-105 active:scale-95 border-none"
                            onClick={toggleWatchlist}
                        >
                            {inWatchlist ? <Check size={24} className="mr-2" /> : <Plus size={24} className="mr-2" />}
                            My List
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
