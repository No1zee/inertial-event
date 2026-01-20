"use client";

import { useEffect, useState } from "react";
import { Content } from "@/lib/types/content";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { ContentCard } from "@/components/content/ContentCard";
import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";

export default function HistoryPage() {
    const history = useHistoryStore((state) => state.history);
    const { librarySort, setLibrarySort } = useSettingsStore();
    const { clearHistory } = useHistoryStore();
    const [mounted, setMounted] = useState(false);

    // Sorted history
    const sortedHistory = [...history].sort((a, b) => {
        if (librarySort === 'az') {
            return a.title.localeCompare(b.title);
        }
        // Recent (Default)
        return (b.lastWatched || 0) - (a.lastWatched || 0);
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#141414] p-8 pb-20 pt-24">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">History</h1>
                
                <div className="flex items-center gap-4">
                    {history.length > 0 && (
                        <div className="flex items-center bg-zinc-900 rounded-lg px-3 py-1.5 border border-white/10">
                            <ArrowUpDown size={14} className="text-zinc-500 mr-2" />
                            <select 
                                value={librarySort}
                                onChange={(e) => setLibrarySort(e.target.value as any)}
                                className="bg-transparent text-sm font-medium text-zinc-300 focus:outline-none cursor-pointer"
                            >
                                <option value="recent">Recently Watched</option>
                                <option value="az">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                    )}

                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
                        >
                            Clear History
                        </button>
                    )}
                </div>
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500">
                    <p className="text-lg">No history yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {sortedHistory.map((item) => (
                        <ContentCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
