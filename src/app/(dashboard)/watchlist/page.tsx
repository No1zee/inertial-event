"use client";

import { useEffect, useState } from "react";
import { Content } from "@/lib/types/content";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { ContentCard } from "@/components/content/ContentCard";
import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";

export default function WatchlistPage() {
    const watchlist = useWatchlistStore((state) => state.watchlist);
    const { librarySort, setLibrarySort } = useSettingsStore();
    const [mounted, setMounted] = useState(false);

    // Sorted watchlist
    const sortedWatchlist = [...watchlist].sort((a, b) => {
        if (librarySort === 'az') {
            return a.title.localeCompare(b.title);
        }
        // Recently Added (Default)
        return (b.addedAt || 0) - (a.addedAt || 0);
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#141414] p-8 pb-20 pt-24">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">My List</h1>
                
                {watchlist.length > 0 && (
                    <div className="flex items-center bg-zinc-900 rounded-lg px-3 py-1.5 border border-white/10">
                        <ArrowUpDown size={14} className="text-zinc-500 mr-2" />
                        <select 
                            value={librarySort}
                            onChange={(e) => setLibrarySort(e.target.value as any)}
                            className="bg-transparent text-sm font-medium text-zinc-300 focus:outline-none cursor-pointer"
                        >
                            <option value="recent">Recently Added</option>
                            <option value="az">Alphabetical (A-Z)</option>
                        </select>
                    </div>
                )}
            </div>

            {watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500">
                    <p className="text-lg">Your watchlist is empty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {sortedWatchlist.map((item) => (
                        <ContentCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
