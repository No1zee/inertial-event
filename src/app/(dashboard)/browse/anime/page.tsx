"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Bird, Star } from "lucide-react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { BrandBlock } from "@/components/brand/BrandBlock";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";

import { useHistoryStore } from "@/lib/store/historyStore";
import { useHydrated } from "@/hooks/useHydrated";

const ANIME_RAILS = [
    { id: "english_original", title: "Dubbed Hits & English Originals 🎤", fetcher: () => contentApi.getEnglishAnime(1) },
    { id: "popular", title: "All Time Legends 🌟", fetcher: () => contentApi.getAnime(1) },
    { id: "shonen", title: "Shonen Power 👊", fetcher: () => contentApi.getAnimeByGenre("with_genres=10759") }, // Action/Adventure
    { id: "simulcasts", title: "Hot Simulcasts 🔥", fetcher: () => contentApi.getAnime(2) },
    { id: "isekai", title: "Isekai Worlds 🌍", fetcher: () => contentApi.getAnimeByGenre("with_keywords=210024") },
    { id: "sol", title: "Slice of Life 🍰", fetcher: () => contentApi.getAnimeByGenre("with_keywords=9840") },
    { id: "dark", title: "Dark Fantasy & Horror 🌑", fetcher: () => contentApi.getAnimeByGenre("with_keywords=209252") },
    { id: "mecha", title: "Mecha & Cyberpunk 🤖", fetcher: () => contentApi.getAnimeByGenre("with_keywords=10701") },
    { id: "romance", title: "Romance & Heartbreak 💔", fetcher: () => contentApi.getAnimeByGenre("with_genres=10749") },
    { id: "comedy", title: "Comedy & Gag Shows 😂", fetcher: () => contentApi.getAnimeByGenre("with_genres=35") },
    { id: "supernatural", title: "Supernatural & Magic ✨", fetcher: () => contentApi.getAnimeByGenre("with_genres=10765") },
    { id: "sports", title: "Sports Spirit 🏀", fetcher: () => contentApi.getAnimeByGenre("with_keywords=6075") },
    { id: "psych", title: "Psychological Thrillers 🧠", fetcher: () => contentApi.getAnimeByGenre("with_genres=9648") },
    { id: "seinen", title: "Mature Seinen 🔞", fetcher: () => contentApi.getAnimeByGenre("with_keywords=210393&vote_average.gte=7") },
    { id: "movies", title: "Anime Movie Night 🍿", fetcher: () => contentApi.discover({ with_genres: '16', sort_by: 'popularity.desc' }, 'movie') },
    { id: "classics", title: "Timeless Classics 🏆", fetcher: () => contentApi.getAnimeByGenre("first_air_date.lte=2010-01-01&vote_average.gte=8") },
];

export default function AnimePage() {
    const { data: anime } = useQuery({
        queryKey: ["anime", "hero"],
        queryFn: () => contentApi.getEnglishAnime(), // Bias hero towards English-friendly content
        staleTime: 1000 * 60 * 10
    });

    const [rails, setRails] = useState(ANIME_RAILS);
    const lastWatched = useHistoryStore(state => state.getLastWatched());
    const hydrated = useHydrated();

    useEffect(() => {
        // Boost English hits to the top, shuffle the rest
        const englishHits = ANIME_RAILS[0];
        const others = [...ANIME_RAILS.slice(1)].sort(() => Math.random() - 0.5);
        setRails([englishHits, ...others]);
    }, []);

    const heroItems = anime?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-[#141414] pb-20 relative">
            {/* Vibrant Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] mix-blend-overlay" />

            <Hero items={heroItems} />
            <div className="relative z-10 -mt-12 sm:-mt-20 space-y-8 md:space-y-12 pl-4 lg:pl-12 opacity-95">
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

                {rails.slice(0, 3).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Brand Block - Anime Culture */}
                <BrandBlock 
                    text="Your Gateway to Japan"
                    subtext="From shonen battles to slice-of-life moments, adventure awaits"
                    gradient="bg-gradient-to-r from-pink-950/40 via-rose-950/40 to-red-950/40"
                    icon={<Bird className="w-16 h-16 text-pink-500" />}
                    bgImage="https://images.unsplash.com/photo-1578632738908-4521bd8c7cd9?auto=format&fit=crop&q=80&w=2000"
                />

                {rails.slice(3, 10).map((config) => (
                    <AsyncRail key={config.id} config={config} />
                ))}

                {/* Second Brand Block */}
                <BrandBlock 
                    text="Immerse. Dream. Believe."
                    subtext="Where art meets storytelling in the most vibrant way"
                    gradient="bg-gradient-to-r from-violet-950/40 via-fuchsia-950/40 to-pink-950/40"
                    icon={<Star className="w-16 h-16 text-violet-400" />}
                    bgImage="https://images.unsplash.com/photo-1541562232579-512a21359920?auto=format&fit=crop&q=80&w=2000"
                />

                {rails.slice(10).map((config) => (
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
        queryKey: ["rail", "anime", config.id],
        queryFn: () => config.fetcher(),
        staleTime: 1000 * 60 * 30
    });

    if (isLoading) return <div className="h-64 bg-zinc-900/10 animate-pulse rounded-xl" />;
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return <ContentRail title={config.title} items={data} railId={config.id} />;
}
