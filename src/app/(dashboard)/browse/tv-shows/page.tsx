"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { contentApi } from "@/lib/api/content";
import ContentModal from "@/components/content/ContentModal";

import { useHistoryStore } from "@/lib/store/historyStore";

const TV_RAILS = [
    { id: "day1", title: "Day 1 Drops 💧", fetcher: () => contentApi.getDayOneDrops('tv') },
    { id: "fresh", title: "Fresh Seasons 🔥", fetcher: () => contentApi.getFresh('tv') },
    { id: "bangers", title: "Binge-Worthy Bangers 💯", fetcher: () => contentApi.getBangers('tv') },
    { id: "underrated", title: "Underrated Series 💎", fetcher: () => contentApi.getUnderrated('tv') },
    { id: "classics", title: "TV Hall of Fame 🏆", fetcher: () => contentApi.getClassics('tv') },
    { id: "drama", title: "Bingeable Dramas 🎭", fetcher: () => contentApi.getByGenre(18, 'tv') },
    { id: "comedy", title: "Sitcom Staples 😂", fetcher: () => contentApi.getByGenre(35, 'tv') },
    { id: "crime", title: "Crime & Punishment 🕵️", fetcher: () => contentApi.getByGenre(80, 'tv') },
    { id: "scifi", title: "Worlds Beyond 👽", fetcher: () => contentApi.getByGenre(10765, 'tv') },
    { id: "reality", title: "Reality Bites 📺", fetcher: () => contentApi.getByGenre(10764, 'tv') },
    { id: "docu", title: "Real Stories 📚", fetcher: () => contentApi.getByGenre(99, 'tv') },
];

export default function TVShowsPage() {
    const { data: popular } = useQuery({
        queryKey: ["popular", "tv", "hero"],
        queryFn: contentApi.getPopularTV,
        staleTime: 1000 * 60 * 10
    });

    const [rails, setRails] = useState(TV_RAILS);
    const lastWatched = useHistoryStore(state => state.getLastWatched());

    useEffect(() => {
        // Keep "Day 1" at top
        const first = TV_RAILS[0];
        const others = [...TV_RAILS.slice(1)];
        const shuffled = others.sort(() => Math.random() - 0.5);
        setRails([first, ...shuffled]);
    }, []);

    const heroItems = popular?.slice(0, 5) || [];

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

import { Content } from "@/lib/types/content";

// ... existing code ...

interface RailConfig {
    id: string;
    title: string;
    fetcher: () => Promise<Content[]>;
}

function AsyncRail({ config }: { config: RailConfig }) {
    const { data, isLoading } = useQuery<Content[]>({
        queryKey: ["rail", "tv", config.id],
        queryFn: () => config.fetcher(),
        staleTime: 1000 * 60 * 30
    });

    if (isLoading) return <div className="h-64 bg-zinc-900/10 animate-pulse rounded-xl" />;
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return <ContentRail title={config.title} items={data} railId={config.id} />;
}
