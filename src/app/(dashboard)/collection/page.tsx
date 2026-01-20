"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";
import { motion } from "framer-motion";
import { Play, Calendar, Star, Check } from "lucide-react";
import { useWatchlistStore } from "@/lib/store/watchlistStore";

interface CollectionData {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    parts: Content[];
}

function UniverseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const { isInWatchlist } = useWatchlistStore();

    useEffect(() => {
        if (!id) return;
        
        const fetchCollection = async () => {
            setLoading(true);
            try {
                const data = await contentApi.getCollectionDetails(String(id));
                setCollection(data);
            } catch (error) {
                console.error("Failed to load universe", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!collection) return null;

    // Determine completion
    const watchedCount = collection.parts.filter(p => isInWatchlist(String(p.id))).length; 
    const progress = Math.round((watchedCount / collection.parts.length) * 100);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <div className="relative w-full h-[60vh] md:h-[70vh]">
                <div className="absolute inset-0">
                    <img
                        src={`https://image.tmdb.org/t/p/original${collection.backdrop_path}`}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-4xl space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                            Franchise Universe
                        </span>
                        <span className="text-muted-foreground text-sm font-medium">{collection.parts.length} Movies</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-bold text-foreground tracking-tight drop-shadow-2xl"
                    >
                        {collection.name}
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl leading-relaxed line-clamp-3"
                    >
                        {collection.overview}
                    </motion.p>
                    
                    {/* Collection Progress */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-4 bg-card/10 backdrop-blur-md p-4 rounded-xl border border-white/5 max-w-md"
                    >
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                <span>Collection Progress</span>
                                <span className={progress === 100 ? "text-primary" : ""}>{watchedCount}/{collection.parts.length} Watched</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-gradient-to-r from-primary to-purple-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Timeline View */}
            <div className="px-4 md:px-16 -mt-20 relative z-10 space-y-12">
                <div className="space-y-6">
                    {collection.parts.map((movie, index) => (
                        <motion.div 
                            key={movie.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="group relative flex gap-6 md:gap-10 items-start md:items-center"
                        >
                            {/* Connector Line */}
                            {index !== collection.parts.length - 1 && (
                                <div className="absolute left-[3.25rem] md:left-[9rem] top-24 bottom-[-3rem] w-0.5 bg-gradient-to-b from-primary/50 to-transparent group-last:hidden" />
                            )}

                            {/* Year / Date */}
                            <div className="hidden md:block w-24 text-right pt-6 md:pt-0 shrink-0">
                                <div className="text-xl font-bold text-foreground">{movie.releaseDate?.substring(0, 4)}</div>
                                <div className="text-xs text-muted-foreground uppercase">{new Date(movie.releaseDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            </div>

                            {/* Poster / Node */}
                            <div className="relative shrink-0 w-28 md:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-105 ring-2 ring-transparent group-hover:ring-primary/50">
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => router.push(`/watch?id=${movie.id}&type=movie`)}
                                        className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300 shadow-glow"
                                    >
                                        <Play fill="currentColor" size={20} className="ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Info */}
                            <div className="flex-1 pt-2 md:pt-0 space-y-2">
                                <h3 className="text-xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                                    {movie.title}
                                    {isInWatchlist(String(movie.id)) && <Check size={20} className="text-primary" />}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Star size={14} className="text-yellow-500" />
                                        <span>{movie.rating?.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span className="md:hidden">{movie.releaseDate?.substring(0, 4)}</span>
                                        <span className="hidden md:inline">{movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : 'N/A'}</span>
                                    </div>
                                </div>
                                <p className="text-sm md:text-base text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed">
                                    {movie.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function UniversePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <UniverseContent />
        </Suspense>
    );
}
