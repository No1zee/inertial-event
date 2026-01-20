"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { contentApi } from "@/lib/api/content";
import { ContentCard } from "@/components/content/ContentCard";
import { Loader2, SearchX } from "lucide-react";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) return;
            setLoading(true);
            const data = await contentApi.search(query);
            setResults(data);
            setLoading(false);
        };

        const timeoutId = setTimeout(fetchResults, 300); // Debounce if valid, but here we run once
        return () => clearTimeout(timeoutId);
    }, [query]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        );
    }

    if (!results.length && query) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 gap-4">
                <SearchX size={64} />
                <p className="text-lg">No results found for "{query}"</p>
            </div>
        );
    }

    return (
        <div className="p-8 pt-20">
            <h1 className="text-2xl font-bold mb-6 text-white">Search Results for "{query}"</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {results.map((item) => (
                    <ContentCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
