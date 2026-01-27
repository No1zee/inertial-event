"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useContentStore } from '../../store/contentStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiment } from '@/components/providers/ExperimentProvider';
import { logExperimentEvent } from '@/lib/experiment';
import { cn } from '@/lib/utils';

interface HeroProps {
    items: any[];
}

export const Hero: React.FC<HeroProps> = ({ items }) => {
    const router = useRouter();
    const { addToLibrary, removeFromLibrary, isInLibrary } = useContentStore();
    const { getVariant } = useExperiment();
    const variant = getVariant('hero_layout');

    // Pick a random featured item on mount for "fresh rotation"
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerError, setTrailerError] = useState(false);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        if (items.length > 0) {
            setActiveIndex(Math.floor(Math.random() * items.length));
        }
    }, [items]);

    const content = useMemo(() => items[activeIndex] || {}, [items, activeIndex]);
    const isFavorited = isInLibrary(content.id || content._id);

    // Auto-play trailer after delay
    useEffect(() => {
        setTrailerError(false);
        setShowTrailer(false);
        const timer = setTimeout(() => {
            if (content.trailerUrl) setShowTrailer(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [content]);

    const handlePlay = () => {
        logExperimentEvent('hero_layout', variant as any, 'play_click');
        router.push(`/watch?id=${content.id || content._id}&type=${content.type || 'movie'}`);
    };

    if (!items.length) return null;

    return (
        <div className="relative w-full h-[85vh] min-h-[700px] overflow-hidden group/hero">
            {/* Background / Trailer Container */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={content.id || content._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-black"
                >
                    {showTrailer && content.trailerUrl && !trailerError ? (
                        <div className="relative w-full h-full scale-[1.35] overflow-hidden pointer-events-none">
                            <iframe
                                src={`${content.trailerUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${content.trailerUrl.split('/').pop()}`}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none border-none"
                                allow="autoplay"
                                onLoad={() => console.log('Trailer loaded')}
                                onError={() => setTrailerError(true)}
                            />
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            <motion.img
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 10, ease: "linear" }}
                                src={content.backdropUrl}
                                alt={content.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover/hero:scale-110"
                            />
                        </div>
                    )}

                    {/* Advanced Multi-Stage Gradients for "Premium" look */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                </motion.div>
            </AnimatePresence>

            {/* Content Info */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={`info-${content.id || content._id}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute bottom-[25%] left-10 lg:left-20 max-w-3xl space-y-8 z-10"
                >
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center space-x-4"
                    >
                        {variant === 'B' ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-purple-600/30 flex items-center gap-2 animate-pulse">
                                <Sparkles size={12} />
                                AI RECOMMENDED
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-red-600 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-red-600/20">
                                {content.type}
                            </span>
                        )}
                        <span className="text-neutral-300 font-bold tracking-widest text-sm">{content.year}</span>
                        <div className="flex items-center space-x-1">
                            <span className="text-yellow-500 font-black tracking-tighter">★ {content.rating || '8.4'}</span>
                            <span className="text-[10px] text-neutral-500 font-bold">/ 10</span>
                        </div>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] italic"
                    >
                        {content.title}
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-neutral-300 line-clamp-2 font-medium max-w-xl drop-shadow-md"
                    >
                        {content.description}
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center space-x-6 pt-6"
                    >
                        <button
                            onClick={handlePlay}
                            className={cn(
                                "flex items-center space-x-3 text-black px-10 py-5 rounded-2xl font-black transition-all active:scale-95 shadow-2xl group/play overflow-hidden relative",
                                variant === 'B' ? "bg-gradient-to-r from-white to-neutral-200" : "bg-white hover:bg-neutral-200"
                            )}
                        >
                            <div className="absolute inset-0 bg-neutral-200 translate-x-[-100%] group-hover/play:translate-x-0 transition-transform duration-300" />
                            {variant === 'B' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                            )}
                            <span className="relative z-10 flex items-center space-x-3">
                                <Play fill="currentColor" size={24} />
                                <span className="text-lg">STREAM NOW</span>
                            </span>
                        </button>

                        <button
                            className="flex items-center space-x-3 bg-neutral-900/60 backdrop-blur-xl text-white px-10 py-5 rounded-2xl font-black hover:bg-neutral-800 transition-all active:scale-95 border border-white/10 shadow-2xl"
                        >
                            <Info size={24} />
                            <span className="text-lg">DETAILS</span>
                        </button>

                        <button
                            onClick={() => isFavorited ? removeFromLibrary(content.id || content._id) : addToLibrary(content.id || content._id)}
                            className={`p-5 rounded-2xl transition-all border shadow-2xl ${isFavorited ? 'bg-red-600 border-red-500 text-white' : 'bg-neutral-900/60 backdrop-blur-xl border-white/10 text-white hover:bg-neutral-800'
                                }`}
                        >
                            {isFavorited ? <Check size={28} /> : <Plus size={28} />}
                        </button>

                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/watch?id=${content.id || content._id}&ref=user_share`;
                                if (navigator.share) {
                                    navigator.share({
                                        title: content.title,
                                        text: `I'm watching ${content.title} on NovaStream!`,
                                        url: url
                                    }).then(() => logExperimentEvent('viral_loop', 'A' as any, 'share_success'));
                                } else {
                                    navigator.clipboard.writeText(url);
                                    alert('Link copied to clipboard! Share it with friends.');
                                    logExperimentEvent('viral_loop', 'A' as any, 'copy_link');
                                }
                            }}
                            className="p-5 rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 text-white hover:bg-neutral-800 transition-all active:scale-95 shadow-2xl"
                            title="Share with friends"
                        >
                            <motion.div whileHover={{ rotate: 15 }}>
                                <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                            </motion.div>
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Mute/Unmute Overlay */}
            <div className="absolute bottom-20 right-10 z-20 flex items-center space-x-4">
                {showTrailer && (
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-all transform active:scale-90"
                    >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                )}

                {/* Visual indicator for rotating featured list if needed */}
                <div className="flex items-center space-x-2 bg-black/40 backdrop-blur p-2 rounded-full border border-white/5">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > activeIndex ? 1 : -1);
                                setActiveIndex(i);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-8 bg-white' : 'w-1.5 bg-neutral-600'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;
