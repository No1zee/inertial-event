"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { contentApi } from "@/lib/api/content";
import { useUIStore } from "@/lib/store/uiStore";
import { ContentModal } from "@/components/content/ContentModal";
import { Content } from "@/lib/types/content";

// Rails Configuration
const RAIL_CONFIGS = [
    { id: "trending", title: "Trending Now", fetcher: contentApi.getTrending },
    { id: "popular_tv", title: "Popular Series", fetcher: contentApi.getPopularTV },
    { id: "scifi", title: "Sci-Fi & Fantasy", fetcher: () => contentApi.getByGenre(878, 'movie') },
    { id: "action", title: "Top Rated Action", fetcher: () => contentApi.getByGenre(28, 'movie') },

    // New Dynamic Collections
    { id: "cbm", title: "Comic Book Movies", fetcher: () => contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc' }, 'movie') }, // Superhero keyword
    { id: "a24", title: "Kinda A24", fetcher: () => contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc' }, 'movie') },
    { id: "romcom", title: "Rom Coms", fetcher: () => contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc' }, 'movie') },
    { id: "horror", title: "Late Night Horror", fetcher: () => contentApi.getByGenre(27, 'movie') },
    { id: "anime", title: "Anime Hits", fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc' }, 'tv') }, // Anime keyword
    { id: "comedy", title: "Comedy Specials", fetcher: () => contentApi.getByGenre(35, 'movie') },
    { id: "docu", title: "Mind-Blowing Docs", fetcher: () => contentApi.getByGenre(99, 'movie') },
    { id: "drama", title: "Award Winning Dramas", fetcher: () => contentApi.getByGenre(18, 'movie') },
    { id: "thriller", title: "Psychological Thrillers", fetcher: () => contentApi.getByGenre(53, 'movie') },
    { id: "family", title: "Watch Together", fetcher: () => contentApi.getByGenre(10751, 'movie') },
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
    const { data: trending } = useQuery({
        queryKey: ["trending", "hero"],
        queryFn: contentApi.getTrending,
        staleTime: 1000 * 60 * 10
    });

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
            <div className="relative z-10 -mt-20 space-y-12 pl-4 lg:pl-12 opacity-95">
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

            <ContentModal />
        </div>
    );
}

// Wrapper for individual rails to handle their own data fetching
function AsyncRail({ config }: { config: any }) {
    const { data, isLoading } = useQuery<Content[]>({
        queryKey: ["rail", config.id],
        queryFn: config.fetcher,
        staleTime: 1000 * 60 * 30, // Cache for 30 mins
        refetchOnWindowFocus: false
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-[300px] w-[200px] bg-zinc-800 rounded-xl shrink-0 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    return <ContentRail title={config.title} items={data} />;
}
