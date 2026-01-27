"use client";

import * as React from "react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import PostPlayOverlay from '@/components/player/overlay/PostPlayOverlay';
import { contentApi } from "@/lib/api/content";
import sourceProvider from "@/services/sourceProvider";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useSeriesTrackingStore } from "@/lib/store/seriesTrackingStore";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import WebviewPlayer from "@/components/player/WebviewPlayer";
import { Button } from "@/components/UI/button";
import { Content } from "@/lib/types/content";
import { useContentDetails, useSeasonDetails } from "@/hooks/queries/useContent";
import { useSources } from "@/hooks/queries/useSources";
import { useTorrentEngine } from "@/hooks/useTorrentEngine";
import { motion } from "framer-motion";

// Helper Component for Torrent Loading
const TorrentLoader = ({ status }: { status: any }) => {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center bg-black gap-6">
             <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ 
                        repeat: Infinity, 
                        ease: "linear", 
                        duration: 0.4  // Really fast spin
                    }}
                >
                    <Loader2 className="h-20 w-20 text-blue-500" />
                </motion.div>
             </div>
             
             <div className="text-center space-y-2">
                 {/* Removed Header per user request */}
                 <p className="text-zinc-400 font-mono text-sm">
                    {status?.progress ? `Buffering: ${(status.progress * 100).toFixed(1)}%` : "Connecting to peers..."}
                 </p>
                 {status?.downloadSpeed > 0 && (
                     <p className="text-zinc-500 text-xs">
                         {(status.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s
                     </p>
                 )}
             </div>
        </div>
    );
};

function WatchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get ID and Type from Query Params
    const id = searchParams.get("id");
    const type = (searchParams.get("type") as 'movie' | 'tv' | 'anime') || 'movie';
    const initialSeason = Number(searchParams.get("season")) || 1;
    const initialEpisode = Number(searchParams.get("episode")) || 1;

    const [currentSeason, setCurrentSeason] = useState(initialSeason);
    const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
    const [showPostPlay, setShowPostPlay] = useState(false);
    
    // Torrent Engine
    const { startTorrent, stopTorrent, status: torrentStatus, loading: torrentLoading, error: torrentError } = useTorrentEngine();
    const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);

    // Sync state with URL if URL changes (back/forward nav)
    useEffect(() => {
        const s = Number(searchParams.get("season"));
        const e = Number(searchParams.get("episode"));
        if (s && s !== currentSeason) setCurrentSeason(s);
        if (e && e !== currentEpisode) setCurrentEpisode(e);
    }, [searchParams]);

    const addToHistory = useHistoryStore((state: any) => state.addToHistory);
    const trackSeries = useSeriesTrackingStore((state: any) => state.trackSeries);

    // Redirect if no ID
    useEffect(() => {
        if (!id) {
            router.push('/');
        }
    }, [id, router]);

    // 1. Fetch Content Details
    const { 
        data: content, 
        isLoading: contentLoading, 
        error: contentError 
    } = useContentDetails(id || '', type);

    // Save to history when content loads
    useEffect(() => {
        if (content) {
            addToHistory(content);
        }
    }, [content, addToHistory]);

    // 2. Fetch Sources
    const { 
        data: sourcesMap, 
        isLoading: sourcesLoading,
        error: sourcesError
    } = useSources(content || null, currentSeason, currentEpisode);

    // 2.5 Fetch Season Details for Availability Indicators
    const {
        data: seasonDetails
    } = useSeasonDetails(id || '', currentSeason);

    // Calculate Best Source
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [isEmbed, setIsEmbed] = useState(false);
    const [sourceError, setSourceError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false); // Track playback state

    useEffect(() => {
        if (sourcesMap) {
            let bestSourceObj: any = null;
            const vidlink = sourcesMap.get('vidlink');
            const torrent = sourcesMap.get('torrent');

            // Logic: Prefer Vidlink usually, but will fallback to torrent
            if (vidlink && vidlink.length > 0) {
                bestSourceObj = vidlink[0];
            } else if (torrent && torrent.length > 0) {
                bestSourceObj = torrent[0];
            }

            if (bestSourceObj) {
                setSourceUrl(bestSourceObj.url);
                const looksLikeEmbed = bestSourceObj.url.includes('/embed/') || 
                                     bestSourceObj.url.includes('vidsrc') || 
                                     bestSourceObj.url.includes('vidlink.pro');
                
                console.log('[WatchPage] Selected Source URL:', bestSourceObj.url);
                setIsEmbed(bestSourceObj.type === 'embed' || looksLikeEmbed);
                setSourceError(null);
            } else {
                setSourceUrl(null);
                setSourceError("No playable sources found for this episode");
            }
        }
    }, [sourcesMap]);

    // 3. Resolve Stream URL (Handle Torrents)
    useEffect(() => {
        // Reset state when source changes
        setResolvedStreamUrl(null);
        stopTorrent();

        if (sourceUrl) {
            if (sourceUrl.startsWith('magnet:')) {
                // Initialize Torrent
                startTorrent(sourceUrl).then((url) => {
                    if (url) setResolvedStreamUrl(url);
                });
            } else {
                // Direct URL
                setResolvedStreamUrl(sourceUrl);
            }
        }
        
        return () => {
            stopTorrent();
        };
    }, [sourceUrl, startTorrent, stopTorrent]);

    if (contentLoading || (sourcesLoading && !sourceUrl)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600" />
                    <p className="text-zinc-400 font-medium animate-pulse">
                        {contentLoading ? "Loading details..." : "Locating stream..."}
                    </p>
                </div>
            </div>
        );
    }

    if (contentError || (!content && !contentLoading)) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="text-center space-y-4 max-w-md px-6">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Playback Error</h2>
                    <p className="text-zinc-400">Content not found or failed to load.</p>
                    <Button onClick={() => router.back()} variant="secondary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Torrent Loading State
    const isMagnet = sourceUrl?.startsWith('magnet:');
    if (isMagnet && (!resolvedStreamUrl || torrentLoading)) {
        return <TorrentLoader status={torrentStatus} />;
    }
    
    // Torrent Error
    if (isMagnet && torrentError) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="text-center space-y-4 max-w-md px-6">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Stream Failed</h2>
                    <p className="text-zinc-400">{torrentError}</p>
                    <Button onClick={() => router.back()} variant="secondary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Source Error (Content loaded but no source)
    if ((sourcesError || sourceError) && !sourceUrl && !sourcesLoading) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="text-center space-y-4 max-w-md px-6">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Stream Unavailable</h2>
                    <p className="text-zinc-400">{sourceError || "Failed to load sources."}</p>
                    <Button onClick={() => router.back()} variant="secondary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!content) return null; // Safety

    // Handlers
    const handleSeasonChange = (s: number) => {
        setCurrentSeason(s);
        setCurrentEpisode(1);
        router.push(`/watch?id=${id}&type=${type}&season=${s}&episode=1`);
    };

    const handleEpisodeChange = (e: string) => {
        const ep = parseInt(e);
        setCurrentEpisode(ep);
        router.push(`/watch?id=${id}&type=${type}&season=${currentSeason}&episode=${ep}`);
    };

    const getNextEpisode = () => {
        if (type === 'movie') return null; 
        if (!content || !content.seasonsList) return null;

        const currentS = currentSeason;
        const currentE = currentEpisode;
        
        const seasonData = content.seasonsList.find((s: any) => s.season_number === currentS);
        if (!seasonData) return null;
        
        if (currentE < seasonData.episode_count) {
            return { season: currentS, episode: currentE + 1 };
        }
        
        const nextS = content.seasonsList.find((s: any) => s.season_number === currentS + 1);
        if (nextS) {
            return { season: currentS + 1, episode: 1 };
        }
        return null;
    };
    
    const nextEpisode = getNextEpisode();

    const handleEnded = () => {
        setShowPostPlay(true);
    };



    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
            {/* 
              Overlay Visibility Logic:
              - Always show if NOT playing (Paused or Initial)
              - If playing, hide it (opacity-0) unless hovered (hover:opacity-100)
              - Increased z-index to [120] to ensure it sits above the player interaction layers.
            */}
            <div className={`absolute top-0 left-0 w-full z-[120] p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none transition-opacity duration-300 ${!isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                {!isEmbed ? (
                    <Button
                        variant="ghost"
                        className="pointer-events-auto hover:bg-white/10 text-white"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                    </Button>
                ) : (
                    <div /> // Placeholder to keep title on the right
                )}

                <div className="text-right">
                    <h1 className="text-lg font-bold text-white drop-shadow-md">{content.title}</h1>
                    {type === 'tv' && <p className="text-sm text-zinc-300">Season {currentSeason} • Episode {currentEpisode}</p>}
                </div>
            </div>

            <div className="flex-1 w-full h-full"> 
                {resolvedStreamUrl ? (
                    isEmbed ? (
                        <WebviewPlayer
                            key={resolvedStreamUrl}
                            src={resolvedStreamUrl}
                            title={content.title}
                            contentData={content}
                            initialVolume={1}
                            onEnded={handleEnded}
                            type={type}
                            season={currentSeason.toString()}
                            episode={currentEpisode.toString()}
                            seasons={content.seasonsList}
                            episodeDetails={seasonDetails?.episodes}
                            onSeasonChange={handleSeasonChange}
                            onEpisodeChange={handleEpisodeChange}
                            onStateUpdate={(state: any) => {
                                // Sync Playback State for Overlay
                                setIsPlaying(!state.isPaused);

                                if (content && state.currentTime > 0) {
                                    const progress = state.currentTime;
                                    const duration = state.duration || 0;

                                    if (!state.isSeeking && !state.isPaused) {
                                        addToHistory({
                                            ...content,
                                            progress,
                                            duration,
                                            season: currentSeason,
                                            episode: currentEpisode
                                        });

                                        if (type === 'tv' || type === 'anime') {
                                            trackSeries(content, currentSeason, currentEpisode);
                                        }
                                    }
                                }
                            }}
                        />
                    ) : (
                        <div className="w-full h-full">
                            <VideoPlayer
                                src={resolvedStreamUrl}
                                poster={content.backdrop || content.poster}
                                title={content.title}
                                onEnded={handleEnded}
                            />
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-zinc-500">
                         {/* This state is usually handled by loading/error checks above, but nice fallback */}
                         Source unavailable
                    </div>
                )}
            </div>

            <PostPlayOverlay 
                show={showPostPlay} 
                onClose={() => router.push('/')}
                currentId={id!}
                type={type}
                nextEpisode={nextEpisode}
                onPlay={(newId: string, newType: string, season?: number, episode?: number) => {
                    setShowPostPlay(false);
                    if (season && episode) {
                        // Series Navigation
                        router.push(`/watch?id=${newId}&type=${newType}&season=${season}&episode=${episode}`);
                    } else {
                        // Movie Navigation
                        router.push(`/watch?id=${newId}&type=${newType}`);
                    }
                }}
            />
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
