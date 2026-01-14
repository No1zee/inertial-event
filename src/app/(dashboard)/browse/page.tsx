"use client";

import { ContentCard } from "@/components/content/ContentCard";
import { Filter } from "lucide-react";

// Mock data generator
const generateItems = (count: number) => Array(count).fill(0).map((_, i) => ({
    id: i,
    title: `Content Title ${i + 1}`,
    poster: `/images/poster-${(i % 5) + 1}.jpg`, // Use placeholders or rotating logic
    rating: 85 + (i % 15),
    year: 2023 + (i % 2),
    type: i % 3 === 0 ? "Movie" : "TV Show"
}));

export default function BrowsePage() {
    const items = generateItems(24);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Browse</h1>

                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
                    <Filter size={16} />
                    <span>Filters</span>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
