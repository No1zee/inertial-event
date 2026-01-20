"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX } from 'lucide-react';
import { useContentStore } from '../../store/contentStore';
import { useRouter } from 'next/navigation';

interface HeroProps {
    items: any[];
}

export const Hero: React.FC<HeroProps> = ({ items }) => {
    const router = useRouter();
    const { addToLibrary, removeFromLibrary, isInLibrary } = useContentStore();

    // Pick a random featured item on mount for "fresh rotation"
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerError, setTrailerError] = useState(false);

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
        router.push(`/watch?id=${content.id || content._id}&type=${content.type || 'movie'}`);
    };

    if (!items.length) return null;

    return (
        <div className="relative w-full h-[85vh] min-h-[700px] overflow-hidden group/hero">
            {/* Background / Trailer Container */}
            <div className="absolute inset-0 bg-black">
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
                        <img
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
            </div>

            {/* Content Info */}
            <div className="absolute bottom-[25%] left-10 lg:left-20 max-w-3xl space-y-8 z-10">
                <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-left duration-700">
                    <span className="px-3 py-1 bg-red-600 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-red-600/20">
                        {content.type}
                    </span>
                    <span className="text-neutral-300 font-bold tracking-widest text-sm">{content.year}</span>
                    <div className="flex items-center space-x-1">
                        <span className="text-yellow-500 font-black tracking-tighter">★ {content.rating || '8.4'}</span>
                        <span className="text-[10px] text-neutral-500 font-bold">/ 10</span>
                    </div>
                </div>

                <h1 className="text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left duration-1000 delay-100 italic">
                    {content.title}
                </h1>

                <p className="text-xl text-neutral-300 line-clamp-2 font-medium max-w-xl drop-shadow-md animate-in fade-in slide-in-from-left duration-1000 delay-200">
                    {content.description}
                </p>

                <div className="flex items-center space-x-6 pt-6 animate-in fade-in slide-in-from-left duration-1000 delay-300">
                    <button
                        onClick={handlePlay}
                        className="flex items-center space-x-3 bg-white text-black px-10 py-5 rounded-2xl font-black hover:bg-neutral-200 transition-all active:scale-95 shadow-2xl group/play overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-neutral-200 translate-x-[-100%] group-hover/play:translate-x-0 transition-transform duration-300" />
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
                </div>
            </div>

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
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-8 bg-white' : 'w-1.5 bg-neutral-600'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;
