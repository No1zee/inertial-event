"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { contentApi } from "@/lib/api/content";
import { useUIStore } from "@/lib/store/uiStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { Content } from "@/lib/types/content";
import { useTrending, useSimilar } from "@/hooks/queries/useContent";

// Rails Configuration
const RAIL_CONFIGS = [
    { id: "trending", title: "Trending Now", fetcher: contentApi.getTrending },
    { id: "popular_tv", title: "Most Popular Series", fetcher: contentApi.getPopularTV },
    { id: "scifi", title: "Sci-Fi & Fantasy Worlds", fetcher: () => contentApi.getByGenre(878, 'movie') },
    { id: "action", title: "High Octane Action", fetcher: () => contentApi.getByGenre(28, 'movie') },
    // New Dynamic Collections
    { id: "cbm", title: "Superheroes & Villains", fetcher: () => contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc' }, 'movie') },
    { id: "a24", title: "Indie Gems", fetcher: () => contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc' }, 'movie') },
    { id: "romcom", title: "Rom-Com Favorites", fetcher: () => contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc' }, 'movie') },
    { id: "short", title: "Quick Watch (< 100m)", fetcher: contentApi.getShortAndSweet },
    { id: "feelgood", title: "Feel Good Movies", fetcher: contentApi.getFeelGood },
    { id: "horror", title: "Late Night Horror", fetcher: () => contentApi.getByGenre(27, 'movie') },
    { id: "anime", title: "Anime Hits", fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc' }, 'tv') },
    { id: "docu", title: "Mind-Blowing Docs", fetcher: () => contentApi.getByGenre(99, 'movie') },
];

export default function DashboardPage() {
    const { sidebarOpen } = useUIStore();
    const [visibleCount, setVisibleCount] = useState(4); // Start with 4 rails

    const sentinelRef = useRef(null);
    const isInView = useInView(sentinelRef, { amount: 0.1 });

    // Infinite Scroll Logic
    useEffect(() => {
        if (isInView && visibleCount < RAIL_CONFIGS.length) {
            // Load 2 more rails at a time
            const timeout = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 2, RAIL_CONFIGS.length));
            }, 500); // Small delay for effect
            return () => clearTimeout(timeout);
        }
    }, [isInView, visibleCount]);

    // Fetch Heading Data (Trending) for Hero
    const { data: trending } = useTrending();

    const [heroItems, setHeroItems] = useState<Content[]>([]);

    useEffect(() => {
        if (trending && trending.length > 0) {
            // Shuffle locally on mount to ensure fresh rotation even if cached
            const shuffled = [...trending].sort(() => Math.random() - 0.5).slice(0, 5);
            setHeroItems(shuffled);
        }
    }, [trending]);

    return (
        <div className="min-h-screen bg-[#141414] pb-20">
            <Hero items={heroItems} />

            {/* Content Rails */}
            <div className="relative z-10 -mt-12 sm:-mt-24 space-y-8 md:space-y-10 pb-24">

                {/* Continue Watching Rail */}
                <ContinueWatchingRail />

                {/* Because You Watched Rail */}
                <BecauseYouWatchedRail />

                {RAIL_CONFIGS.slice(0, visibleCount).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Sentinel for Infinite Scroll */}
                {visibleCount < RAIL_CONFIGS.length && (
                    <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}

interface RailConfig {
    id: string;
    title: string;
    fetcher: () => Promise<Content[]>;
}

function AsyncRail({ config }: { config: RailConfig }) {
    const { data, isLoading } = useQuery<Content[]>({
        queryKey: ["rail", config.id],
        queryFn: () => config.fetcher(),
        staleTime: 1000 * 60 * 30, // Cache for 30 mins
        refetchOnWindowFocus: false,
        retry: 1
    });

    if (isLoading) {
        return <div className="h-64 bg-zinc-900/10 animate-pulse rounded-xl" />;
    }

    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return <ContentRail title={config.title} items={data} railId={config.id} />;
}

function ContinueWatchingRail() {
    // Subscribe to history to trigger re-renders
    const history = useHistoryStore(state => state.history);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Derive items directly from the fresh store state
    const items = useHistoryStore.getState().getContinueWatching();

    if (!mounted || items.length === 0) return null;

    return <ContentRail title="Continue Watching" items={items} />;
}

function BecauseYouWatchedRail() {
    const history = useHistoryStore(state => state.history);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);

    const last = history[0];
    const { data: similarItems } = useSimilar(last?.id || '', last?.type);

    if (!mounted || !last || !similarItems || similarItems.length === 0) return null;

    return <ContentRail title={`Because you watched ${last.title}`} items={similarItems} />;
}
