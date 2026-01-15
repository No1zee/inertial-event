"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Hero } from "@/components/content/Hero";
import { ContentRail } from "@/components/content/ContentRail";
import { contentApi } from "@/lib/api/content";
import { ContentModal } from "@/components/content/ContentModal";

import { useHistoryStore } from "@/lib/store/historyStore";

const ANIME_RAILS = [
    { id: "popular", title: "All Time Legends 🌟", fetcher: () => contentApi.getAnime(1) },
    { id: "simulcasts", title: "Hot Simulcasts 🔥", fetcher: () => contentApi.getAnime(2) },
    { id: "shonen", title: "Shonen Power 👊", fetcher: () => contentApi.getAnimeByGenre("with_genres=10759") }, // Action/Adventure
    { id: "isekai", title: "Isekai Worlds 🌍", fetcher: () => contentApi.getAnimeByGenre("with_keywords=210024") },
    { id: "sol", title: "Slice of Life 🍰", fetcher: () => contentApi.getAnimeByGenre("with_keywords=9840") },
    { id: "dark", title: "Dark Fantasy & Horror 🌑", fetcher: () => contentApi.getAnimeByGenre("with_keywords=209252") },
    { id: "mecha", title: "Mecha & Cyberpunk 🤖", fetcher: () => contentApi.getAnimeByGenre("with_keywords=10701") },
    { id: "romance", title: "Romance & Heartbreak 💔", fetcher: () => contentApi.getAnimeByGenre("with_genres=10749") },
    { id: "sports", title: "Sports Spirit 🏀", fetcher: () => contentApi.getAnimeByGenre("with_keywords=6075") },
    { id: "psych", title: "Psychological Thrillers 🧠", fetcher: () => contentApi.getAnimeByGenre("with_genres=9648") },
    { id: "movies", title: "Movie Night 🍿", fetcher: () => contentApi.discover({ with_genres: '16', sort_by: 'popularity.desc' }, 'movie') },
];

export default function AnimePage() {
    const { data: anime } = useQuery({
        queryKey: ["anime", "hero"],
        queryFn: () => contentApi.getAnime(),
        staleTime: 1000 * 60 * 10
    });

    const [rails, setRails] = useState(ANIME_RAILS);
    const lastWatched = useHistoryStore(state => state.getLastWatched());

    useEffect(() => {
        // Shuffle everything for Anime
        const shuffled = [...ANIME_RAILS].sort(() => Math.random() - 0.5);
        setRails(shuffled);
    }, []);

    const heroItems = anime?.slice(0, 5) || [];

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
            <ContentModal />
        </div>
    );
}

function AsyncRail({ config }: { config: any }) {
    const { data, isLoading } = useQuery({
        queryKey: ["rail", "anime", config.id],
        queryFn: config.fetcher,
        staleTime: 1000 * 60 * 30
    });

    if (isLoading) return <div className="h-64 bg-zinc-900/10 animate-pulse rounded-xl" />;
    if (!data || data.length === 0) return null;

    return <ContentRail title={config.title} items={data} />;
}
