"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";

import { useHistoryStore } from "@/lib/store/historyStore";

const MOVIE_RAILS = [
    { id: "day1", title: "Day 1 Drops", fetcher: () => contentApi.getDayOneDrops('movie') },
    { id: "fresh", title: "Freshly Baked", fetcher: () => contentApi.getFresh('movie') },
    { id: "bangers", title: "Certified Bangers", fetcher: () => contentApi.getBangers('movie') },
    { id: "underrated", title: "Hidden Gems", fetcher: () => contentApi.getUnderrated('movie') },
    { id: "classics", title: "Timeless Classics", fetcher: () => contentApi.getClassics('movie') },
    { id: "adrenaline", title: "High Octane Action", fetcher: () => contentApi.getByGenre(28, 'movie') }, // Action
    { id: "scifi", title: "Sci-Fi & Fantasy", fetcher: () => contentApi.getByGenre(878, 'movie') }, // Sci-Fi
    { id: "horror", title: "Late Night Horror", fetcher: () => contentApi.getByGenre(27, 'movie') }, // Horror
    { id: "comedy", title: "Comedy Hits", fetcher: () => contentApi.getByGenre(35, 'movie') }, // Comedy
    { id: "romance", title: "Romantic Picks", fetcher: () => contentApi.getByGenre(10749, 'movie') }, // Romance
    { id: "family", title: "Family Movie Night", fetcher: () => contentApi.getByGenre(10751, 'movie') }, // Family
    { id: "acclaimed", title: "Critically Acclaimed", fetcher: () => contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': '3000' }, 'movie') },
];

export default function MoviesPage() {
    const { data: trending } = useQuery({
        queryKey: ["trending", "movie", "hero"],
        queryFn: contentApi.getTrending,
        staleTime: 1000 * 60 * 10
    });

    const [rails, setRails] = useState(MOVIE_RAILS);
    const lastWatched = useHistoryStore(state => state.getLastWatched());

    useEffect(() => {
        // Keep "Day 1" (first index) at top, shuffle the rest
        const first = MOVIE_RAILS[0];
        const others = [...MOVIE_RAILS.slice(1)];
        const shuffled = others.sort(() => Math.random() - 0.5);
        setRails([first, ...shuffled]);
    }, []);

    const heroItems = trending?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-[#141414] pb-20">
            <Hero items={heroItems} />
            <div className="relative z-10 -mt-20 space-y-12 pl-4 lg:pl-12 opacity-95">
                {/* Recommendations Rail */}
                {lastWatched && (
                    <AsyncRail
                        config={{
                            id: "recs",
                            title: `Because You Watched ${lastWatched.title}`,
                            fetcher: () => contentApi.getSimilar(lastWatched.id, lastWatched.type)
                        }}
                    />
                )}

                {rails.map((config) => (
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
