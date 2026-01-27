"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { Sparkles, Film } from "lucide-react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { BrandBlock } from "@/components/brand/BrandBlock";
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
    { id: "day_one_movies", title: "New Movies", fetcher: () => contentApi.getDayOneDrops('movie') },
    { id: "day_one_tv", title: "New TV Shows", fetcher: () => contentApi.getDayOneDrops('tv') },
    // Action & Adventure
    { id: "action", title: "High Octane Action", fetcher: () => contentApi.getByGenre(28, 'movie') },
    { id: "adventure", title: "Epic Adventures", fetcher: () => contentApi.getByGenre(12, 'movie') },
    { id: "thriller", title: "Edge of Your Seat", fetcher: () => contentApi.getByGenre(53, 'movie') },
    // Sci-Fi & Fantasy
    { id: "scifi", title: "Sci-Fi & Fantasy Worlds", fetcher: () => contentApi.getByGenre(878, 'movie') },
    { id: "scifi_tv", title: "Sci-Fi Series", fetcher: () => contentApi.getByGenre(10765, 'tv') },
    // Superheroes & Comics
    { id: "cbm", title: "Superheroes & Villains", fetcher: () => contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc' }, 'movie') },
    // Horror & Mystery
    { id: "horror", title: "Late Night Horror", fetcher: () => contentApi.getByGenre(27, 'movie') },
    { id: "mystery", title: "Mystery & Suspense", fetcher: () => contentApi.getByGenre(9648, 'movie') },
    // Comedy & Romance
    { id: "comedy", title: "Laugh Out Loud", fetcher: () => contentApi.getByGenre(35, 'movie') },
    { id: "romcom", title: "Rom-Com Favorites", fetcher: () => contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc' }, 'movie') },
    { id: "romance", title: "Romance & Drama", fetcher: () => contentApi.getByGenre(10749, 'movie') },
    // Drama & Prestige
    { id: "drama", title: "Award-Winning Drama", fetcher: () => contentApi.getByGenre(18, 'movie') },
    { id: "drama_tv", title: "Prestige TV", fetcher: () => contentApi.getByGenre(18, 'tv') },
    { id: "a24", title: "Indie Gems", fetcher: () => contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc' }, 'movie') },
    // Animation
    { id: "anime", title: "Anime Hits", fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc' }, 'tv') },
    { id: "animation", title: "Animated Classics", fetcher: () => contentApi.getByGenre(16, 'movie') },
    { id: "family", title: "Family Fun", fetcher: () => contentApi.getByGenre(10751, 'movie') },
    // Documentary & Reality
    { id: "docu", title: "Mind-Blowing Docs", fetcher: () => contentApi.getByGenre(99, 'movie') },
    { id: "biography", title: "True Stories", fetcher: () => contentApi.discover({ with_genres: '99,36', sort_by: 'vote_average.desc' }, 'movie') },
    // Curated Collections
    { id: "bangers", title: "Top Rated Bangers", fetcher: () => contentApi.getBangers('movie') },
    { id: "bangers_tv", title: "Best TV Series Ever", fetcher: () => contentApi.getBangers('tv') },
    { id: "classics", title: "Modern Classics", fetcher: () => contentApi.getClassics('movie') },
    { id: "underrated", title: "Hidden Gems", fetcher: () => contentApi.getUnderrated('movie') },
    { id: "fresh", title: "Fresh This Year", fetcher: () => contentApi.getFresh('movie') },
    { id: "fresh_tv", title: "New Series to Binge", fetcher: () => contentApi.getFresh('tv') },
    // Quick Watches & Mood
    { id: "short", title: "Quick Watch (<100m)", fetcher: contentApi.getShortAndSweet },
    { id: "feelgood", title: "Feel Good Movies", fetcher: contentApi.getFeelGood },
    // Additional Genres
    { id: "western", title: "Wild West", fetcher: () => contentApi.getByGenre(37, 'movie') },
    { id: "war", title: "War & History", fetcher: () => contentApi.getByGenre(10752, 'movie') },
    { id: "crime", title: "Crime & Gangs", fetcher: () => contentApi.getByGenre(80, 'movie') },
    { id: "music", title: "Music & Performance", fetcher: () => contentApi.getByGenre(10402, 'movie') },
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

    // Fetch Heavy Hitters for Hero
    const { data: heavyHitters } = useQuery<Content[]>({
        queryKey: ["hero", "heavy-hitters"],
        queryFn: () => contentApi.getHeroHeavyHitters('all'),
        staleTime: 1000 * 60 * 30 // Cache for 30 mins
    });

    const [heroItems, setHeroItems] = useState<Content[]>([]);

    useEffect(() => {
        console.log("[DashboardPage] heavyHitters changed:", heavyHitters?.length);
        if (heavyHitters && heavyHitters.length > 0) {
            // Shuffle to keep it fresh on each visit
            const shuffled = [...heavyHitters].sort(() => Math.random() - 0.5).slice(0, 5);
            console.log("[DashboardPage] Setting heroItems:", shuffled.length);
            setHeroItems(shuffled);
        }
    }, [heavyHitters]);

    return (
        <div className="min-h-screen bg-[#141414] pb-20 relative">
            {/* Minimalist Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
            
            <Hero items={heroItems} />

            {/* Content Rails */}
            <div className="relative z-10 -mt-12 sm:-mt-24 space-y-8 md:space-y-10 pb-24">

                {/* Continue Watching Rail */}
                <ContinueWatchingRail />

                {/* Because You Watched Rail */}
                <BecauseYouWatchedRail />

                {RAIL_CONFIGS.slice(0, Math.min(visibleCount, 4)).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* First Brand Block - Move Higher (after 4 rails) */}
                {visibleCount >= 4 && (
                    <BrandBlock 
                        text="Your Universe of Entertainment"
                        subtext="Thousands of movies, series, and anime at your fingertips"
                        gradient="bg-gradient-to-r from-red-950/40 via-purple-950/40 to-blue-950/40"
                        icon={<Sparkles className="w-16 h-16 text-red-500" />}
                        bgImage="https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&q=80&w=2000"
                    />
                )}

                {RAIL_CONFIGS.slice(4, Math.min(visibleCount, 15)).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Second Brand Block */}
                {visibleCount >= 15 && (
                    <BrandBlock 
                        text="Discover Hidden Gems"
                        subtext="Curated collections for every mood and moment"
                        gradient="bg-gradient-to-r from-amber-950/40 via-rose-950/40 to-purple-950/40"
                        icon={<Film className="w-16 h-16 text-amber-500" />}
                        bgImage="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000"
                    />
                )}

                {RAIL_CONFIGS.slice(15, visibleCount).map((config) => (
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
