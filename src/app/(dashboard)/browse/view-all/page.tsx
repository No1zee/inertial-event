"use client";

import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { contentApi } from "@/lib/api/content";
import { ContentCard } from "@/components/content/ContentCard";
import { ContentModal } from "@/components/content/ContentModal";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Content } from "@/lib/types/content";

export default function ViewAllPage() {
    const searchParams = useSearchParams();
    const railId = searchParams.get("id");
    const title = searchParams.get("title") || "Explore";
    const { ref, inView } = useInView({
        threshold: 0
    });

    // Map rail IDs to fetchers
    const fetchContent = async ({ pageParam = 1 }) => {
        if (!railId) return [];

        switch (railId) {
            case "trending": return contentApi.getTrending();
            case "popular_tv": return contentApi.getPopularTV();
            case "scifi": return contentApi.getByGenre(878, 'movie', pageParam);
            case "action": return contentApi.getByGenre(28, 'movie', pageParam);
            case "cbm": return contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc', page: pageParam }, 'movie');
            case "a24": return contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc', page: pageParam }, 'movie');
            case "romcom": return contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc', page: pageParam }, 'movie');
            case "short": return contentApi.getShortAndSweet(pageParam);
            case "feelgood": return contentApi.getFeelGood(pageParam);
            case "horror": return contentApi.getByGenre(27, 'movie', pageParam);
            case "anime": return contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc', page: pageParam }, 'tv');
            case "docu": return contentApi.getByGenre(99, 'movie', pageParam);

            // TV Mappings
            case "day1": return contentApi.getDayOneDrops('tv');
            case "fresh": return contentApi.getFresh('tv', pageParam);
            case "bangers": return contentApi.getBangers('tv', pageParam);
            case "underrated": return contentApi.getUnderrated('tv', pageParam);
            case "classics": return contentApi.getClassics('tv', pageParam);
            case "drama": return contentApi.getByGenre(18, 'tv', pageParam);
            case "comedy": return contentApi.getByGenre(35, 'tv', pageParam);
            case "crime": return contentApi.getByGenre(80, 'tv', pageParam);
            case "bg_scifi": return contentApi.getByGenre(10765, 'tv', pageParam);
            case "reality": return contentApi.getByGenre(10764, 'tv', pageParam);

            // Movie Mappings (if duplicate IDs exist, we need smarter mapping, but current IDs are unique enough)
            case "popular_movies": return contentApi.discover({ sort_by: 'popularity.desc', page: pageParam }, 'movie');
            case "top_rated_movies": return contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': 1000, page: pageParam }, 'movie');

            // Add Anime page specific mappings if needed (e.g. shonen, seinen)
            // For now 'anime' covers the main one.

            default: return [];
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ["view-all", railId],
        queryFn: fetchContent,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length > 0 ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5 // 5 mins
    });

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const items = data?.pages.flat() || [];

    return (
        <div className="min-h-screen bg-[#141414] pt-24 px-4 md:px-12 pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/browse" className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
                    <ChevronLeft size={24} className="text-white" />
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {items.map((item: Content, i: number) => (
                    <ContentCard key={`${item.id}-${i}`} item={item} />
                ))}
            </div>

            {/* Spinner or End Message */}
            <div ref={ref} className="h-24 flex items-center justify-center mt-12">
                {isFetchingNextPage ? (
                    <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : hasNextPage ? (
                    <span className="text-zinc-500 text-sm">Scroll for more</span>
                ) : items.length > 0 ? (
                    <span className="text-zinc-600 text-sm">End of list</span>
                ) : (
                    status !== 'pending' && <span className="text-zinc-500">No content found.</span>
                )}
            </div>
        </div>
    );
}
