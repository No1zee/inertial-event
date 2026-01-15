"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInView } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ContentCard } from "@/components/content/ContentCard";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";

export default function ViewAllPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const title = searchParams.get("title") || "Content";

    // Heuristic to determine fetcher based on title
    // This is a simple implementation, a robust one would pass a 'source' param

    const [items, setItems] = useState<Content[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const sentinelRef = useRef(null);
    const isInView = useInView(sentinelRef);

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            let newItems: Content[] = [];
            const isMovie = title.toLowerCase().includes("movie") || title.toLowerCase().includes("film");
            const isAnime = title.toLowerCase().includes("anime");
            const type = isAnime ? 'anime' : (isMovie ? 'movie' : 'tv');

            if (title.includes("Trending") || title.includes("Hot")) {
                newItems = await contentApi.getTrending(); // Trending doesn't always support pagination in the simple wrapper, depends on API update
            } else if (title.includes("Popular Series")) {
                newItems = await contentApi.getPopularTV();
            } else if (title.includes("Bangers")) {
                newItems = await contentApi.getBangers(type as any, page);
            } else if (title.includes("Classics")) {
                newItems = await contentApi.getClassics(type as any, page);
            } else if (title.includes("Underrated") || title.includes("Gems")) {
                newItems = await contentApi.getUnderrated(type as any, page);
            } else if (title.includes("Fresh") || title.includes("New")) {
                newItems = await contentApi.getFresh(type as any, page);
            } else if (title.includes("Day 1")) {
                newItems = await contentApi.getDayOneDrops(type as any); // Usually just 1 page
                setHasMore(false);
            } else if (isAnime) {
                newItems = await contentApi.getAnime(page);
            } else {
                // Fallback to trending or genre based logic if needed
                newItems = await contentApi.getTrending();
            }

            if (newItems.length === 0) {
                setHasMore(false);
            } else {
                // Deduplicate
                setItems(prev => {
                    const existingIds = new Set(prev.map(i => i.id));
                    const uniqueNew = newItems.filter(i => !existingIds.has(i.id));
                    return [...prev, ...uniqueNew];
                });
                setPage(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMore();
    }, []); // Initial load

    useEffect(() => {
        if (isInView) {
            loadMore();
        }
    }, [isInView]);

    return (
        <div className="min-h-screen pt-24 px-4 lg:px-12 pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="text-white" />
                </button>
                <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="aspect-[2/3]">
                        <ContentCard item={item} />
                    </div>
                ))}
            </div>

            {loading && (
                <div className="w-full py-12 flex justify-center">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            )}

            {!loading && hasMore && <div ref={sentinelRef} className="h-20" />}

            {!loading && !hasMore && items.length > 0 && (
                <p className="text-zinc-500 text-center py-12">You've reached the end of the line.</p>
            )}
        </div>
    );
}
