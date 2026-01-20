"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content/ContentCard";
import { ContentCardSkeleton } from "@/components/content/ContentCardSkeleton";
import { Filter } from "lucide-react";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";
import { FilterOverlay } from "@/components/browse/FilterOverlay";
import { GenreGrid } from "@/components/browse/GenreGrid";
import { useSearchParams } from "next/navigation";
import { ContentRail } from "@/components/content/ContentRail";

interface FilterState {
    genres: string[];
    type: 'movie' | 'tv' | 'all';
    sort: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';
}

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company');

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        genres: [],
        type: 'all',
        sort: 'popularity.desc'
    });

    const toggleGenre = (id: string) => {
        setFilters(prev => ({
            ...prev,
            genres: prev.genres.includes(id) 
                ? prev.genres.filter(g => g !== id)
                : [...prev.genres, id]
        }));
    };

    // If filters are active, show Grid. If clean, show Abundant Layout.
    // Also consider it "dirty" if a company filter is active
    const isClean = filters.genres.length === 0 && filters.type === 'all' && filters.sort === 'popularity.desc' && !companyId;

    // Fetch Search/Filtered Results
    const { data: filteredItems, isLoading: isSearchLoading } = useQuery({
        queryKey: ["browse-search", filters, companyId],
        queryFn: async () => {
            if (isClean) return []; // Don't fetch if clean (we show rails instead)
            
            const params: any = { sort_by: filters.sort, page: 1 };
            if (filters.genres.length > 0) params.with_genres = filters.genres.join(",");
            if (companyId) params.with_companies = companyId;

            if (filters.type === 'all') {
                const [movies, tv] = await Promise.all([
                    contentApi.discover({ ...params }, 'movie'),
                    contentApi.discover({ ...params }, 'tv')
                ]);
                return [...movies, ...tv].sort(() => Math.random() - 0.5);
            } else {
                return contentApi.discover(params, filters.type);
            }
        },
        enabled: !isClean,
        staleTime: 1000 * 60 * 5
    });

    // Curated Rails Config
    const CURATED_RAILS = [
        { id: "top_rated", title: "Critical Acclaim", fetcher: () => contentApi.getBangers('movie') },
        { id: "underrated", title: "Underrated Gems", fetcher: () => contentApi.getUnderrated('movie') },
        { id: "global", title: "Global Hits", fetcher: () => contentApi.discover({ with_original_language: 'es|fr|ko|ja', sort_by: 'popularity.desc' }, 'tv') },
        { id: "new_releases", title: "Freshly Dropped", fetcher: contentApi.getFresh },
    ];

    return (
        <div className="min-h-screen bg-[#141414] pt-24 px-4 md:px-12 pb-20 space-y-10">
            {/* Header Area */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Explore</h1>
                        <p className="text-zinc-400 text-sm max-w-xl">
                            Dive deep into our massive collection of movies and TV shows.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all hover:border-white/20"
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

                {/* Genre Grid - Always Visible for Quick Access */}
                <GenreGrid selectedGenres={filters.genres} onToggleGenre={toggleGenre} />
            </div>

            {/* Content Area */}
            {isClean ? (
                // ABUNDANT LAYOUT (Default)
                <div className="space-y-12 animate-in fade-in duration-500">
                     {/* 1. Curated Rails */}
                     {CURATED_RAILS.map(rail => (
                         <StartAsyncRail key={rail.id} config={rail} />
                     ))}

                     {/* 2. Infinite Grid (Trending base) */}
                     <div>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            Trending Now <span className="text-zinc-500 text-sm font-normal">(All Categories)</span>
                        </h2>
                        <TrendingGrid />
                     </div>
                </div>
            ) : (
                // FILTERED GRID RESULT
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-medium text-white mb-6">
                        {filteredItems?.length || 0} Results Found
                    </h2>
                    
                    {isSearchLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {Array(12).fill(0).map((_, i) => <ContentCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {filteredItems?.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-zinc-500">
                                    No content found matching filters.
                                </div>
                            ) : (
                                filteredItems?.map((item: Content) => (
                                    <ContentCard key={`${item.type}-${item.id}`} item={item} />
                                ))
                            )}
                        </div>
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

// Sub-components for cleaner file
function StartAsyncRail({ config }: { config: any }) {
    const { data, isLoading } = useQuery<Content[]>({
        queryKey: ["browse-rail", config.id],
        queryFn: config.fetcher,
        staleTime: 1000 * 60 * 30
    });

    if (isLoading) return <div className="h-64 rounded-xl bg-zinc-900/10 animate-pulse mb-8" />;
    
    // Ensure data is an array
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return (
        <div className="mb-2">
            <ContentRail title={config.title} items={data} railId={config.id} />
        </div>
    );
}

function TrendingGrid() {
    const { data: items, isLoading } = useQuery({
        queryKey: ["browse-trending"],
        queryFn: contentApi.getTrending,
        staleTime: 1000 * 60 * 5
    });

    if (isLoading) return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {Array(12).fill(0).map((_, i) => <ContentCardSkeleton key={i} />)}
        </div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {items?.map((item: Content) => (
                <ContentCard key={`trend-${item.id}`} item={item} />
            ))}
        </div>
    );
}
