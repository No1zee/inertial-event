"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Tv2, Zap } from "lucide-react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { BrandBlock } from "@/components/brand/BrandBlock";
import { contentApi } from "@/lib/api/content";
import ContentModal from "@/components/content/ContentModal";

import { useHistoryStore } from "@/lib/store/historyStore";
import { useHydrated } from "@/hooks/useHydrated";

const TV_RAILS = [
    // Fresh & New
    { id: "day1", title: "Day 1 Drops 💧", fetcher: () => contentApi.getDayOneDrops('tv') },
    { id: "fresh", title: "Fresh Seasons 🔥", fetcher: () => contentApi.getFresh('tv') },
    { id: "popular", title: "Most Popular Series", fetcher: () => contentApi.getPopularTV() },
    // Curated Collections
    { id: "bangers", title: "Binge-Worthy Bangers 💯", fetcher: () => contentApi.getBangers('tv') },
    { id: "underrated", title: "Underrated Series 💎", fetcher: () => contentApi.getUnderrated('tv') },
    { id: "classics", title: "TV Hall of Fame 🏆", fetcher: () => contentApi.getClassics('tv') },
    { id: "acclaimed", title: "Critically Acclaimed", fetcher: () => contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': '1000' }, 'tv') },
    // Drama & Prestige
    { id: "drama", title: "Bingeable Dramas 🎭", fetcher: () => contentApi.getByGenre(18, 'tv') },
    { id: "mystery", title: "Mystery & Suspense", fetcher: () => contentApi.getByGenre(9648, 'tv') },
    { id: "war", title: "War & History", fetcher: () => contentApi.getByGenre(10768, 'tv') },
    // Comedy & Sitcoms
    { id: "comedy", title: "Sitcom Staples 😂", fetcher: () => contentApi.getByGenre(35, 'tv') },
    { id: "family", title: "Family Shows", fetcher: () => contentApi.getByGenre(10751, 'tv') },
    { id: "kids", title: "Kids & Family", fetcher: () => contentApi.getByGenre(10762, 'tv') },
    // Crime & Action
    { id: "crime", title: "Crime & Punishment 🕵️", fetcher: () => contentApi.getByGenre(80, 'tv') },
    { id: "action", title: "Action-Packed Series", fetcher: () => contentApi.getByGenre(10759, 'tv') },
    // Sci-Fi & Fantasy
    { id: "scifi", title: "Worlds Beyond 👽", fetcher: () => contentApi.getByGenre(10765, 'tv') },
    { id: "animation", title: "Animated Series", fetcher: () => contentApi.getByGenre(16, 'tv') },
    { id: "anime", title: "Anime Hits", fetcher: () => contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc' }, 'tv') },
    // Reality & Documentary
    { id: "reality", title: "Reality Bites 📺", fetcher: () => contentApi.getByGenre(10764, 'tv') },
    { id: "docu", title: "Real Stories 📚", fetcher: () => contentApi.getByGenre(99, 'tv') },
    { id: "talk", title: "Talk Shows & News", fetcher: () => contentApi.getByGenre(10767, 'tv') },
    // International
    { id: "soap", title: "Soap Opera", fetcher: () => contentApi.getByGenre(10766, 'tv') },
    { id: "western", title: "Western Series", fetcher: () => contentApi.getByGenre(37, 'tv') },
];

export default function TVShowsPage() {
    const { data: heavyHitters } = useQuery<Content[]>({
        queryKey: ["hero", "tv-heavy-hitters"],
        queryFn: () => contentApi.getHeroHeavyHitters('tv'),
        staleTime: 1000 * 60 * 30
    });

    const [rails, setRails] = useState(TV_RAILS);
    const lastWatched = useHistoryStore(state => state.getLastWatched());
    const hydrated = useHydrated();

    useEffect(() => {
        // Keep "Day 1" at top
        const first = TV_RAILS[0];
        const others = [...TV_RAILS.slice(1)];
        const shuffled = others.sort(() => Math.random() - 0.5);
        setRails([first, ...shuffled]);
    }, []);

    const heroItems = heavyHitters?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-[#141414] pb-20 relative">
            {/* Grid/Digital Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />

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

                {rails.slice(0, 4).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Brand Block - Binge Culture */}
                <BrandBlock 
                    text="Your Next Obsession"
                    subtext="Epic series. Unforgettable characters. Endless episodes."
                    gradient="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40"
                    icon={<Tv2 className="w-16 h-16 text-blue-500" />}
                    bgImage="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=2000"
                />

                {rails.slice(4, 12).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Second Brand Block */}
                <BrandBlock 
                    text="Binge. Repeat. Discover."
                    subtext="From sitcoms to epics, your series journey starts here"
                    gradient="bg-gradient-to-r from-cyan-950/40 via-teal-950/40 to-emerald-950/40"
                    icon={<Zap className="w-16 h-16 text-cyan-500" />}
                    bgImage="https://images.unsplash.com/photo-1461151351179-8143666f09ad?auto=format&fit=crop&q=80&w=2000"
                />

                {rails.slice(12).map((config) => (
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
