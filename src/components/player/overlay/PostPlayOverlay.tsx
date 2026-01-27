import { useEffect, useState, useRef } from 'react';
import { Play, X, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostPlayOverlayProps {
    show: boolean;
    onClose: () => void;
    currentId: string;
    type: 'movie' | 'tv' | 'anime';
    onPlay: (id: string, type: 'movie' | 'tv' | 'anime', season?: number, episode?: number) => void;
    nextEpisode?: { season: number, episode: number } | null;
}

export default function PostPlayOverlay({ show, onClose, currentId, type, onPlay, nextEpisode }: PostPlayOverlayProps) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null); 
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [timer, setTimer] = useState(10);
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // Fade in effect
    const [opacity, setOpacity] = useState(0);

    const clearTimers = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };

    useEffect(() => {
        if (show) {
            setOpacity(0);
            setTimeout(() => setOpacity(1), 100);
            
            if (nextEpisode) {
                fetchNextEpisode();
            } else {
                fetchRecommendations();
            }
        } else {
            setOpacity(0);
            setTrailerUrl(null);
            clearTimers();
        }
        return clearTimers;
    }, [show, currentId, nextEpisode]);

    const fetchNextEpisode = async () => {
        if (!nextEpisode) return;
        try {
            // Fetch Episode Details
            const res = await fetch(`/tmdb-api/tv/${currentId}/season/${nextEpisode.season}/episode/${nextEpisode.episode}`);
            const data = await res.json();
            
            if (data) {
                const epData = {
                    ...data,
                    title: data.name || `Episode ${nextEpisode.episode}`,
                    backdrop_path: data.still_path || data.backdrop_path, // Fallback
                    nextEpisodeParams: nextEpisode
                };
                setSelectedItem(epData);
                startCountdown(epData);
            }
        } catch (e) {
            console.error("Failed to fetch next episode", e);
            fetchRecommendations(); // Fallback
        }
    };

    const startCountdown = (item: any) => {
        setTimer(10);
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    // Trigger Play
                    onPlay(currentId, type, nextEpisode?.season, nextEpisode?.episode);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelAutoPlay = () => {
        clearTimers();
        setTimer(0);
    };

    const fetchRecommendations = async () => {
        try {
            const res = await fetch(`/tmdb-api/${type}/${currentId}/recommendations`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const valid = data.results.filter((m: any) => m.backdrop_path).slice(0, 3);
                setRecommendations(valid);
                if (valid.length > 0) {
                    selectItem(valid[0]);
                }
            }
        } catch (e) {
            console.error("Failed to fetch recs", e);
        }
    };

    const selectItem = async (item: any) => {
        cancelAutoPlay(); // Stop countdown if user interacts
        setSelectedItem(item);
        setTrailerUrl(null);
        
        // Fetch Trailer
        try {
            const res = await fetch(`/tmdb-api/${type === 'movie' ? 'movie' : 'tv'}/${item.id}/videos`);
            const data = await res.json();
            const clips = data.results || [];
            const trailer = clips.find((v: any) => v.type === "Trailer" && v.site === "YouTube") || clips.find((v: any) => v.site === "YouTube");
            
            if (trailer) {
                setTimeout(() => {
                    setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailer.key}`);
                }, 500);
            }
        } catch (e) {}
    };

    if (!show) return null;

    return (
        <div 
            className="absolute inset-0 z-[100] bg-black transition-opacity duration-1000 flex flex-col"
            style={{ opacity }}
        >
            {/* BACKGROUND TRAILER */}
            <div className="absolute inset-0 overflow-hidden opacity-40">
                {trailerUrl ? (
                    <iframe
                        src={trailerUrl}
                        className="w-[150%] h-[150%] -ml-[25%] -mt-[25%] pointer-events-none" 
                        allow="autoplay; encrypted-media"
                    />
                ) : (
                    selectedItem && (
                        <img 
                            src={`https://image.tmdb.org/t/p/original${selectedItem.backdrop_path || selectedItem.still_path}`}
                            className="w-full h-full object-cover animate-pulse-slow"
                        />
                    )
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 flex flex-col h-full p-12 pt-24 text-white">
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                    <X size={24} />
                </button>

                <div className="mt-auto mb-12 max-w-2xl">
                    <h3 className="text-xl text-gray-400 font-medium mb-2">
                        {nextEpisode ? (timer > 0 ? `Up Next in ${timer}s` : "Up Next") : "Recommended"}
                    </h3>
                    {selectedItem && (
                        <>
                            <h1 className="text-5xl font-bold mb-4 leading-tight">
                                {selectedItem.title || selectedItem.name}
                            </h1>
                            <p className="text-gray-300 line-clamp-3 mb-8 text-lg">
                                {selectedItem.overview}
                            </p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        if (selectedItem.nextEpisodeParams) {
                                            onPlay(currentId, type, selectedItem.nextEpisodeParams.season, selectedItem.nextEpisodeParams.episode);
                                        } else {
                                            onPlay(selectedItem.id, type);
                                        }
                                    }}
                                    className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-lg font-bold text-xl hover:scale-105 transition-transform"
                                >
                                    <Play fill="currentColor" />
                                    {timer > 0 && nextEpisode ? `Play Now (${timer})` : "Play Now"}
                                </button>
                                
                                {!nextEpisode && (
                                    <button 
                                        onClick={() => router.push(`/${type}/${selectedItem.id}`)}
                                        className="flex items-center gap-3 bg-white/20 text-white px-6 py-4 rounded-lg font-bold text-xl hover:bg-white/30 transition"
                                    >
                                        <Info size={24} />
                                        More Info
                                    </button>
                                )}
                                {nextEpisode && (
                                    <button 
                                        onClick={cancelAutoPlay}
                                        className="flex items-center gap-3 bg-white/20 text-white px-6 py-4 rounded-lg font-bold text-xl hover:bg-white/30 transition"
                                    >
                                        Cancel Auto-Play
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* THUMBNAIL GRID (Only for recommendations) */}
                {!nextEpisode && (
                    <div className="absolute bottom-12 right-12 flex gap-4">
                        {recommendations.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => selectItem(item)}
                                className={`
                                    relative w-64 aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-300
                                    ${selectedItem?.id === item.id ? 'ring-4 ring-white scale-105 z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}
                                `}
                            >
                                <img 
                                    src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                    <Play fill="white" className="w-12 h-12 text-white" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                                    <p className="text-sm font-semibold truncate">{item.title || item.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
