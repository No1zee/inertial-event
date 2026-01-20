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
    content: Content[];
    logoPath?: string;
}

export function CinematicHero({ content, logoPath }: CinematicHeroProps) {
    const [index, setIndex] = useState(0);
    const item = content[index];
    
    const queryClient = useQueryClient();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const inWatchlist = item ? isInWatchlist(String(item.id)) : false;

    // Rotation Effect
    useEffect(() => {
        if (!content || content.length <= 1) return;
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % content.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [content]);

    const toggleWatchlist = () => {
        if (!item) return;
        if (inWatchlist) removeFromWatchlist(String(item.id));
        else addToWatchlist(item);
    };

    if (!item) return null;

    return (
        <section className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden group">
            {/* Background Layer */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        className="absolute inset-0"
                    >
                         <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20000ms] ease-linear group-hover:scale-105"
                            style={{ backgroundImage: `url(${item.backdrop || item.poster})` }}
                        />
                    </motion.div>
                </AnimatePresence>
                
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-32" />
            </div>

            {/* Content Content - Left Aligned "Billboard" */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-16 pt-20">
                <div className="max-w-2xl space-y-6 animate-in slide-in-from-left duration-1000 fade-in">
                    
                    {/* Logo Treatment */}
                    {logoPath ? (
                        <div className="h-24 md:h-32 w-auto flex items-center justify-start">
                             <img 
                                src={logoPath} 
                                alt={item.title} 
                                className="h-full w-auto object-contain drop-shadow-2xl"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const titleEl = document.getElementById('hero-title-fallback');
                                    if (titleEl) titleEl.style.display = 'block';
                                }}
                             />
                             <h1 id="hero-title-fallback" className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-2xl hidden">
                                {item.title}
                             </h1>
                        </div>
                    ) : (
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                            {item.title}
                        </h1>
                    )}

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
