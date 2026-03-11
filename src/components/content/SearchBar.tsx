import React, { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    onSearch: (query: string, isAi?: boolean) => void;
    placeholder?: string;
    loading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    placeholder = "Search for movies, TV shows, anime...",
    loading = false
}) => {
    const [query, setQuery] = useState("");
    const [isAiSearch, setIsAiSearch] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query, isAiSearch);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-3xl px-4 flex flex-col gap-4">
            <div className="relative group">
                <label htmlFor="ai-search-input" className="sr-only">
                    {isAiSearch ? "Describe what you want to watch" : "Search titles"}
                </label>
                <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                    isAiSearch ? "text-purple-400" : "text-neutral-500"
                )} size={20} />
                
                <input
                    id="ai-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isAiSearch ? "Describe what you want to watch... (e.g. 'dark sci-fi with robots')" : placeholder}
                    className={cn(
                        "w-full bg-neutral-900/80 backdrop-blur-xl border rounded-2xl py-5 pl-12 pr-32 text-lg focus:outline-none transition-all shadow-2xl",
                        isAiSearch 
                            ? "border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 text-purple-50 shadow-purple-500/10" 
                            : "border-neutral-800 focus:ring-4 focus:ring-red-500/20 text-white"
                    )}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="p-2 text-neutral-500 hover:text-white transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={20} />
                        </button>
                    )}
                    
                    <button
                        type="button"
                        onClick={() => setIsAiSearch(!isAiSearch)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-500 overflow-hidden relative group/ai",
                            isAiSearch 
                                ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                        )}
                        title={isAiSearch ? "Switch to standard search" : "Try AI Semantic Search"}
                    >
                        {isAiSearch && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        )}
                        <Sparkles size={16} className={isAiSearch ? "animate-pulse" : ""} />
                        <span className="hidden sm:inline">{isAiSearch ? "AI SEARCH" : "AI"}</span>
                    </button>
                </div>
            </div>

            {isAiSearch && (
                <div className="px-2 text-xs font-medium text-purple-400/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Powered by local Vector RAG Engine & Semantic Similarity
                </div>
            )}
        </form>
    );
};

export default SearchBar;
