"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Clapperboard, Popcorn } from "lucide-react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { BrandBlock } from "@/components/brand/BrandBlock";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";

import { useHistoryStore } from "@/lib/store/historyStore";
import { useHydrated } from "@/hooks/useHydrated";

const MOVIE_RAILS = [
    // Fresh & New
    { id: "day1", title: "Day 1 Drops", fetcher: () => contentApi.getDayOneDrops('movie') },
    { id: "fresh", title: "Freshly Baked", fetcher: () => contentApi.getFresh('movie') },
    { id: "trending", title: "Trending Movies", fetcher: () => contentApi.getTrending() },
    // Curated Collections
    { id: "bangers", title: "Certified Bangers", fetcher: () => contentApi.getBangers('movie') },
    { id: "underrated", title: "Hidden Gems", fetcher: () => contentApi.getUnderrated('movie') },
    { id: "classics", title: "Timeless Classics", fetcher: () => contentApi.getClassics('movie') },
    { id: "acclaimed", title: "Critically Acclaimed", fetcher: () => contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': '3000' }, 'movie') },
    // Action & Adventure
    { id: "adrenaline", title: "High Octane Action", fetcher: () => contentApi.getByGenre(28, 'movie') },
    { id: "adventure", title: "Epic Adventures", fetcher: () => contentApi.getByGenre(12, 'movie') },
    { id: "thriller", title: "Edge of Your Seat", fetcher: () => contentApi.getByGenre(53, 'movie') },
    { id: "cbm", title: "Superheroes & Villains", fetcher: () => contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc' }, 'movie') },
    // Sci-Fi & Fantasy
    { id: "scifi", title: "Sci-Fi & Fantasy", fetcher: () => contentApi.getByGenre(878, 'movie') },
    { id: "fantasy", title: "Fantasy Worlds", fetcher: () => contentApi.getByGenre(14, 'movie') },
    // Horror & Mystery
    { id: "horror", title: "Late Night Horror", fetcher: () => contentApi.getByGenre(27, 'movie') },
    { id: "mystery", title: "Mystery & Suspense", fetcher: () => contentApi.getByGenre(9648, 'movie') },
    // Comedy & Romance
    { id: "comedy", title: "Comedy Hits", fetcher: () => contentApi.getByGenre(35, 'movie') },
    { id: "romcom", title: "Rom-Com Favorites", fetcher: () => contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc' }, 'movie') },
    { id: "romance", title: "Romantic Picks", fetcher: () => contentApi.getByGenre(10749, 'movie') },
    // Drama & Prestige
    { id: "drama", title: "Award-Winning Drama", fetcher: () => contentApi.getByGenre(18, 'movie') },
    { id: "a24", title: "A24 Indie Gems", fetcher: () => contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc' }, 'movie') },
    { id: "biography", title: "True Stories", fetcher: () => contentApi.discover({ with_genres: '99,36', sort_by: 'vote_average.desc' }, 'movie') },
    // Animation & Family
    { id: "animation", title: "Animated Classics", fetcher: () => contentApi.getByGenre(16, 'movie') },
    { id: "family", title: "Family Movie Night", fetcher: () => contentApi.getByGenre(10751, 'movie') },
    // Documentary
    { id: "docu", title: "Mind-Blowing Docs", fetcher: () => contentApi.getByGenre(99, 'movie') },
    // Additional Genres
    { id: "crime", title: "Crime & Gangs", fetcher: () => contentApi.getByGenre(80, 'movie') },
    { id: "war", title: "War & History", fetcher: () => contentApi.getByGenre(10752, 'movie') },
    { id: "western", title: "Wild West", fetcher: () => contentApi.getByGenre(37, 'movie') },
    { id: "music", title: "Music & Performance", fetcher: () => contentApi.getByGenre(10402, 'movie') },
    // Mood & Length
    { id: "short", title: "Quick Watch (<100m)", fetcher: contentApi.getShortAndSweet },
    { id: "feelgood", title: "Feel Good Movies", fetcher: contentApi.getFeelGood },
];

export default function MoviesPage() {
    const { data: heavyHitters } = useQuery<Content[]>({
        queryKey: ["hero", "movie-heavy-hitters"],
        queryFn: () => contentApi.getHeroHeavyHitters('movie'),
        staleTime: 1000 * 60 * 30
    });

    const [rails, setRails] = useState(MOVIE_RAILS);
    const lastWatched = useHistoryStore(state => state.getLastWatched());
    const hydrated = useHydrated();

    useEffect(() => {
        // Keep "Day 1" (first index) at top, shuffle the rest
        const first = MOVIE_RAILS[0];
        const others = [...MOVIE_RAILS.slice(1)];
        const shuffled = others.sort(() => Math.random() - 0.5);
        setRails([first, ...shuffled]);
    }, []);

    const heroItems = heavyHitters?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-[#141414] pb-20 relative">
            {/* Cinematic Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/dynamic-style.png')] mix-blend-overlay" />

            <Hero items={heroItems} />
            <div className="relative z-10 -mt-20 space-y-12 pl-4 lg:pl-12 opacity-95">
                {/* Recommendations Rail */}
                {hydrated && lastWatched && (
                    <AsyncRail
                        config={{
                            id: "recs",
                            title: `Because You Watched ${lastWatched.title}`,
                            fetcher: () => contentApi.getSimilar(lastWatched.id, lastWatched.type)
                        }}
                    />
                )}

                {rails.slice(0, 5).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Brand Block - Cinematic Experience */}
                <BrandBlock
                    text="The Big Screen Experience"
                    subtext="Cinema-quality entertainment, delivered to your screen"
                    gradient="bg-gradient-to-r from-yellow-950/40 via-red-950/40 to-orange-950/40"
                    icon={<Clapperboard className="w-16 h-16 text-yellow-500" />}
                    bgImage="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=2000"
                />

                {rails.slice(5, 15).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Second Brand Block */}
                <BrandBlock
                    text="Movie Night, Every Night"
                    subtext="From blockbusters to indie gems, your perfect movie awaits"
                    gradient="bg-gradient-to-r from-purple-950/40 via-pink-950/40 to-red-950/40"
                    icon={<Popcorn className="w-16 h-16 text-purple-500" />}
                    bgImage="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=2000"
                />

                {rails.slice(15).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}
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
        queryKey: ["rail", "movie", config.id],
        queryFn: () => config.fetcher(),
        staleTime: 1000 * 60 * 30
    });

    if (isLoading) return <div className="h-64 bg-zinc-900/10 animate-pulse rounded-xl" />;
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return <ContentRail title={config.title} items={data} railId={config.id} />;
}
