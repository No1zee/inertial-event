"use client";

import * as React from "react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import PostPlayOverlay from '@/components/player/overlay/PostPlayOverlay';
import { useHistoryStore } from "@/lib/store/historyStore";
import { VidlinkPlayer } from "@/components/player/VidlinkPlayer";
import { Button } from "@/components/UI/button";
import { useContentDetails, useSeasonDetails } from "@/hooks/queries/useContent";

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
    
    // Sync state with URL if URL changes (back/forward nav)
    useEffect(() => {
        const s = Number(searchParams.get("season"));
        const e = Number(searchParams.get("episode"));
        if (s && s !== currentSeason) setCurrentSeason(s);
        if (e && e !== currentEpisode) setCurrentEpisode(e);
    }, [searchParams]);

    const addToHistory = useHistoryStore((state: any) => state.addToHistory);

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

    // 2. Fetch Season Details for Availability Indicators
    const {
        data: seasonDetails
    } = useSeasonDetails(id || '', currentSeason);

    if (contentLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600" />
                    <p className="text-zinc-400 font-medium animate-pulse">
                        Loading details...
                    </p>
                </div>
            </div>
        );
    }

    if (contentError || !content) {
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

    const cleanTmdbId = id!.replace('tmdb_', '');

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col group">
            <div className={`absolute top-0 left-0 w-full z-[120] p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between transition-opacity duration-300 opacity-0 group-hover:opacity-100`}>
                <Button
                    variant="ghost"
                    className="hover:bg-white/10 text-white shadow-sm"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back
                </Button>

                <div className="text-right pointer-events-none">
                    <h1 className="text-lg font-bold text-white drop-shadow-md">{content.title}</h1>
                    {type !== 'movie' && <p className="text-sm text-zinc-300">Season {currentSeason} • Episode {currentEpisode}</p>}
                </div>
            </div>

            <div className="flex-1 w-full h-full relative z-[100]"> 
                <VidlinkPlayer
                    tmdbId={cleanTmdbId}
                    type={type}
                    season={currentSeason}
                    episode={currentEpisode}
                    content={content}
                />
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
                        router.push(`/watch?id=${newId}&type=${newType}&season=${season}&episode=${episode}`);
                    } else {
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
