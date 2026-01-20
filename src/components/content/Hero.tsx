"use client";

import { useEffect, useState } from "react";
import { Play, Info, Volume2, VolumeX, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/UI/button";
import { Content } from "@/lib/types/content";
import { contentApi } from "@/lib/api/content";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

interface HeroProps {
    items?: Content[];
}



export function Hero({ items = [] }: HeroProps) {
    const [index, setIndex] = useState(0);
    const [isCurrentSlidePlaying, setIsCurrentSlidePlaying] = useState(false);
    
    // Auto-advance carousel (Pause if video is playing)
    useEffect(() => {
        if (!items || items.length === 0 || isCurrentSlidePlaying) return;

        const timer = setTimeout(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, 12000);

        return () => clearTimeout(timer);
    }, [index, items ? items.length : 0, isCurrentSlidePlaying]);

    // Safety check
    if (!items || items.length === 0) return <HeroSkeleton />;

    const currentItem = items[index % items.length];

    return (
        <section
            className="relative h-[50vh] sm:h-[70vh] lg:h-[85vh] w-full group mx-auto overflow-hidden bg-black"
        >
            {/* FORCE REBUILD: Updated transition mode */}
            <AnimatePresence>
                <HeroSlide 
                    key={currentItem.id} 
                    item={currentItem} 
                    isActive={true}
                    onPlayStatusChange={setIsCurrentSlidePlaying}
                />
            </AnimatePresence>

            {/* Carousel Indicators - Keep outside to remain visible on top */}
            <div className="absolute right-4 sm:right-8 bottom-24 sm:bottom-48 flex flex-col gap-1.5 sm:gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                {items.map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIndex(i);
                        }}
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow shadow-black/50",
                            i === index ? "h-6 bg-white" : "bg-white/30 hover:bg-white/60"
                        )}
                    />
                ))}
            </div>
        </section>
    );
}

// Separate component to handle per-slide state (Video playback, fetching)
function HeroSlide({ item, isActive, onPlayStatusChange }: { item: Content, isActive: boolean, onPlayStatusChange: (playing: boolean) => void }) {
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [uiVisible, setUiVisible] = useState(true);
    const queryClient = useQueryClient();

    // Fetch trailer logic
    useEffect(() => {
        let isMounted = true;
        
        const fetchTrailer = async () => {
             // Delay to allow slide transition to finish before starting network requests
            await new Promise(r => setTimeout(r, 2000));
            if (!isMounted) return;

            // Disable trailers in Electron to avoid persistent playback errors (Error 152)
            // Trailers will still work on the web version.
            const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
            if (isElectron) {
                console.log("🚫 Trailers disabled in Electron");
                return;
            }

            // Try existing trailer key
            let key = item.trailer;

            // If not found, fetch from API
            if (!key) {
                key = await contentApi.getTrailer(item.id, item.type as 'movie' | 'tv');
            }
            
            if (!isMounted) return;

            if (key) {
                console.log("🎬 Trailer key acquired:", key);
                setTrailerKey(key);
                setShowTrailer(true);
                // AG: Optimistic loading - Assume video is ready after 1.5s
                // This ensures carousel pauses and video fades in even if onLoad request event is swallowed.
                setTimeout(() => setIframeLoaded(true), 1500);
            } else {
                console.log("⚠️ No trailer found for:", item.title);
            }
        };

        if (isActive) {
            fetchTrailer();
        }

        return () => {
            isMounted = false;
        };
    }, [item.id, isActive]);

    // Update parent about play status (Prevent rotation if we have a visible trailer)
    useEffect(() => {
        if (isActive) {
            onPlayStatusChange(iframeLoaded);
        }
    }, [iframeLoaded, isActive, onPlayStatusChange]);

    const handleInteraction = () => {
        if (!uiVisible) setUiVisible(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
        >
            {/* Background Image (Base Layer) */}
            <div className="absolute inset-0 bg-black">
                 {/* YouTube Iframe Layer - Pure HTML for robustness */}
                 {trailerKey && (
                     <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}>
                            <iframe
                                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&loop=1&playlist=${trailerKey}&modestbranding=1&fs=0`}
                                className="w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5] pointer-events-none"
                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                onLoad={() => {
                                    console.log("✅ Iframe Loaded for:", trailerKey);
                                    // Small delay to allow actual video buffer to start filling effectively
                                    setTimeout(() => setIframeLoaded(true), 1500);
                                }}
                                onError={(e) => console.error("❌ Iframe Error", e)}
                            />
                     </div>
                 )}

                {/* Image Layer (Fades out when video is ready) */}
                <motion.div
                    className="absolute inset-0 bg-cover bg-[center_20%] sm:bg-center transition-opacity duration-1000 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${item.backdrop || "/images/hero_placeholder.jpg"})`,
                        opacity: iframeLoaded ? 0 : 1 
                    }}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1 }}
                    transition={{ duration: 15, ease: "linear" }}
                />
                
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-100 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent opacity-100 z-10 pointer-events-none" />
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 z-20 p-6 pb-24 md:p-12 md:pb-32 lg:p-16 lg:pb-40 w-full max-w-4xl space-y-4 md:space-y-6 pointer-events-none">
                <AnimatePresence mode="wait">
                    {uiVisible && (
                        <motion.div
                            key="text-content"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-6 pointer-events-auto"
                        >
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                                <div className="h-1 w-12 bg-red-600 rounded-full" />
                                <span className="text-red-500 font-bold tracking-[0.3em] text-xs uppercase">Trending Now</span>
                            </div>

                            <motion.h1
                                className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl max-w-5xl"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                            >
                                {item.title}
                            </motion.h1>

                            <div className="flex items-center gap-3 text-sm md:text-base font-medium text-zinc-300">
                                <span className="flex items-center gap-1 text-green-400 font-bold">
                                    <Star size={14} fill="currentColor" />
                                    {Math.round((item.rating || 0) * 10)}% Match
                                </span>
                                <span>•</span>
                                <span>{item.releaseDate?.substring(0, 4)}</span>
                                <span>•</span>
                                <span className="uppercase tracking-widest text-xs border border-zinc-600 px-2 py-0.5 rounded text-zinc-400 bg-zinc-900/40">
                                    {item.type === 'tv' ? 'Series' : 'Movie'}
                                </span>
                            </div>

                            <motion.p
                                className="hidden sm:block text-zinc-100 text-base md:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-lg line-clamp-3 text-shadow-sm opacity-90"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                            >
                                {item.description}
                            </motion.p>

                            <motion.div
                                className="flex items-center gap-4 pt-8"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                            >
                                <Link 
                                    href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}
                                    onMouseEnter={() => {
                                         queryClient.prefetchQuery({
                                            queryKey: ['content', 'details', String(item.id), item.type],
                                            queryFn: () => contentApi.getDetails(item.id, (item.type === 'anime' ? 'tv' : item.type) as 'movie' | 'tv'),
                                            staleTime: 10 * 60 * 1000
                                        });
                                    }}
                                >
                                    <Button size="lg" className="pl-6 sm:pl-10 pr-8 sm:pr-12 h-12 sm:h-14 md:h-16 text-sm sm:text-lg md:text-xl font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-xl shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 duration-300">
                                        <Play size={20} fill="currentColor" className="sm:mr-3" />
                                        Watch Now
                                    </Button>
                                </Link>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 sm:h-14 md:h-16 px-6 sm:px-10 text-sm sm:text-lg md:text-xl font-medium bg-zinc-800/20 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/30 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-2xl"
                                >
                                    <Info size={20} className="sm:mr-3" />
                                    Details
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function HeroSkeleton() {
    return (
        <section className="relative h-[70vh] w-full rounded-2xl overflow-hidden mx-auto bg-zinc-900 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        </section>
    );
}
