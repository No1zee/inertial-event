"use client";

import * as React from "react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useSeriesTrackingStore } from "@/lib/store/seriesTrackingStore";
import { VidlinkPlayer } from "@/components/player/VidlinkPlayer";
import { Button } from "@/components/UI/button";
import { useContentDetails, useSeasonDetails } from "@/hooks/queries/useContent";

function ModalWatchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get ID and Type from Query Params
    const id = searchParams.get("id");
    const type = (searchParams.get("type") as 'movie' | 'tv' | 'anime') || 'movie';
    const initialSeason = Number(searchParams.get("season")) || 1;
    const initialEpisode = Number(searchParams.get("episode")) || 1;

    const [currentSeason, setCurrentSeason] = useState(initialSeason);
    const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
    const getTrackedProgress = useSeriesTrackingStore((state: any) => state.getProgress);

    // Sync state with URL or tracking store if URL changes
    useEffect(() => {
        let s = Number(searchParams.get("season"));
        let e = Number(searchParams.get("episode"));
        
        // If not specified in URL, try to recover from memory
        if ((!s || !e) && type !== 'movie') {
            const progress = getTrackedProgress(id || '');
            if (progress) {
                s = progress.season;
                e = progress.episode;
            }
        }

        if (s && s !== currentSeason) setCurrentSeason(s);
        if (e && e !== currentEpisode) setCurrentEpisode(e);
    }, [searchParams, getTrackedProgress, id, type]);

    const addToHistory = useHistoryStore((state: any) => state.addToHistory);

    // Redirect if no ID
    useEffect(() => {
        if (!id) {
            router.back();
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

    // 2. Fetch Season Details (Needed by SWR cache under the hood for next calls)
    useSeasonDetails(id || '', currentSeason);

    const cleanTmdbId = id ? id.replace('tmdb_', '') : '';

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Minimal Modal Header */}
            <div className="flex-none flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-[10000] absolute top-0 left-0 w-full pointer-events-none transition-opacity duration-300 opacity-0 hover:opacity-100">
                <Button 
                    variant="ghost" 
                    size="icon"
                    className="pointer-events-auto hover:bg-white/20 text-white rounded-full bg-black/40 backdrop-blur-md"
                    onClick={() => router.back()}
                >
                    <X className="h-6 w-6" />
                </Button>
                
                {content && (
                    <div className="text-right pointer-events-none drop-shadow-md">
                        <h1 className="text-lg font-bold text-white">{content.title}</h1>
                        {type !== 'movie' && (
                            <p className="text-sm text-zinc-300 font-medium tracking-wide">
                                S{currentSeason} : E{currentEpisode}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Video Player */}
            <div className="flex-1 w-full h-full relative"> 
                {contentLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
                    </div>
                ) : contentError || !content ? (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="text-center space-y-4 max-w-md px-6 bg-zinc-900/50 p-8 rounded-2xl border border-white/10">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-white">Playback Error</h2>
                            <p className="text-zinc-400">Content not found or failed to load.</p>
                            <Button onClick={() => router.back()} variant="secondary" className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        </div>
                    </div>
                ) : (
                    <VidlinkPlayer
                        tmdbId={cleanTmdbId}
                        type={type}
                        season={currentSeason}
                        episode={currentEpisode}
                        content={content}
                    />
                )}
            </div>
        </div>
    );
}

export default function InterceptedWatchPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-red-600 shadow-xl" />
            </div>
        }>
            <ModalWatchContent />
        </Suspense>
    );
}
