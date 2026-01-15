"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { contentApi } from "@/lib/api/content";
import sourceProvider from "@/services/sourceProvider";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import WebviewPlayer from "@/components/player/WebviewPlayer";
import { Button } from "@/components/UI/button";
import { Content } from "@/lib/types/content";

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = (searchParams.get("type") as 'movie' | 'tv') || 'movie';

    // Unwrap params (Next.js 15+)
    const { id } = React.use(params);

    const [content, setContent] = useState<Content | null>(null);
    const [loading, setLoading] = useState(true);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [isEmbed, setIsEmbed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSeason, setCurrentSeason] = useState(Number(searchParams.get("season")) || 1);
    const [currentEpisode, setCurrentEpisode] = useState(Number(searchParams.get("episode")) || 1);
    const { setDuration, setCurrentTime, setPlaying } = usePlayerStore();
    const addToHistory = useHistoryStore(state => state.addToHistory);
    const isSaved = false; // Todo: Implement library store

    // Save to history when content loads
    useEffect(() => {
        if (content) {
            addToHistory(content);
        }
    }, [content, addToHistory]);

    // 1. Fetch Content Details
    useEffect(() => {
        let mounted = true;
        async function fetchDetails() {
            try {
                const details = await contentApi.getDetails(id, type);
                if (!mounted) return;
                if (!details) {
                    setError("Content not found");
                    return;
                }
                setContent(details);
            } catch (err) {
                if (mounted) setError("Failed to load content details");
            }
        }
        fetchDetails();
        return () => { mounted = false; };
    }, [id, type]);

    // 2. Fetch Sources when content or episode changes
    useEffect(() => {
        if (!content) return;
        let mounted = true;

        async function fetchSources() {
            setLoading(true);
            setError(null);
            try {
                const sourceType = type === 'movie' ? 'movie' : type === 'tv' ? 'series' : 'anime';
                const sourcesMap = await sourceProvider.getAllSources({
                    id: content.id,
                    title: content.title,
                    type: sourceType
                }, currentSeason, currentEpisode);

                if (!mounted) return;

                let bestSourceObj: any = null;
                const vidlink = sourcesMap.get('vidlink');
                const torrent = sourcesMap.get('torrent');

                if (vidlink && vidlink.length > 0) {
                    bestSourceObj = vidlink[0];
                } else if (torrent && torrent.length > 0) {
                    bestSourceObj = torrent[0];
                } else {
                    setError("No playable sources found for this episode");
                }

                if (bestSourceObj) {
                    setSourceUrl(bestSourceObj.url);
                    setIsEmbed(bestSourceObj.type === 'embed');
                } else {
                    setSourceUrl(null);
                }
            } catch (err: any) {
                if (mounted) setError(err.message || "Failed to load sources");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchSources();
        return () => { mounted = false; };
    }, [content, currentSeason, currentEpisode, type]);

    const handleSeasonChange = (s: number) => {
        setCurrentSeason(s);
        setCurrentEpisode(1); // Reset to ep 1
    };

    const handleEpisodeChange = (e: string) => {
        setCurrentEpisode(parseInt(e));
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600" />
                    <p className="text-zinc-400 font-medium animate-pulse">Locating stream...</p>
                </div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="text-center space-y-4 max-w-md px-6">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Playback Error</h2>
                    <p className="text-zinc-400">{error || "Unknown error occurred"}</p>
                    <Button onClick={() => router.back()} variant="secondary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
            {/* Top Bar / Navigation Overlay */}
            <div className={`absolute top-0 left-0 w-full z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none transition-opacity duration-300 ${isEmbed ? 'hover:opacity-100 opacity-0' : 'opacity-100'}`}>
                <Button
                    variant="ghost"
                    className="pointer-events-auto hover:bg-white/10 text-white"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back
                </Button>

                <div className="text-right">
                    <h1 className="text-lg font-bold text-white drop-shadow-md">{content.title}</h1>
                    {type === 'tv' && <p className="text-sm text-zinc-300">Season {currentSeason} • Episode {currentEpisode}</p>}
                </div>
            </div>

            {/* Player Container */}
            <div className="flex-1 flex items-center justify-center bg-black">
                {sourceUrl ? (
                    isEmbed ? (
                        <WebviewPlayer
                            src={sourceUrl}
                            title={content.title}
                            isSaved={isSaved}
                            type={type}
                            season={currentSeason.toString()}
                            episode={currentEpisode.toString()}
                            seasons={content.seasonsList}
                            onSeasonChange={handleSeasonChange}
                            onEpisodeChange={handleEpisodeChange}
                            onStateUpdate={(state) => {
                                console.log("[WatchPage] Webview State Update:", state);
                            }}
                        />
                    ) : (
                        <div className="w-full h-full max-w-[1920px]">
                            <VideoPlayer
                                src={sourceUrl}
                                poster={content.backdrop || content.poster}
                                title={content.title}
                                onEnded={() => { console.log("Video ended"); }}
                            />
                        </div>
                    )
                ) : (
                    <div className="text-zinc-500">Source URL missing</div>
                )}

            </div>
        </div>
    );
}
