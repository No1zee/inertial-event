"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content/ContentCard";
import { ContentCardSkeleton } from "@/components/content/ContentCardSkeleton";
import { Filter } from "lucide-react";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";
import { FilterOverlay } from "@/components/browse/FilterOverlay";

interface FilterState {
    genres: string[];
    type: 'movie' | 'tv' | 'all';
    sort: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';
}

export default function BrowsePage() {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        genres: [],
        type: 'all',
        sort: 'popularity.desc'
    });

    const { data: items, isLoading } = useQuery({
        queryKey: ["browse", filters],
        queryFn: async () => {
            // Build params for discover
            const params: any = {
                sort_by: filters.sort,
                page: 1
            };
            if (filters.genres.length > 0) {
                params.with_genres = filters.genres.join(",");
            }

            // Decide fetcher based on type
            if (filters.type === 'all') {
                if (filters.genres.length === 0 && filters.sort === 'popularity.desc') {
                    return contentApi.getTrending();
                } else {
                    const [movies, tv] = await Promise.all([
                        contentApi.discover(params, 'movie'),
                        contentApi.discover(params, 'tv')
                    ]);
                    return [...movies, ...tv].sort(() => Math.random() - 0.5);
                }
            } else {
                return contentApi.discover(params, filters.type);
            }
        },
        staleTime: 1000 * 60 * 5
    });

    return (
        <div className="space-y-6 pt-24 px-4 md:px-12 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Browse</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        {filters.type === 'all' ? 'All Content' : filters.type === 'movie' ? 'Movies' : 'TV Shows'}
                        {filters.genres.length > 0 && ` • ${filters.genres.length} filters active`}
                    </p>
                </div>

                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <Filter size={16} />
                    <span>Filters</span>
                    {filters.genres.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                            {filters.genres.length}
                        </span>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {Array(12).fill(0).map((_, i) => (
                        <ContentCardSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {items?.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-zinc-500">
                            No content found matching your filters.
                        </div>
                    ) : (
                        items?.map((item: Content) => (
                            <ContentCard key={`${item.type}-${item.id}`} item={item} />
                        ))
                    )}
                </div>
            )}

            <FilterOverlay
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
            />
        </div>
    );
}
