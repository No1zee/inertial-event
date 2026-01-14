"use client";

import { useEffect, useState } from "react";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/UI/button";
import { Content } from "@/lib/types/content";
import { contentApi } from "@/lib/api/content";
import { motion, AnimatePresence } from "framer-motion";

interface HeroProps {
    items?: Content[];
}

export function Hero({ items = [] }: HeroProps) {
    const [index, setIndex] = useState(0);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [showVideo, setShowVideo] = useState(false);

    const currentItem = items && items.length > 0 ? items[index % items.length] : null;

    // Auto-advance carousel
    useEffect(() => {
        if (!items || items.length === 0) return;

        // Dynamic Duration: 12s default, extended to 90s if trailer is playing (~3/5 of avg trailer)
        const duration = trailerKey ? 90000 : 12000;

        const timer = setTimeout(() => {
            setIndex((prev) => (prev + 1) % items.length);
            setShowVideo(false);
            setTrailerKey(null);
        }, duration);

        return () => clearTimeout(timer);
    }, [index, trailerKey, items.length]);

    // Fetch trailer when slide changes
    useEffect(() => {
        if (!currentItem) return;

        let mounted = true;
        const fetchTrailer = async () => {
            // Delay slightly to let animation finish and user to settle
            await new Promise(r => setTimeout(r, 1000));
            if (!mounted) return;

            // Only fetch for movies for now? or TV too if API supports
            const safeId = String(currentItem.id);
            const key = await contentApi.getTrailer(safeId, currentItem.type);
            if (mounted && key) {
                setTrailerKey(key);
                // Delay showing video slightly to allow buffering
                setTimeout(() => {
                    if (mounted) setShowVideo(true);
                }, 1500);
            }
        };
        fetchTrailer();
        return () => { mounted = false; };
    }, [currentItem?.id, currentItem?.type]);

    // Safety check: if no items, show a basic skeleton
    if (!currentItem) return <HeroSkeleton />;

    return (
        <section className="relative h-[75vh] w-full group mx-auto overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Image (Base Layer) */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${currentItem.backdrop || "/images/hero_placeholder.jpg"})` }}
                    >
                        {/* Gradients for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
                    </div>

                    {/* YouTube Video Layer (Fade In) */}
                    {showVideo && trailerKey && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
                        >
                            <iframe
                                className="w-[300%] h-[300%] -ml-[100%] -mt-[40%] opacity-60"
                                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}`}
                                allow="autoplay; encrypted-media"
                                title="Background Trailer"
                            />
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 z-20 p-8 lg:p-16 w-full max-w-4xl space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentItem.id + "-text"}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-4"
                    >
                        <span className="inline-flex items-center px-3 py-1 bg-red-600/90 backdrop-blur text-white text-xs font-bold rounded uppercase tracking-wider shadow-lg">
                            Trending Now
                        </span>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-tight drop-shadow-2xl">
                            {currentItem.title}
                        </h1>

                        <p className="text-zinc-200 text-lg md:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-md line-clamp-3">
                            {currentItem.description}
                        </p>

                        <div className="flex items-center gap-4 pt-4">
                            <Link href={`/watch/${String(currentItem.id).replace('tmdb_', '')}?type=${currentItem.type}`}>
                                <Button size="lg" className="pl-6 pr-8 h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200 transition-all rounded-lg shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-105 active:scale-95">
                                    <Play size={24} fill="currentColor" className="mr-3" />
                                    Play Now
                                </Button>
                            </Link>

                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 text-lg font-medium bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white rounded-lg hover:scale-105 transition-all"
                            >
                                <Info size={24} className="mr-3" />
                                More Info
                            </Button>

                            {trailerKey && showVideo && (
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="h-14 w-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur border border-white/10 hover:bg-white/10 transition-all ml-auto md:ml-0"
                                >
                                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute right-8 bottom-48 flex flex-col gap-2 z-30">
                {items.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
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

function HeroSkeleton() {
    return (
        <section className="relative h-[70vh] w-full rounded-2xl overflow-hidden mx-auto bg-zinc-900 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        </section>
    );
}
