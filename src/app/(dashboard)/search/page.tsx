"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { contentApi } from "@/lib/api/content";
import { ContentCard } from "@/components/content/ContentCard";
import { SearchBar } from "@/components/content/SearchBar";
import { Loader2, SearchX, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") || "";
    const initialIsAi = searchParams.get("ai") === "true";

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAi, setIsAi] = useState(initialIsAi);

    const fetchResults = useCallback(async (q: string, aiMode: boolean) => {
        if (!q) return;
        setLoading(true);
        try {
            const data = aiMode 
                ? await (contentApi as any).semanticSearch(q)
                : await contentApi.search(q);
            setResults(data);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialQuery) {
            fetchResults(initialQuery, isAi);
        }
    }, [initialQuery, isAi, fetchResults]);

    const handleSearch = (newQuery: string, aiMode?: boolean) => {
        const params = new URLSearchParams();
        params.set("q", newQuery);
        if (aiMode) params.set("ai", "true");
        router.push(`/search?${params.toString()}`);
        setIsAi(!!aiMode);
    };

    return (
        <div className="p-8 pt-24 min-h-screen">
            <div className="flex flex-col items-center mb-12">
                <SearchBar 
                    onSearch={handleSearch} 
                    placeholder="Search for movies, TV shows, anime..."
                    loading={loading}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                    <Loader2 className={cn(
                        "w-12 h-12 animate-spin",
                        isAi ? "text-purple-500" : "text-red-500"
                    )} />
                    <p className={cn(
                        "text-sm font-medium animate-pulse",
                        isAi ? "text-purple-400" : "text-zinc-500"
                    )}>
                        {isAi ? "AI is analyzing vibes..." : "Searching..."}
                    </p>
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h1 className="text-xl font-medium text-zinc-400 flex items-center gap-2">
                            {isAi && <Sparkles size={18} className="text-purple-400" />}
                            Search Results for <span className="text-white font-bold">"{initialQuery}"</span>
                        </h1>
                        <span className="text-sm text-zinc-500">{results.length} titles found</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                        {results.map((item) => (
                            <ContentCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            ) : initialQuery ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 gap-6 animate-in zoom-in-95 duration-500">
                    <div className="p-8 rounded-full bg-zinc-900/50 border border-white/5">
                        <SearchX size={64} className="text-zinc-700" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-xl font-bold text-white">No results found</p>
                        <p className="text-sm max-w-xs">We couldn't find anything matching "{initialQuery}". Try a broader query or use AI Search for better matching.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 gap-6">
                    <div className="text-center space-y-4">
                        <p className="text-xl font-medium">Ready to discover?</p>
                        <p className="text-sm text-zinc-600 max-w-sm">Use standard search for direct titles, or switch to AI Search to find content based on mood, vibes, or descriptions.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
